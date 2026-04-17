import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Props {
  src?: string | null;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { xs: 'w-6 h-6 text-[9px]', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-base' };

export default function UserAvatar({ src, username, size = 'sm', className }: Props) {
  const initials = (username || 'U').slice(0, 2).toUpperCase();
  return (
    <Avatar className={cn(SIZES[size], 'border border-primary/30', className)}>
      {src && <AvatarImage src={src} alt={username || 'avatar'} />}
      <AvatarFallback className="bg-primary/20 text-primary font-display tracking-wider">{initials}</AvatarFallback>
    </Avatar>
  );
}
