import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCompanion } from '@/lib/companions';
import { buildSystemPrompt } from '@/lib/companions';
import type { Message, MoodType } from '@/types/companion';
import { useToast } from '@/hooks/use-toast';

export function useChat(companionId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const companion = getCompanion(companionId);

  const sendMessage = useCallback(async (content: string) => {
    if (!companion || !userId) return;
    setIsLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: companionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const chatMessages = [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content },
      ];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatMessages,
            companionId,
            userId,
          }),
        }
      );

      if (resp.status === 429) {
        toast({ title: 'Rate limited', description: 'Please wait a moment and try again.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast({ title: 'Credits needed', description: 'Please add funds to continue.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error('Failed to stream');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.conversation_id === companionId + '-stream') {
                  return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, {
                  id: crypto.randomUUID(),
                  conversation_id: companionId + '-stream',
                  role: 'assistant',
                  content: assistantContent,
                  created_at: new Date().toISOString(),
                }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Finalize the assistant message
      setMessages(prev =>
        prev.map(m =>
          m.conversation_id === companionId + '-stream'
            ? { ...m, conversation_id: companionId }
            : m
        )
      );
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Chat failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [companion, userId, companionId, messages, toast]);

  const playVoice = useCallback(async (text: string) => {
    if (!companion) return;
    setIsPlayingVoice(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: text.slice(0, 500), voiceId: companion.voice_id }),
        }
      );
      if (!response.ok) throw new Error('TTS failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setIsPlayingVoice(false);
      await audio.play();
    } catch {
      toast({ title: 'Voice unavailable', description: 'Set up ElevenLabs API key for voice messages.', variant: 'destructive' });
      setIsPlayingVoice(false);
    }
  }, [companion, toast]);

  const generateImage = useCallback(async (context: string) => {
    if (!companion) return;
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: context, companionId, mood: 'neutral' },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        const imgMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: companionId,
          role: 'assistant',
          content: `*${companion.name} created an image for you* 🎨`,
          image_url: data.imageUrl,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, imgMsg]);
      }
    } catch {
      toast({ title: 'Image generation failed', description: 'Could not generate image.', variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [companion, companionId, toast]);

  return { messages, isLoading, sendMessage, playVoice, generateImage, isPlayingVoice, isGeneratingImage };
}
