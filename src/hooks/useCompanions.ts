import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COMPANIONS as BASE } from '@/types/companion';
import type { Companion } from '@/types/companion';

type Override = {
  companion_id: string;
  name: string | null;
  tagline: string | null;
  description: string | null;
  hidden_goal: string | null;
  trust_threshold: number | null;
  neon_color: string | null;
  agreeableness: number | null;
  neuroticism: number | null;
  sarcasm: number | null;
  ambition: number | null;
  empathy: number | null;
  enabled: boolean;
};

function merge(base: Companion, ov?: Override): Companion {
  if (!ov) return base;
  return {
    ...base,
    name: ov.name ?? base.name,
    tagline: ov.tagline ?? base.tagline,
    description: ov.description ?? base.description,
    hidden_goal: ov.hidden_goal ?? base.hidden_goal,
    trust_threshold: ov.trust_threshold ?? base.trust_threshold,
    neon_color: (ov.neon_color as Companion['neon_color']) ?? base.neon_color,
    personality: {
      agreeableness: ov.agreeableness ?? base.personality.agreeableness,
      neuroticism: ov.neuroticism ?? base.personality.neuroticism,
      sarcasm: ov.sarcasm ?? base.personality.sarcasm,
      ambition: ov.ambition ?? base.personality.ambition,
      empathy: ov.empathy ?? base.personality.empathy,
    },
  };
}

export function useCompanions() {
  const [companions, setCompanions] = useState<Companion[]>(BASE);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from('companion_overrides' as any).select('*');
      if (!active) return;
      const map = new Map<string, Override>();
      (data || []).forEach((o: any) => map.set(o.companion_id, o));
      const merged = BASE
        .map(c => ({ base: c, ov: map.get(c.id) }))
        .filter(x => !x.ov || x.ov.enabled !== false)
        .map(x => merge(x.base, x.ov));
      setCompanions(merged);
    };
    load();
    const ch = supabase
      .channel('companion-overrides-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companion_overrides' }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  return companions;
}

export function useCompanion(id: string | undefined) {
  const all = useCompanions();
  return all.find(c => c.id === id);
}
