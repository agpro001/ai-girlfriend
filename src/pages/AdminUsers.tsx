import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, Users as UsersIcon, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';

interface Row {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  country: string | null;
  banned: boolean;
  last_seen: string | null;
  message_count: number;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = async () => {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url, country, banned, last_seen')
      .order('last_seen', { ascending: false, nullsFirst: false });

    if (!profs) { setLoading(false); return; }

    const { data: msgs } = await supabase.from('messages').select('user_id');
    const counts = new Map<string, number>();
    (msgs || []).forEach((m: any) => counts.set(m.user_id, (counts.get(m.user_id) || 0) + 1));

    setRows(profs.map((p: any) => ({ ...p, message_count: counts.get(p.user_id) || 0 })));
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    load();
    const ch = supabase
      .channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, load)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin]);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const filtered = rows.filter(r => !q || (r.username || '').toLowerCase().includes(q.toLowerCase()));
  const activeNow = rows.filter(r => r.last_seen && (Date.now() - new Date(r.last_seen).getTime()) < 5 * 60 * 1000).length;

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <FallingPetals />
      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md">
        <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <UsersIcon className="w-4 h-4 text-neon-blue" />
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">USERS</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">{rows.length}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-pink/20 text-neon-pink">{activeNow} live</span>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search username..." className="pl-9 bg-muted border-border" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No users found.</p>
        ) : filtered.map(r => {
          const isLive = r.last_seen && (Date.now() - new Date(r.last_seen).getTime()) < 5 * 60 * 1000;
          return (
            <Link key={r.user_id} to={`/admin/users/${r.user_id}`} className="block glass rounded-xl p-3 border border-border/50 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {r.avatar_url ? <img src={r.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">{(r.username || '?')[0]?.toUpperCase()}</span>}
                  </div>
                  {isLive && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">@{r.username || 'unknown'}</p>
                    {r.banned && <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">BANNED</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {r.country && <>{r.country} · </>}
                    {r.last_seen ? formatDistanceToNow(new Date(r.last_seen), { addSuffix: true }) : 'never seen'}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare className="w-3 h-3" />
                  {r.message_count}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
