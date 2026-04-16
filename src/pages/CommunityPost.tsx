import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Heart, Send, Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePostDetail } from '@/hooks/useCommunity';
import { useCommunity } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';

export default function CommunityPost() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { post, comments, loading } = usePostDetail(postId || '', user?.id);
  const { toggleLike, addComment } = useCommunity(user?.id);
  const [commentInput, setCommentInput] = useState('');

  const handleComment = async () => {
    if (!commentInput.trim() || !postId) return;
    await addComment(postId, commentInput.trim());
    setCommentInput('');
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
    <div className="min-h-screen bg-background relative pb-20">
      <FallingPetals />

      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50">
        <Link to="/community"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-display text-sm tracking-wider text-foreground truncate">{post.title}</h1>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto p-4 space-y-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display text-primary tracking-wider">{post.username}</span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          <h2 className="font-display text-lg text-foreground tracking-wider">{post.title}</h2>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="" className="rounded-lg w-full max-h-80 object-cover" />}
          <button
            onClick={() => toggleLike(post.id, post.user_liked)}
            className={`flex items-center gap-1 text-xs transition-colors ${post.user_liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
          >
            <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-current' : ''}`} />
            {post.like_count} likes
          </button>
        </motion.div>

        <div className="space-y-3">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground">COMMENTS ({comments.length})</h3>
          {comments.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-display text-primary">{c.username}</span>
                <span className="text-[9px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-xs text-foreground/80">{c.content}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-30 p-3 glass border-t border-border/50">
        <form onSubmit={e => { e.preventDefault(); handleComment(); }} className="flex gap-2 max-w-2xl mx-auto">
          <Input value={commentInput} onChange={e => setCommentInput(e.target.value)} placeholder="Write a comment..." className="bg-muted border-border" />
          <Button type="submit" size="icon" disabled={!commentInput.trim()}><Send className="w-4 h-4" /></Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
