import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2, BarChart3, Users, MessageSquare, Image as ImageIcon, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import BottomNav from '@/components/BottomNav';
import { COMPANIONS } from '@/types/companion';

export default function AdminStats() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [stats, setStats] = useState({
    users: 0, active24h: 0, totalMessages: 0, totalConvos: 0, totalPosts: 0, totalComments: 0, openReports: 0,
    perCompanion: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [u, a24, msgs, convos, posts, comments, reports] = await Promise.all([
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }).gte('last_seen', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('messages').select('id', { count: 'exact', head: true }),
      supabase.from('conversations').select('id, companion_id'),
      supabase.from('community_posts').select('id', { count: 'exact', head: true }),
      supabase.from('community_comments').select('id', { count: 'exact', head: true }),
      supabase.from('community_reports' as any).select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);
    const per: Record<string, number> = {};
    (convos.data || []).forEach((c: any) => { per[c.companion_id] = (per[c.companion_id] || 0) + 1; });
    setStats({
      users: u.count || 0,
      active24h: a24.count || 0,
      totalMessages: msgs.count || 0,
      totalConvos: convos.data?.length || 0,
      totalPosts: posts.count || 0,
      totalComments: comments.count || 0,
      openReports: reports.count || 0,
      perCompanion: per,
    });
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const ch = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const cards = [
    { icon: Users, label: 'Total Users', value: stats.users, color: 'text-neon-blue' },
    { icon: Users, label: 'Active 24h', value: stats.active24h, color: 'text-green-400' },
    { icon: MessageSquare, label: 'Total Messages', value: stats.totalMessages, color: 'text-neon-pink' },
    { icon: MessageSquare, label: 'Conversations', value: stats.totalConvos, color: 'text-neon-purple' },
    { icon: ImageIcon, label: 'Community Posts', value: stats.totalPosts, color: 'text-neon-gold' },
    { icon: MessageSquare, label: 'Comments', value: stats.totalComments, color: 'text-neon-blue' },
    { icon: Flag, label: 'Open Reports', value: stats.openReports, color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md z-10">
        <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <BarChart3 className="w-4 h-4 text-neon-purple" />
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">STATS</h1>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {cards.map(c => (
                <div key={c.label} className="glass rounded-xl p-4 border border-border/50">
                  <c.icon className={`w-5 h-5 ${c.color} mb-2`} />
                  <p className="text-2xl font-display text-foreground">{c.value.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider uppercase">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-4 border border-border/50">
              <h3 className="font-display text-xs tracking-wider text-muted-foreground mb-3">CONVERSATIONS BY COMPANION</h3>
              <div className="space-y-2">
                {COMPANIONS.map(c => {
                  const count = stats.perCompanion[c.id] || 0;
                  const pct = stats.totalConvos > 0 ? (count / stats.totalConvos) * 100 : 0;
                  return (
                    <div key={c.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{c.name}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
