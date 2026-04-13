import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Volume2, Image, Loader2 } from 'lucide-react';
import { getCompanion, getCompanionImage, getNeonTextClass, getMoodEmoji } from '@/lib/companions';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import ReactMarkdown from 'react-markdown';
import type { MoodType } from '@/types/companion';

export default function Chat() {
  const { companionId } = useParams<{ companionId: string }>();
  const companion = getCompanion(companionId || '');
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, playVoice, generateImage, isPlayingVoice, isGeneratingImage } = useChat(companionId || '', user?.id || '');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!companion) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Companion not found</div>;

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 p-3 border-b border-border/50 glass">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <img src={getCompanionImage(companion.id)} alt={companion.name} className="w-9 h-9 rounded-full object-cover" />
        <div className="flex-1">
          <h2 className={`font-display text-sm tracking-wider ${getNeonTextClass(companion.neon_color)}`}>
            {companion.name}
          </h2>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            {getMoodEmoji('neutral' as MoodType)} Online
          </p>
        </div>
        <Link to={`/companion/${companion.id}`}>
          <Button variant="ghost" size="sm" className="text-xs font-display tracking-wider">PROFILE</Button>
        </Link>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary/20 border border-primary/30'
                  : 'glass'
              }`}>
                {msg.image_url && (
                  <img src={msg.image_url} alt="Generated" className="rounded-lg mb-2 max-w-full" loading="lazy" />
                )}
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => playVoice(msg.content)}
                      disabled={isPlayingVoice}
                    >
                      {isPlayingVoice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => generateImage(msg.content)}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50 glass">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message ${companion.name}...`}
            className="bg-muted border-border"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/80">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
