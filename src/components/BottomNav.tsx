import { Link, useLocation } from 'react-router-dom';
import { Home, Users, ImageIcon, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/community', icon: Users, label: 'Community' },
  { to: '/gallery', icon: ImageIcon, label: 'Gallery' },
  { to: '/stats/sakura', icon: BarChart3, label: 'Stats' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to.replace('/sakura', ''));
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-display tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
