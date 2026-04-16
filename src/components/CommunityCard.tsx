import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost } from '@/hooks/useCommunity';

interface Props {
  post: CommunityPost;
  onLike: (postId: string, liked: boolean) => void;
}

export default function CommunityCard({ post, onLike }: Props) {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-display text-primary tracking-wider">{post.username}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </span>
      </div>

      <Link to={`/community/${post.id}`}>
        <h3 className="text-sm font-display text-foreground tracking-wider hover:text-primary transition-colors">{post.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-3 mt-1">{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-lg mt-2 max-h-48 w-full object-cover" loading="lazy" />
        )}
      </Link>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => onLike(post.id, post.user_liked)}
          className={`flex items-center gap-1 text-xs transition-colors ${post.user_liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${post.user_liked ? 'fill-current' : ''}`} />
          {post.like_count}
        </button>
        <Link to={`/community/${post.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />
          {post.comment_count}
        </Link>
      </div>
    </div>
  );
}
