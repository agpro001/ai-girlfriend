import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Clock, Share2, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost } from '@/hooks/useCommunity';
import UserAvatar from './UserAvatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Props {
  post: CommunityPost;
  currentUserId?: string;
  onLike: (postId: string, liked: boolean, ownerId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: CommunityPost) => void;
  onTagClick?: (tag: string) => void;
}

export default function CommunityCard({ post, currentUserId, onLike, onDelete, onEdit, onTagClick }: Props) {
  const { toast } = useToast();
  const isOwner = currentUserId === post.user_id;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${window.location.origin}/community/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else { await navigator.clipboard.writeText(url); toast({ title: 'Link copied!' }); }
    } catch {}
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors border border-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserAvatar src={post.avatar_url} username={post.username} size="sm" />
          <div>
            <div className="text-xs font-display text-primary tracking-wider">{post.username}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="w-3.5 h-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-border/50">
              {onEdit && <DropdownMenuItem onClick={() => onEdit(post)}><Pencil className="w-3 h-3 mr-2" />Edit</DropdownMenuItem>}
              {onDelete && <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive"><Trash2 className="w-3 h-3 mr-2" />Delete</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Link to={`/community/${post.id}`} className="block">
        <h3 className="text-sm font-display text-foreground tracking-wider hover:text-primary transition-colors">{post.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-3 mt-1 whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-lg mt-2 max-h-64 w-full object-cover" loading="lazy" />
        )}
      </Link>

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.tags.map(t => (
            <button key={t} onClick={() => onTagClick?.(t)} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              #{t}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={() => onLike(post.id, post.user_liked, post.user_id)}
          className={`flex items-center gap-1 text-xs transition-all ${post.user_liked ? 'text-accent scale-105' : 'text-muted-foreground hover:text-accent'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${post.user_liked ? 'fill-current' : ''}`} />
          {post.like_count}
        </button>
        <Link to={`/community/${post.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <MessageSquare className="w-3.5 h-3.5" />
          {post.comment_count}
        </Link>
        <button onClick={handleShare} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto">
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
