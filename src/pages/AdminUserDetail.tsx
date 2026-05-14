import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, MessageSquare, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { getCompanion, getCompanionImage, getMoodEmoji } from '@/lib/companions';
import { COMPANIONS, type MoodType } from '@/types/companion';
import BottomNav from '@/components/BottomNav';

const MOODS: MoodType[] = ['happy','playful','romantic','sad','angry','worried','neutral','excited','jealous','seductive','passionate','intimate'];

interface Convo { id: string; companion_id: string; updated_at: string; message_count: number; }
interface Profile { username: string | null; avatar_url: string | null; country: string | null; bio: string | null; banned: boolean; last_seen: string | null; }

export default function AdminUserDetail() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [trust, setTrust] = useState<Record<string, number>>({});
  const [moods, setMoods] = useState<Record<string, MoodType>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAll = async () => {
    if (!userId) return;
    const [{ data: prof }, { data: cs }, { data: ts }, { data: msgs }, { data: ms }] = await Promise.all([
      supabase.from('profiles').select('username, avatar_url, country, bio, banned, last_seen').eq('user_id', userId).maybeSingle(),
      supabase.from('conversations').select('id, companion_id, updated_at').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('trust_scores').select('companion_id, score').eq('user_id', userId),
      supabase.from('messages').select('conversation_id').eq('user_id', userId),
      supabase.from('companion_moods').select('companion_id, mood').eq('user_id', userId),
    ]);
    const counts = new Map<string, number>();
    (msgs || []).forEach((m: any) => counts.set(m.conversation_id, (counts.get(m.conversation_id) || 0) + 1));
    setProfile(prof as any);
    setConvos((cs || []).map((c: any) => ({ ...c, message_count: counts.get(c.id) || 0 })));
    const tmap: Record<string, number> = {};
    (ts || []).forEach((t: any) => { tmap[t.companion_id] = t.score; });
    setTrust(tmap);
    const mmap: Record<string, MoodType> = {};
    (ms || []).forEach((m: any) => { mmap[m.companion_id] = m.mood as MoodType; });
    setMoods(mmap);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAdmin || !userId) return;
    loadAll();
  }, [isAdmin, userId]);

  const setMood = async (companionId: string, mood: MoodType) => {
    if (!userId) return;
    const { data: existing } = await supabase.from('companion_moods')
      .select('id').eq('user_id', userId).eq('companion_id', companionId).maybeSingle();
    if ((existing as any)?.id) {
      await supabase.from('companion_moods').update({ mood, updated_at: new Date().toISOString() }).eq('id', (existing as any).id);
    } else {
      await supabase.from('companion_moods').insert({ user_id: userId, companion_id: companionId, mood });
    }
    setMoods(prev => ({ ...prev, [companionId]: mood }));
    toast({ title: 'Mood updated', description: `${companionId}: ${mood}` });
  };


  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md z-10">
        <Link to="/admin/users"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">USER DETAIL</h1>
      </header>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {loading || !profile ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="glass rounded-xl p-4 border border-border/50 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">{(profile.username || '?')[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-display text-foreground">@{profile.username || 'unknown'}</h2>
                  {profile.banned && <span className="text-[10px] px-2 py-0.5 rounded bg-destructive/20 text-destructive">BANNED</span>}
                </div>
                {profile.country && <p className="text-xs text-muted-foreground">{profile.country}</p>}
                {profile.bio && <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{profile.bio}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">Last seen {profile.last_seen ? formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true }) : 'never'}</p>
              </div>
            </div>

            <h3 className="font-display text-xs tracking-wider text-muted-foreground pt-2">CONVERSATIONS</h3>
            {convos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet.</p>
            ) : convos.map(c => {
              const comp = getCompanion(c.companion_id);
              return (
                <Link key={c.id} to={`/admin/conversations/${c.id}`} className="block glass rounded-xl p-3 border border-border/50 hover:border-primary/50">
                  <div className="flex items-center gap-3">
                    <img src={getCompanionImage(c.companion_id)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{comp?.name || c.companion_id}</p>
                      <p className="text-[10px] text-muted-foreground">Updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{c.message_count}</span>
                      <span className="flex items-center gap-1 text-neon-pink"><Heart className="w-3 h-3" />{trust[c.companion_id] || 0}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
