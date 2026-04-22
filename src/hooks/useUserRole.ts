import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserRole(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsAdmin(false); setLoading(false); return; }
    supabase.rpc('has_role' as any, { _user_id: userId, _role: 'admin' }).then(({ data }) => {
      setIsAdmin(Boolean(data));
      setLoading(false);
    });
  }, [userId]);

  return { isAdmin, loading };
}
