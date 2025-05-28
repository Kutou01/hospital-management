// Compatibility hook that wraps useEnhancedAuth
import { useEnhancedAuth } from '@/lib/auth/enhanced-auth-context';

export const useAuthProvider = () => {
  return useEnhancedAuth();
};
