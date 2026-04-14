import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCompanion } from '@/lib/companions';
import type { Message, MoodType } from '@/types/companion';
import { useToast } from '@/hooks/use-toast';

export function useChat(companionId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<MoodType>('neutral');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();
  const companion = getCompanion(companionId);

  // Load or create conversation + load message history
  useEffect(() => {
    if (!userId || !companionId) return;
    let cancelled = false;

    const init = async () => {
      setIsLoadingHistory(true);
      try {
        // Find existing conversation
        const { data: convos } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', userId)
          .eq('companion_id', companionId)
          .order('created_at', { ascending: false })
          .limit(1);

        let convId: string;
        if (convos && convos.length > 0) {
          convId = convos[0].id;
        } else {
          const { data: newConvo, error } = await supabase
            .from('conversations')
            .insert({ user_id: userId, companion_id: companionId })
            .select('id')
            .single();
          if (error || !newConvo) throw error;
          convId = newConvo.id;
        }

        if (cancelled) return;
        setConversationId(convId);

        // Load messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (cancelled) return;
        if (msgs && msgs.length > 0) {
          setMessages(msgs.map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            mood: m.mood || undefined,
            image_url: m.image_url || undefined,
            created_at: m.created_at,
          })));
          // Set mood from last assistant message
          const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant');
          if (lastAssistant?.mood) setCurrentMood(lastAssistant.mood as MoodType);
        }

        // Load companion mood
        const { data: moodData } = await supabase
          .from('companion_moods')
          .select('mood')
          .eq('user_id', userId)
          .eq('companion_id', companionId)
          .limit(1);
        if (moodData && moodData.length > 0) {
          setCurrentMood(moodData[0].mood as MoodType);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [userId, companionId]);

  // Parse mood tag from response
  const parseMood = (text: string): { clean: string; mood: MoodType | null } => {
    const match = text.match(/\[MOOD:(\w+)\]\s*$/);
    if (match) {
      const mood = match[1] as MoodType;
      return { clean: text.replace(/\[MOOD:\w+\]\s*$/, '').trim(), mood };
    }
    return { clean: text, mood: null };
  };

  const saveMessage = async (msg: { conversation_id: string; role: string; content: string; mood?: string; image_url?: string }) => {
    if (!userId) return;
    try {
      await supabase.from('messages').insert({
        conversation_id: msg.conversation_id,
        user_id: userId,
        role: msg.role,
        content: msg.content,
        mood: msg.mood || null,
        image_url: msg.image_url || null,
      });
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  };

  const updateMood = async (mood: MoodType) => {
    if (!userId) return;
    setCurrentMood(mood);
    try {
      const { data: existing } = await supabase
        .from('companion_moods')
        .select('id')
        .eq('user_id', userId)
        .eq('companion_id', companionId)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('companion_moods')
          .update({ mood, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id);
      } else {
        await supabase
          .from('companion_moods')
          .insert({ user_id: userId, companion_id: companionId, mood });
      }
    } catch (err) {
      console.error('Failed to update mood:', err);
    }
  };

  const updateTrust = async () => {
    if (!userId) return;
    try {
      const { data: existing } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('companion_id', companionId)
        .limit(1);

      if (existing && existing.length > 0) {
        const ts = existing[0];
        await supabase
          .from('trust_scores')
          .update({
            score: Math.min(100, ts.score + 1),
            total_messages: ts.total_messages + 1,
            last_interaction: new Date().toISOString(),
          })
          .eq('id', ts.id);
      } else {
        await supabase
          .from('trust_scores')
          .insert({
            user_id: userId,
            companion_id: companionId,
            score: 1,
            total_messages: 1,
            last_interaction: new Date().toISOString(),
          });
      }
    } catch (err) {
      console.error('Failed to update trust:', err);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!companion || !userId || !conversationId) return;
    setIsLoading(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    saveMessage({ conversation_id: conversationId, role: 'user', content });

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
      const streamId = crypto.randomUUID();

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
                if (last?.id === streamId) {
                  return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, {
                  id: streamId,
                  conversation_id: conversationId + '-stream',
                  role: 'assistant' as const,
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

      // Parse mood and finalize
      const { clean, mood } = parseMood(assistantContent);
      if (mood) updateMood(mood);

      setMessages(prev =>
        prev.map(m =>
          m.id === streamId
            ? { ...m, conversation_id: conversationId, content: clean, mood: mood || undefined }
            : m
        )
      );

      // Save to DB
      saveMessage({ conversation_id: conversationId, role: 'assistant', content: clean, mood: mood || undefined });
      updateTrust();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Chat failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [companion, userId, companionId, conversationId, messages, toast]);

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
    if (!companion || !conversationId) return;
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt: context, companionId, mood: currentMood },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        const imgMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: 'assistant',
          content: `*${companion.name} created an image for you* 🎨`,
          image_url: data.imageUrl,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, imgMsg]);
        saveMessage({ conversation_id: conversationId, role: 'assistant', content: imgMsg.content, image_url: data.imageUrl });
      }
    } catch {
      toast({ title: 'Image generation failed', description: 'Could not generate image.', variant: 'destructive' });
    } finally {
      setIsGeneratingImage(false);
    }
  }, [companion, companionId, conversationId, currentMood, toast]);

  return { messages, isLoading, isLoadingHistory, sendMessage, playVoice, generateImage, isPlayingVoice, isGeneratingImage, currentMood };
}
