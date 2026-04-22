import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Trash2, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import FallingPetals from '@/components/FallingPetals';
import BottomNav from '@/components/BottomNav';

interface Report {
  id: string; reporter_id: string; target_type: 'post' | 'comment'; target_id: string;
  reason: string; details: string | null; status: string; created_at: string;
  reporter?: { username: string | null }; preview?: string; target_user_id?: string;
  target_username?: string;
}

export default function AdminModeration() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data: rs } = await supabase
      .from('community_reports' as any)
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (!rs) { setLoading(false); return; }

    const reporterIds = [...new Set((rs as any[]).map(r => r.reporter_id))];
    const { data: reporters } = await supabase.from('profiles').select('user_id, username').in('user_id', reporterIds);
    const reporterMap = new Map(reporters?.map(p => [p.user_id, p]) || []);

    const postIds = (rs as any[]).filter(r => r.target_type === 'post').map(r => r.target_id);
    const commentIds = (rs as any[]).filter(r => r.target_type === 'comment').map(r => r.target_id);
    const [{ data: posts }, { data: comments }] = await Promise.all([
      postIds.length ? supabase.from('community_posts').select('id, title, content, user_id').in('id', postIds) : Promise.resolve({ data: [] as any[] }),
      commentIds.length ? supabase.from('community_comments').select('id, content, user_id').in('id', commentIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const allUserIds = [...new Set([...(posts || []).map(p => p.user_id), ...(comments || []).map(c => c.user_id)])];
    const { data: targetProfs } = await supabase.from('profiles').select('user_id, username').in('user_id', allUserIds);
    const targetMap = new Map(targetProfs?.map(p => [p.user_id, p]) || []);

    const postMap = new Map((posts || []).map(p => [p.id, p]));
    const commentMap = new Map((comments || []).map(c => [c.id, c]));

    setReports((rs as any[]).map(r => {
      const target: any = r.target_type === 'post' ? postMap.get(r.target_id) : commentMap.get(r.target_id);
      return {
        ...r,
        reporter: reporterMap.get(r.reporter_id),
        preview: target ? (target.title ? `${target.title} — ${target.content}` : target.content) : '[content removed]',
        target_user_id: target?.user_id,
        target_username: target ? targetMap.get(target.user_id)?.username : undefined,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const dismiss = async (id: string) => {
    await supabase.from('community_reports' as any).update({ status: 'dismissed' }).eq('id', id);
    toast({ title: 'Dismissed' });
    load();
  };

  const deleteContent = async (r: Report) => {
    const table = r.target_type === 'post' ? 'community_posts' : 'community_comments';
    await supabase.from(table).delete().eq('id', r.target_id);
    await supabase.from('community_reports' as any).update({ status: 'actioned' }).eq('id', r.id);
    toast({ title: 'Content deleted' });
    load();
  };

  const banUser = async (r: Report) => {
    if (!r.target_user_id) return;
    if (!confirm(`Ban @${r.target_username}? They will be unable to post, comment or like.`)) return;
    await supabase.from('profiles').update({ banned: true }).eq('user_id', r.target_user_id);
    await supabase.from('community_reports' as any).update({ status: 'actioned' }).eq('id', r.id);
    toast({ title: 'User banned' });
    load();
  };

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/community" replace />;

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <FallingPetals />
      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md">
        <Link to="/community"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <ShieldCheck className="w-4 h-4 text-neon-purple" />
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">MODERATION QUEUE</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary">{reports.length} OPEN</span>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">All caught up — no open reports.</p>
        ) : (
          <AnimatePresence>
            {reports.map(r => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass rounded-xl p-4 space-y-2 border border-border/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-display tracking-wider uppercase">{r.reason}</span>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{r.target_type}</span>
                      <span className="text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Reported by <span className="text-primary">@{r.reporter?.username || '?'}</span>
                      {r.target_username && <> · Author: <Link to={`/u/${r.target_username}`} className="text-primary hover:underline">@{r.target_username}</Link></>}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 text-xs text-foreground/80 line-clamp-3 whitespace-pre-wrap">
                  {r.preview}
                </div>

                {r.details && <p className="text-[11px] italic text-muted-foreground">"{r.details}"</p>}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => dismiss(r.id)} className="text-xs h-8">
                    <X className="w-3 h-3 mr-1" /> Dismiss
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteContent(r)} className="text-xs h-8">
                    <Trash2 className="w-3 h-3 mr-1" /> Delete content
                  </Button>
                  {r.target_user_id && (
                    <Button size="sm" variant="destructive" onClick={() => banUser(r)} className="text-xs h-8 bg-neon-red hover:bg-neon-red/80">
                      <ShieldAlert className="w-3 h-3 mr-1" /> Ban user
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
