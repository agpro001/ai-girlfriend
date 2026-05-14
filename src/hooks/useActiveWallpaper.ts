import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WallpaperData } from '@/components/LiveWallpaper';

export function useActiveWallpaper(userId: string | undefined) {
  const [wp, setWp] = useState<WallpaperData | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      // user-specific first, then global
      const { data: settings } = await supabase
        .from('user_wallpaper_settings' as any)
        .select('wallpaper_id, target_user_id, is_global')
        .or(`target_user_id.eq.${userId || '00000000-0000-0000-0000-000000000000'},is_global.eq.true`);
      const list = (settings || []) as any[];
      const chosen = list.find(s => s.target_user_id === userId) || list.find(s => s.is_global);
      if (!chosen?.wallpaper_id) { if (active) setWp(null); return; }
      const { data: w } = await supabase
        .from('wallpapers' as any).select('kind, preset, gradient, primary_color, accent_color, image_url')
        .eq('id', chosen.wallpaper_id).maybeSingle();
      if (active) setWp((w as any) || null);
    };
    load();
    const ch = supabase
      .channel('wallpaper-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallpaper_settings' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallpapers' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [userId]);

  return wp;
}
