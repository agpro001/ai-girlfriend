import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  // Stay in loading state until we have a userId AND a definitive RPC result.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      // Auth not ready yet — do NOT conclude "not admin", keep loading true.
      setIsAdmin(false);
      setLoading(true);
      return;
    }

    setLoading(true);
    supabase
      .rpc('has_role' as any, { _user_id: userId, _role: 'admin' })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('has_role error', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isAdmin, loading };
}
