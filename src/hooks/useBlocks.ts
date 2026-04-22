import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useBlocks(userId: string | undefined) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('community_blocks' as any).select('blocked_id').eq('blocker_id', userId);
    setBlockedIds(new Set((data as any[] | null)?.map(b => b.blocked_id) || []));
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const block = async (blockedId: string) => {
    if (!userId || blockedId === userId) return;
    const { error } = await supabase.from('community_blocks' as any).insert({ blocker_id: userId, blocked_id: blockedId });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'User blocked' }); refresh(); }
  };

  const unblock = async (blockedId: string) => {
    if (!userId) return;
    await supabase.from('community_blocks' as any).delete().eq('blocker_id', userId).eq('blocked_id', blockedId);
    toast({ title: 'User unblocked' });
    refresh();
  };

  return { blockedIds, block, unblock, isBlocked: (id: string) => blockedIds.has(id), refresh };
}
