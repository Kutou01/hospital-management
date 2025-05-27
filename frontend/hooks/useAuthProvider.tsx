// Compatibility hook that wraps useSupabaseAuth
import { useSupabaseAuth } from '@/lib/hooks/useSupabaseAuth';

export const useAuthProvider = () => {
  return useSupabaseAuth();
};
