import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import LiveWallpaper, { type WallpaperData } from '@/components/LiveWallpaper';
import BottomNav from '@/components/BottomNav';

type Wp = WallpaperData & { id: string; name: string; collection_id: string | null };
type Coll = { id: string; slug: string; name: string };

const PRESETS = ['aurora', 'neon-grid', 'particles', 'matrix', 'petals'];

export default function AdminWallpapers() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [colls, setColls] = useState<Coll[]>([]);
  const [walls, setWalls] = useState<Wp[]>([]);
  const [globalId, setGlobalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // new wp form
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'static' | 'live'>('live');
  const [preset, setPreset] = useState('aurora');
  const [gradient, setGradient] = useState('');
  const [primary, setPrimary] = useState('#9333ea');
  const [accent, setAccent] = useState('#ec4899');
  const [collectionId, setCollectionId] = useState<string>('');

  const load = async () => {
    const [{ data: c }, { data: w }, { data: g }] = await Promise.all([
      supabase.from('wallpaper_collections' as any).select('id, slug, name').order('name'),
      supabase.from('wallpapers' as any).select('id, name, collection_id, kind, preset, gradient, primary_color, accent_color, image_url').order('name'),
      supabase.from('user_wallpaper_settings' as any).select('wallpaper_id').eq('is_global', true).maybeSingle(),
    ]);
    setColls((c || []) as any);
    setWalls((w || []) as any);
    setGlobalId((g as any)?.wallpaper_id || null);
    if (!collectionId && (c as any)?.length) setCollectionId((c as any)[0].id);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const create = async () => {
    if (!name) return;
    const { error } = await supabase.from('wallpapers' as any).insert({
      name, kind, preset: kind === 'live' ? preset : null, gradient: kind === 'static' ? gradient : null,
      primary_color: primary, accent_color: accent, collection_id: collectionId || null,
    });
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else { setName(''); load(); }
  };

  const remove = async (id: string) => {
    await supabase.from('wallpapers' as any).delete().eq('id', id);
    load();
  };

  const setGlobal = async (id: string) => {
    // upsert single global row
    const { data: existing } = await supabase.from('user_wallpaper_settings' as any)
      .select('id').eq('is_global', true).maybeSingle();
    if ((existing as any)?.id) {
      await supabase.from('user_wallpaper_settings' as any).update({ wallpaper_id: id, updated_by: user!.id, updated_at: new Date().toISOString() }).eq('id', (existing as any).id);
    } else {
      await supabase.from('user_wallpaper_settings' as any).insert({ wallpaper_id: id, is_global: true, updated_by: user!.id });
    }
    toast({ title: 'Set as global wallpaper' });
    load();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md z-10">
        <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">WALLS</h1>
      </header>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="glass rounded-xl p-4 border border-border/50 space-y-2">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground">CREATE NEW</h3>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="bg-muted" />
          <div className="flex gap-2">
            <select value={kind} onChange={e => setKind(e.target.value as any)} className="bg-muted text-foreground text-sm rounded px-2 py-1 flex-1">
              <option value="live">Live</option><option value="static">Static</option>
            </select>
            <select value={collectionId} onChange={e => setCollectionId(e.target.value)} className="bg-muted text-foreground text-sm rounded px-2 py-1 flex-1">
              {colls.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {kind === 'live' ? (
            <select value={preset} onChange={e => setPreset(e.target.value)} className="bg-muted text-foreground text-sm rounded px-2 py-1 w-full">
              {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            <Input value={gradient} onChange={e => setGradient(e.target.value)} placeholder="CSS background, e.g. linear-gradient(...)" className="bg-muted" />
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Primary <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-full h-8" /></label>
            <label className="text-xs text-muted-foreground">Accent <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-full h-8" /></label>
          </div>
          <Button onClick={create} size="sm" className="w-full"><Plus className="w-3 h-3 mr-1" />Create</Button>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          <div className="grid grid-cols-2 gap-3">
            {walls.map(w => (
              <div key={w.id} className="relative rounded-xl overflow-hidden border border-border/50 h-40">
                <div className="absolute inset-0">
                  <LiveWallpaper wp={w} />
                </div>
                <div className="absolute inset-0 bg-background/30 hover:bg-background/10 transition-colors flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-background/70 text-foreground font-display tracking-wider">{w.kind}</span>
                    {globalId === w.id && <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-primary-foreground">ACTIVE</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground bg-background/70 px-2 py-1 rounded">{w.name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="secondary" className="w-7 h-7" onClick={() => setGlobal(w.id)}><Globe className="w-3 h-3" /></Button>
                      <Button size="icon" variant="destructive" className="w-7 h-7" onClick={() => remove(w.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
