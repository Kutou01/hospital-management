// Auth API exports - now using Auth Service
export { authServiceApi as authApi } from '../api/auth';
export type {
  AuthUser as HospitalUser,
  LoginCredentials,
  RegisterData,
  AuthResponse
} from '../api/auth';

// Export client-side auth guard hook
export { useAuthGuard, withAuthGuard, useAdminGuard, useDoctorGuard, usePatientGuard } from '../../hooks/useAuthGuard';

// Export client-side RLS helpers
export { clientRLS } from './rls-helpers';

// Note: Server-side auth-guard (withServerAuth) should be imported directly
// from lib/auth/auth-guard.ts in server components and getServerSideProps
