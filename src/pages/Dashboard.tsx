import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { COMPANIONS } from '@/types/companion';
import { getCompanionImage, getNeonClass, getNeonTextClass, getMoodEmoji } from '@/lib/companions';
import { LogOut, MessageCircle, User, Sparkles, ShieldAlert, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FallingPetals from '@/components/FallingPetals';
import BottomNav from '@/components/BottomNav';
import type { MoodType } from '@/types/companion';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [liveMoods, setLiveMoods] = useState<Record<string, MoodType>>({});

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('companion_moods')
        .select('companion_id, mood')
        .eq('user_id', user.id);
      if (data) {
        const m: Record<string, MoodType> = {};
        data.forEach(d => { m[d.companion_id] = d.mood as MoodType; });
        setLiveMoods(m);
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background relative pb-16">
      <FallingPetals />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280,100%,65%,0.05),transparent_60%)]" />

      <header className="relative z-10 flex items-center justify-between p-4 border-b border-border/50">
        <h1 className="font-display text-lg tracking-wider">
          <span className="text-neon-purple neon-glow-purple">AURA</span>
          <span className="text-foreground">-</span>
          <span className="text-neon-pink neon-glow-pink">LINK</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Button variant="ghost" size="icon"><User className="w-4 h-4" /></Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="relative z-10 p-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h2 className="font-display text-xl tracking-wider text-foreground mb-1">Your Girlfriends</h2>
          <p className="text-muted-foreground text-sm">Choose who you want to spend time with</p>
        </motion.div>

        <div className="space-y-4">
          {COMPANIONS.map((companion, i) => {
            const mood = liveMoods[companion.id] || 'neutral';
            return (
              <motion.div key={companion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={`/chat/${companion.id}`}>
                  <div className={`glass rounded-xl overflow-hidden ${getNeonClass(companion.neon_color)} hover:scale-[1.02] transition-transform cursor-pointer`}>
                    <div className="flex">
                      <div className="relative">
                        <img src={getCompanionImage(companion.id)} alt={companion.name} className="w-28 h-36 object-cover" />
                        {companion.nsfw && (
                          <div className="absolute top-1 right-1 bg-neon-red/80 rounded px-1.5 py-0.5 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5 text-foreground" />
                            <span className="text-[8px] font-display text-foreground">18+</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-display text-sm tracking-wider ${getNeonTextClass(companion.neon_color)}`}>{companion.name}</h3>
                          <motion.span key={mood} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-xs">{getMoodEmoji(mood)}</motion.span>
                        </div>
                        <p className="text-muted-foreground text-xs mb-3">{companion.tagline}</p>
                        <div className="space-y-1.5">
                          {Object.entries(companion.personality).slice(0, 3).map(([trait, val]) => (
                            <div key={trait} className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-16 capitalize">{trait}</span>
                              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary/70 rounded-full" style={{ width: `${val * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Tap to chat</span>
                          </div>
                          <Link to={`/stats/${companion.id}`} onClick={e => e.stopPropagation()}>
                            <BarChart3 className="w-3 h-3 text-muted-foreground hover:text-primary transition-colors" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 text-center">
          <Link to="/gallery">
            <Button variant="outline" className="font-display text-xs tracking-wider border-border/50">
              <Sparkles className="w-4 h-4 mr-2" /> VIEW GALLERY
            </Button>
          </Link>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
