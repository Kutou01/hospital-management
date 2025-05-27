import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { createServerSupabaseClient } from '../supabase-server';
import { HospitalUser } from './supabase-auth';

// Types for auth guard
export interface AuthGuardOptions {
  requiredRoles?: string[];
  redirectTo?: string;
  requireEmailVerified?: boolean;
}

export interface AuthPageProps {
  user: HospitalUser | null;
  session: any;
}

// Server-side auth guard for getServerSideProps
export function withServerAuth(
  getServerSidePropsFunc?: GetServerSideProps,
  options: AuthGuardOptions = {}
): GetServerSideProps {
  return async (context: GetServerSidePropsContext) => {
    const {
      requiredRoles = [],
      redirectTo = '/auth/login',
      requireEmailVerified = false
    } = options;

    try {
      const supabase = createServerSupabaseClient();
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return {
          redirect: {
            destination: redirectTo,
            permanent: false,
          },
        };
      }

      // Check if user is authenticated
      if (!session?.user) {
        return {
          redirect: {
            destination: `${redirectTo}?redirectTo=${encodeURIComponent(context.resolvedUrl)}`,
            permanent: false,
          },
        };
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        return {
          redirect: {
            destination: '/auth/complete-profile',
            permanent: false,
          },
        };
      }

      // Check if account is active
      if (!profile.is_active) {
        return {
          redirect: {
            destination: '/auth/account-suspended',
            permanent: false,
          },
        };
      }

      // Check email verification if required
      if (requireEmailVerified && !profile.email_verified) {
        return {
          redirect: {
            destination: '/auth/verify-email',
            permanent: false,
          },
        };
      }

      // Check role permissions
      if (requiredRoles.length > 0 && !requiredRoles.includes(profile.role)) {
        return {
          redirect: {
            destination: '/unauthorized',
            permanent: false,
          },
        };
      }

      // Create hospital user object
      const hospitalUser: HospitalUser = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        is_active: profile.is_active,
        profile_id: profile.id,
        created_at: profile.created_at,
        last_login: profile.last_login,
        email_verified: profile.email_verified,
        phone_verified: profile.phone_verified,
      };

      // Call the original getServerSideProps if provided
      if (getServerSidePropsFunc) {
        const result = await getServerSidePropsFunc(context);
        
        if ('props' in result) {
          return {
            props: {
              ...result.props,
              user: hospitalUser,
              session: session,
            },
          };
        }
        
        return result;
      }

      // Default return with user data
      return {
        props: {
          user: hospitalUser,
          session: session,
        },
      };

    } catch (error) {
      console.error('Auth guard error:', error);
      return {
        redirect: {
          destination: redirectTo,
          permanent: false,
        },
      };
    }
  };
}
