import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Volume2, VolumeX, Image, Loader2, ArrowDown, Square } from 'lucide-react';
import { getCompanion, getCompanionImage, getNeonTextClass, getMoodEmoji } from '@/lib/companions';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import AgeGate from '@/components/AgeGate';
import FallingPetals from '@/components/FallingPetals';
import ReactMarkdown from 'react-markdown';
import type { MoodType } from '@/types/companion';
import { format } from 'date-fns';

export default function Chat() {
  const { companionId } = useParams<{ companionId: string }>();
  const companion = getCompanion(companionId || '');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [ageVerified, setAgeVerified] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, isLoadingHistory, sendMessage, playVoice, stopVoice, generateImage, isPlayingVoice, isGeneratingImage, currentMood, playingMessageId } = useChat(companionId || '', user?.id || '');
  const [showFlash, setShowFlash] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const prevMood = useRef(currentMood);
  const lastAutoPlayedId = useRef<string | null>(null);

  // Check age gate for NSFW companions
  useEffect(() => {
    if (companion?.nsfw) {
      const verified = sessionStorage.getItem(`age-verified-${companion.id}`);
      if (verified === 'true') setAgeVerified(true);
    } else {
      setAgeVerified(true);
    }
  }, [companion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (prevMood.current !== currentMood && currentMood !== 'neutral') {
      setShowFlash(true);
      const t = setTimeout(() => setShowFlash(false), 600);
      prevMood.current = currentMood;
      return () => clearTimeout(t);
    }
    prevMood.current = currentMood;
  }, [currentMood]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  if (!companion) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Girlfriend not found</div>;

  if (companion.nsfw && !ageVerified) {
    return (
      <AgeGate
        onConfirm={() => {
          sessionStorage.setItem(`age-verified-${companion.id}`, 'true');
          setAgeVerified(true);
        }}
        onDeny={() => navigate('/dashboard')}
      />
    );
  }

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const moodColor: Record<string, string> = {
    happy: 'bg-yellow-500/20',
    playful: 'bg-pink-500/20',
    romantic: 'bg-red-500/20',
    sad: 'bg-blue-500/20',
    angry: 'bg-red-700/20',
    worried: 'bg-orange-500/20',
    neutral: 'bg-muted/20',
    excited: 'bg-green-500/20',
    jealous: 'bg-purple-500/20',
    seductive: 'bg-rose-500/20',
    passionate: 'bg-red-600/20',
    intimate: 'bg-pink-400/20',
  };

  const moodFlashColor: Record<string, string> = {
    happy: 'rgba(250,204,21,0.15)',
    playful: 'rgba(236,72,153,0.15)',
    romantic: 'rgba(239,68,68,0.15)',
    sad: 'rgba(59,130,246,0.15)',
    angry: 'rgba(220,38,38,0.2)',
    worried: 'rgba(249,115,22,0.15)',
    excited: 'rgba(34,197,94,0.15)',
    jealous: 'rgba(168,85,247,0.15)',
    seductive: 'rgba(225,29,72,0.18)',
    passionate: 'rgba(190,18,60,0.18)',
    intimate: 'rgba(244,63,94,0.15)',
  };

  

  return (
    <div className="h-screen bg-background flex flex-col relative">
      <AnimatePresence>
        {showFlash && moodFlashColor[currentMood] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 pointer-events-none"
            style={{ backgroundColor: moodFlashColor[currentMood] }}
          />
        )}
      </AnimatePresence>
      <FallingPetals />
      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 p-3 border-b border-border/50 glass">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <img src={getCompanionImage(companion.id)} alt={companion.name} className="w-9 h-9 rounded-full object-cover" />
        <div className="flex-1">
          <h2 className={`font-display text-sm tracking-wider ${getNeonTextClass(companion.neon_color)}`}>
            {companion.name}
          </h2>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <motion.span
              key={currentMood}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="inline-block"
            >
              {getMoodEmoji(currentMood)}
            </motion.span>
            {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
          </p>
        </div>
        <div className={`w-2 h-2 rounded-full ${moodColor[currentMood] || 'bg-muted/20'} animate-pulse`} />
        <Link to={`/companion/${companion.id}`}>
          <Button variant="ghost" size="sm" className="text-xs font-display tracking-wider">PROFILE</Button>
        </Link>
      </header>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
        {isLoadingHistory && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
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
                {/* Timestamp */}
                <p className="text-[9px] text-muted-foreground mt-1 opacity-60">
                  {format(new Date(msg.created_at), 'h:mm a')}
                </p>
                {msg.role === 'assistant' && (
                  <div className="flex gap-1 mt-1 items-center">
                    {msg.mood && (
                      <span className="text-xs mr-1">{getMoodEmoji(msg.mood as MoodType)}</span>
                    )}
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

      {/* Scroll to bottom */}
      {showScrollBtn && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="absolute bottom-20 right-4 z-20 rounded-full bg-primary/80 hover:bg-primary w-8 h-8"
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
      )}

      {/* Input */}
      <div className="relative z-10 p-3 border-t border-border/50 glass">
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
