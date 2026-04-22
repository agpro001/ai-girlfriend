import { useState } from 'react';
import { Bell, Heart, MessageSquare, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useCommunity';
import UserAvatar from './UserAvatar';

interface Props { userId?: string; }

export default function NotificationsBell({ userId }: Props) {
  const { items, unreadCount, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o && unreadCount) markAllRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-[9px] font-bold text-accent-foreground flex items-center justify-center neon-glow-purple">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 glass border-border/50 p-0">
        <div className="p-3 border-b border-border/50">
          <h3 className="font-display text-xs tracking-wider text-foreground">NOTIFICATIONS</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No notifications yet.</p>
          ) : items.map(n => (
            <Link
              to={n.post_id ? `/community/${n.post_id}` : '/community'}
              key={n.id}
              onClick={() => setOpen(false)}
              className={`flex items-start gap-2 p-3 hover:bg-muted/40 border-b border-border/30 ${!n.read ? 'bg-primary/5' : ''}`}
            >
              <UserAvatar src={n.actor?.avatar_url} username={n.actor?.username} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/90">
                  <span className="font-display text-primary">@{n.actor?.username || 'someone'}</span>{' '}
                  {n.type === 'like' ? 'liked your post' : n.type === 'mention' ? 'mentioned you' : 'commented on your post'}
                </p>
                <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
              {n.type === 'like' ? <Heart className="w-3 h-3 text-accent mt-1" /> : n.type === 'mention' ? <AtSign className="w-3 h-3 text-neon-purple mt-1" /> : <MessageSquare className="w-3 h-3 text-primary mt-1" />}
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
