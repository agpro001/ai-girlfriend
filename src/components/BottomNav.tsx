import { Link, useLocation } from 'react-router-dom';
import { Home, Users, ImageIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export default function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home', match: '/dashboard' },
    { to: '/community', icon: Users, label: 'Community', match: '/community' },
    { to: '/gallery', icon: ImageIcon, label: 'Gallery', match: '/gallery' },
    ...(isAdmin ? [{ to: '/admin/moderation', icon: ShieldCheck, label: 'Mod', match: '/admin' }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, match }) => {
          const active = pathname.startsWith(match);
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-display tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
