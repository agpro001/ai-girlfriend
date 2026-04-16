import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Clock } from 'lucide-react';
import { getCompanion, getCompanionImage, getNeonTextClass, getNeonClass } from '@/lib/companions';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FallingPetals from '@/components/FallingPetals';

const traitLabels: Record<string, string> = {
  agreeableness: 'Agreeableness',
  neuroticism: 'Neuroticism',
  sarcasm: 'Sarcasm',
  ambition: 'Ambition',
  empathy: 'Empathy',
};

export default function CompanionProfile() {
  const { companionId } = useParams<{ companionId: string }>();
  const companion = getCompanion(companionId || '');
  const { user } = useAuth();
  const [stats, setStats] = useState({ trust: 0, messages: 0, time: 0 });

  useEffect(() => {
    if (!user || !companionId) return;
    const load = async () => {
      const { data: ts } = await supabase
        .from('trust_scores')
        .select('score, total_messages, total_time_minutes')
        .eq('user_id', user.id)
        .eq('companion_id', companionId)
        .limit(1);
      if (ts && ts.length > 0) {
        setStats({ trust: ts[0].score, messages: ts[0].total_messages, time: ts[0].total_time_minutes });
      }
    };
    load();
  }, [user, companionId]);

  if (!companion) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Not found</div>;

  return (
    <div className="min-h-screen bg-background relative">
      <FallingPetals />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280,100%,65%,0.05),transparent_60%)]" />

      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className={`font-display text-sm tracking-wider ${getNeonTextClass(companion.neon_color)}`}>{companion.name}'s Profile</h1>
      </header>

      <div className="relative z-10 max-w-lg mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-xl overflow-hidden ${getNeonClass(companion.neon_color)}`}
        >
          <img src={getCompanionImage(companion.id)} alt={companion.name} className="w-full aspect-[3/4] object-cover" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-5">
          <h2 className={`font-display text-xl tracking-wider ${getNeonTextClass(companion.neon_color)} mb-1`}>{companion.name}</h2>
          <p className="text-muted-foreground text-sm mb-1">{companion.tagline}</p>
          <p className="text-foreground text-sm">{companion.description}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5">
          <h3 className="font-display text-sm tracking-wider text-foreground mb-4">PERSONALITY DNA</h3>
          <div className="space-y-4">
            {Object.entries(companion.personality).map(([trait, val]) => (
              <div key={trait}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{traitLabels[trait]}</span>
                  <span className="text-xs text-primary">{Math.round(val * 100)}%</span>
                </div>
                <Slider value={[val * 100]} max={100} step={1} disabled className="pointer-events-none" />
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
          <h3 className="font-display text-sm tracking-wider text-foreground mb-3">CORE VALUES</h3>
          <div className="flex flex-wrap gap-2">
            {companion.core_values.map(v => (
              <span key={v} className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 capitalize">{v}</span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-5">
          <h3 className="font-display text-sm tracking-wider text-foreground mb-3">RELATIONSHIP</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <Heart className="w-5 h-5 mx-auto text-accent mb-1" />
              <p className="text-lg font-display text-foreground">{stats.trust}</p>
              <p className="text-[10px] text-muted-foreground">Trust</p>
            </div>
            <div>
              <MessageCircle className="w-5 h-5 mx-auto text-secondary mb-1" />
              <p className="text-lg font-display text-foreground">{stats.messages}</p>
              <p className="text-[10px] text-muted-foreground">Messages</p>
            </div>
            <div>
              <Clock className="w-5 h-5 mx-auto text-neon-gold mb-1" />
              <p className="text-lg font-display text-foreground">{stats.time}m</p>
              <p className="text-[10px] text-muted-foreground">Together</p>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center gap-3">
          <Link to={`/chat/${companion.id}`}>
            <Button className="font-display text-xs tracking-widest bg-primary hover:bg-primary/80 neon-border">
              START CHATTING
            </Button>
          </Link>
          <Link to={`/stats/${companion.id}`}>
            <Button variant="outline" className="font-display text-xs tracking-widest border-border/50">
              VIEW STATS
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
