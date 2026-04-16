import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Clock, Calendar } from 'lucide-react';
import { getCompanion, getCompanionImage, getNeonTextClass, getNeonClass, getMoodEmoji } from '@/lib/companions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadialBarChart, RadialBar } from 'recharts';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';
import type { MoodType } from '@/types/companion';

const moodToNumber: Record<string, number> = {
  angry: 1, sad: 2, worried: 3, neutral: 4, playful: 5, happy: 6, excited: 7, romantic: 8, jealous: 3,
  seductive: 7, passionate: 8, intimate: 9,
};

const moodColors: Record<string, string> = {
  happy: '#facc15', playful: '#ec4899', romantic: '#ef4444', sad: '#3b82f6',
  angry: '#dc2626', worried: '#f97316', neutral: '#6b7280', excited: '#22c55e', jealous: '#a855f7',
  seductive: '#e11d48', passionate: '#be123c', intimate: '#f43f5e',
};

export default function RelationshipStats() {
  const { companionId } = useParams<{ companionId: string }>();
  const companion = getCompanion(companionId || '');
  const { user } = useAuth();
  const [trustScore, setTrustScore] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [daysSinceFirst, setDaysSinceFirst] = useState(0);
  const [moodHistory, setMoodHistory] = useState<{ date: string; mood: string; value: number }[]>([]);

  useEffect(() => {
    if (!user || !companionId) return;
    const load = async () => {
      // Trust score
      const { data: ts } = await supabase
        .from('trust_scores')
        .select('score, total_messages, total_time_minutes')
        .eq('user_id', user.id).eq('companion_id', companionId).limit(1);
      if (ts?.[0]) {
        setTrustScore(ts[0].score);
        setTotalMessages(ts[0].total_messages);
        setTotalTime(ts[0].total_time_minutes);
      }

      // Conversation for days since first
      const { data: conv } = await supabase
        .from('conversations')
        .select('created_at')
        .eq('user_id', user.id).eq('companion_id', companionId)
        .order('created_at', { ascending: true }).limit(1);
      if (conv?.[0]) {
        const days = Math.floor((Date.now() - new Date(conv[0].created_at).getTime()) / 86400000);
        setDaysSinceFirst(Math.max(1, days));
      }

      // Mood history from messages
      const { data: convAll } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id).eq('companion_id', companionId);
      if (convAll) {
        const convIds = convAll.map(c => c.id);
        if (convIds.length > 0) {
          const { data: msgs } = await supabase
            .from('messages')
            .select('mood, created_at')
            .in('conversation_id', convIds)
            .eq('role', 'assistant')
            .not('mood', 'is', null)
            .order('created_at', { ascending: true });
          if (msgs) {
            const grouped = new Map<string, { mood: string; count: number }>();
            msgs.forEach(m => {
              const date = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              if (!grouped.has(date)) grouped.set(date, { mood: m.mood!, count: 0 });
              grouped.get(date)!.mood = m.mood!;
              grouped.get(date)!.count++;
            });
            setMoodHistory(Array.from(grouped.entries()).map(([date, { mood }]) => ({
              date, mood, value: moodToNumber[mood] || 4,
            })));
          }
        }
      }
    };
    load();
  }, [user, companionId]);

  if (!companion) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Not found</div>;

  const trustData = [{ name: 'Trust', value: trustScore, fill: 'hsl(var(--primary))' }];
  const avgPerDay = daysSinceFirst > 0 ? (totalMessages / daysSinceFirst).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-background relative pb-16">
      <FallingPetals />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280,100%,65%,0.05),transparent_60%)]" />

      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50">
        <Link to={`/companion/${companion.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <img src={getCompanionImage(companion.id)} alt={companion.name} className="w-8 h-8 rounded-full object-cover" />
        <h1 className={`font-display text-sm tracking-wider ${getNeonTextClass(companion.neon_color)}`}>
          {companion.name}'s Stats
        </h1>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto p-4 space-y-5">
        {/* Trust Gauge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">TRUST LEVEL</h3>
          <div className="flex items-center justify-center">
            <RadialBarChart width={200} height={120} cx={100} cy={100} innerRadius={60} outerRadius={90} startAngle={180} endAngle={0} barSize={12} data={trustData}>
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'hsl(var(--muted))' }} />
            </RadialBarChart>
          </div>
          <p className="text-center font-display text-2xl text-foreground -mt-8">{trustScore}<span className="text-xs text-muted-foreground">/100</span></p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 gap-3">
          {[
            { icon: MessageCircle, label: 'Total Messages', value: totalMessages, color: 'text-primary' },
            { icon: Clock, label: 'Time Together', value: `${totalTime}m`, color: 'text-neon-gold' },
            { icon: Calendar, label: 'Days Together', value: daysSinceFirst, color: 'text-neon-pink' },
            { icon: Heart, label: 'Avg/Day', value: avgPerDay, color: 'text-accent' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
              <p className="font-display text-lg text-foreground">{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Mood History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-xl p-5">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">MOOD HISTORY</h3>
          {moodHistory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={moodHistory}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis hide domain={[0, 10]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="glass rounded-lg px-3 py-2 text-xs">
                          <p className="text-foreground">{d.date}</p>
                          <p className="text-primary">{getMoodEmoji(d.mood as MoodType)} {d.mood}</p>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#moodGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {moodHistory.slice(-5).map((m, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-border/50" style={{ color: moodColors[m.mood] || '#6b7280' }}>
                    {getMoodEmoji(m.mood as MoodType)} {m.mood}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">No mood data yet. Start chatting!</p>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
