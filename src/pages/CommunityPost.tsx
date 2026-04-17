import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Heart, Send, Loader2, Clock, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePostDetail, useCommunity } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';
import UserAvatar from '@/components/UserAvatar';
import { useToast } from '@/hooks/use-toast';

export default function CommunityPost() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { post, comments, loading, toggleCommentLike, deleteComment } = usePostDetail(postId || '', user?.id);
  const { toggleLike, addComment } = useCommunity(user?.id);
  const [commentInput, setCommentInput] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleComment = async () => {
    if (!commentInput.trim() || !postId || !post) return;
    setSending(true);
    await addComment(postId, commentInput.trim(), post.user_id);
    setCommentInput('');
    setSending(false);
  };

  const share = async () => {
    if (!post) return;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Link copied!' }); }
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!post) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Post not found</div>
  );

  return (
    <div className="min-h-screen bg-background relative pb-32">
      <FallingPetals />

      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md">
        <Link to="/community"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-display text-sm tracking-wider text-foreground truncate flex-1">{post.title}</h1>
        <Button variant="ghost" size="icon" onClick={share}><Share2 className="w-4 h-4" /></Button>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto p-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserAvatar src={post.avatar_url} username={post.username} size="md" />
              <div>
                <div className="text-xs font-display text-primary tracking-wider">{post.username}</div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
          <h2 className="font-display text-lg text-foreground tracking-wider">{post.title}</h2>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="" className="rounded-lg w-full max-h-96 object-cover" />}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">#{t}</span>)}
            </div>
          )}
          <div className="flex items-center gap-4 pt-1">
            <button
              onClick={() => toggleLike(post.id, post.user_liked, post.user_id)}
              className={`flex items-center gap-1 text-xs transition-all ${post.user_liked ? 'text-accent scale-105' : 'text-muted-foreground hover:text-accent'}`}
            >
              <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
              {post.like_count} likes
            </button>
            <span className="text-xs text-muted-foreground">{post.comment_count} comments</span>
          </div>
        </motion.div>

        <div className="space-y-2">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground">COMMENTS ({comments.length})</h3>
          <AnimatePresence>
            {comments.map((c, i) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="glass rounded-lg p-3"
              >
                <div className="flex items-start gap-2">
                  <UserAvatar src={c.avatar_url} username={c.username} size="xs" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-display text-primary tracking-wider">{c.username}</span>
                      <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-xs text-foreground/80 whitespace-pre-wrap">{c.content}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => toggleCommentLike(c.id, c.user_liked)}
                        className={`flex items-center gap-1 text-[10px] transition-colors ${c.user_liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
                      >
                        <Heart className={`w-3 h-3 ${c.user_liked ? 'fill-current' : ''}`} />
                        {c.like_count > 0 && c.like_count}
                      </button>
                      {c.user_id === user?.id && (
                        <button onClick={() => deleteComment(c.id)} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Be the first to comment.</p>}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 p-3 glass border-t border-border/50">
        <form onSubmit={e => { e.preventDefault(); handleComment(); }} className="flex gap-2 max-w-2xl mx-auto">
          <Input value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Write a comment..." maxLength={500} className="bg-muted border-border" />
          <Button type="submit" size="icon" disabled={!commentInput.trim() || sending}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
