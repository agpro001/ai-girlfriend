import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { COMPANIONS } from '@/types/companion';
import BottomNav from '@/components/BottomNav';

type Form = {
  companion_id: string;
  name: string; tagline: string; description: string; hidden_goal: string;
  trust_threshold: number; neon_color: string;
  agreeableness: number; neuroticism: number; sarcasm: number; ambition: number; empathy: number;
  enabled: boolean;
};

export default function AdminModels() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [forms, setForms] = useState<Record<string, Form>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase.from('companion_overrides' as any).select('*');
      const map = new Map<string, any>();
      (data || []).forEach((o: any) => map.set(o.companion_id, o));
      const out: Record<string, Form> = {};
      COMPANIONS.forEach(c => {
        const ov = map.get(c.id);
        out[c.id] = {
          companion_id: c.id,
          name: ov?.name ?? c.name,
          tagline: ov?.tagline ?? c.tagline,
          description: ov?.description ?? c.description,
          hidden_goal: ov?.hidden_goal ?? c.hidden_goal,
          trust_threshold: ov?.trust_threshold ?? c.trust_threshold,
          neon_color: ov?.neon_color ?? c.neon_color,
          agreeableness: ov?.agreeableness ?? c.personality.agreeableness,
          neuroticism: ov?.neuroticism ?? c.personality.neuroticism,
          sarcasm: ov?.sarcasm ?? c.personality.sarcasm,
          ambition: ov?.ambition ?? c.personality.ambition,
          empathy: ov?.empathy ?? c.personality.empathy,
          enabled: ov?.enabled ?? true,
        };
      });
      setForms(out);
      setLoading(false);
    })();
  }, [isAdmin]);

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const save = async (id: string) => {
    setSaving(id);
    const f = forms[id];
    const { error } = await supabase.from('companion_overrides' as any)
      .upsert({ ...f, updated_by: user!.id, updated_at: new Date().toISOString() }, { onConflict: 'companion_id' });
    setSaving(null);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Saved', description: `${f.name} updated live for all users.` });
  };

  const set = (id: string, k: keyof Form, v: any) =>
    setForms(prev => ({ ...prev, [id]: { ...prev[id], [k]: v } }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md z-10">
        <Link to="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">MODELS</h1>
      </header>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> :
          COMPANIONS.map(c => {
            const f = forms[c.id]; if (!f) return null;
            return (
              <div key={c.id} className="glass rounded-xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm text-foreground">{c.id.toUpperCase()}</h3>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={f.enabled} onChange={e => set(c.id, 'enabled', e.target.checked)} />
                    Enabled
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={f.name} onChange={e => set(c.id, 'name', e.target.value)} placeholder="Name" className="bg-muted" />
                  <Input value={f.neon_color} onChange={e => set(c.id, 'neon_color', e.target.value)} placeholder="pink|blue|gold|red" className="bg-muted" />
                </div>
                <Input value={f.tagline} onChange={e => set(c.id, 'tagline', e.target.value)} placeholder="Tagline" className="bg-muted" />
                <Textarea value={f.description} onChange={e => set(c.id, 'description', e.target.value)} placeholder="Description" className="bg-muted" rows={2} />
                <Textarea value={f.hidden_goal} onChange={e => set(c.id, 'hidden_goal', e.target.value)} placeholder="Hidden goal" className="bg-muted" rows={2} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground">Trust threshold
                    <Input type="number" value={f.trust_threshold} onChange={e => set(c.id, 'trust_threshold', Number(e.target.value))} className="bg-muted mt-1" />
                  </label>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(['agreeableness','neuroticism','sarcasm','ambition','empathy'] as const).map(k => (
                    <label key={k} className="text-[10px] text-muted-foreground capitalize">{k}
                      <Input type="number" step="0.05" min="0" max="1" value={f[k] as number} onChange={e => set(c.id, k, Number(e.target.value))} className="bg-muted mt-1" />
                    </label>
                  ))}
                </div>
                <Button onClick={() => save(c.id)} disabled={saving === c.id} size="sm" className="w-full">
                  {saving === c.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                  Save & broadcast
                </Button>
              </div>
            );
          })
        }
      </div>
      <BottomNav />
    </div>
  );
}
