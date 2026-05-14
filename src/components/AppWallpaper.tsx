import { useAuth } from '@/hooks/useAuth';
import { useActiveWallpaper } from '@/hooks/useActiveWallpaper';
import LiveWallpaper from './LiveWallpaper';

export default function AppWallpaper() {
  const { user } = useAuth();
  const wp = useActiveWallpaper(user?.id);
  return <LiveWallpaper wp={wp} />;
}
