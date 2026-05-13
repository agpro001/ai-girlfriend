import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { getCompanion, getCompanionImage } from '@/lib/companions';

interface Msg { id: string; role: string; content: string; image_url: string | null; mood: string | null; created_at: string; }

export default function AdminConversation() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [convo, setConvo] = useState<{ companion_id: string; user_id: string } | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin || !conversationId) return;
    (async () => {
      const { data: c } = await supabase.from('conversations').select('companion_id, user_id').eq('id', conversationId).maybeSingle();
      if (!c) { setLoading(false); return; }
      setConvo(c as any);
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from('messages').select('id, role, content, image_url, mood, created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
        supabase.from('profiles').select('username').eq('user_id', (c as any).user_id).maybeSingle(),
      ]);
      setMsgs((m || []) as any);
      setOwner((p as any)?.username || null);
      setLoading(false);
    })();

    const ch = supabase
      .channel(`admin-convo-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (p) => setMsgs(prev => [...prev, p.new as Msg]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, conversationId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const comp = convo ? getCompanion(convo.companion_id) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md z-10">
        <Link to={convo ? `/admin/users/${convo.user_id}` : '/admin/users'}><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        {convo && <img src={getCompanionImage(convo.companion_id)} alt="" className="w-8 h-8 rounded-full object-cover" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display text-foreground">{comp?.name || convo?.companion_id}</p>
          <p className="text-[10px] text-muted-foreground">@{owner || 'unknown'} · read-only</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : msgs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No messages yet.</p>
        ) : msgs.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${m.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'glass border border-border/50'}`}>
              {m.image_url && <img src={m.image_url} alt="" className="rounded-lg mb-2 max-w-full" />}
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{m.content}</p>
              <p className="text-[9px] text-muted-foreground mt-1">
                {format(new Date(m.created_at), 'MMM d, HH:mm')}
                {m.mood && ` · ${m.mood}`}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
