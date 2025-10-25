import { redirect } from 'next/navigation';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { supabase } from '@/lib/database';

/**
 * Extended session user type including subscription data
 */
interface ExtendedSessionUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
  autoRenew?: boolean;
  subscriptionPlan?: string | null;
}

/**
 * NextAuth v5 auth instance for server-side session management
 */
const { auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const client =
            supabase as unknown as import('@supabase/supabase-js').SupabaseClient;
          const { data, error } = await client
            .from('users')
            .select('id, email, password_hash')
            .eq('email', email)
            .limit(1)
            .maybeSingle();

          if (error || !data?.password_hash) {
            return null;
          }

          const isValid = await bcrypt.compare(password, data.password_hash);
          if (!isValid) {
            return null;
          }

          return {
            id: data.id,
            email: data.email,
            name: data.email,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token?.sub) {
        try {
          // Fetch fresh user data including subscription from database
          const client =
            supabase as unknown as import('@supabase/supabase-js').SupabaseClient;
          const { data: userData } = await client
            .from('users')
            .select(
              'subscription_status, subscription_expires_at, auto_renew, subscription_plan'
            )
            .eq('id', token.sub)
            .maybeSingle();

          if (userData && session.user) {
            // Add user id and subscription data to session
            (session.user as ExtendedSessionUser).id = token.sub;
            (session.user as ExtendedSessionUser).subscriptionStatus =
              userData.subscription_status || 'free';
            (session.user as ExtendedSessionUser).subscriptionExpiresAt =
              userData.subscription_expires_at || null;
            (session.user as ExtendedSessionUser).autoRenew =
              userData.auto_renew || false;
            (session.user as ExtendedSessionUser).subscriptionPlan =
              userData.subscription_plan || null;
          }
        } catch (error) {
          console.error('Error fetching user subscription data:', error);
          // Fallback: still include user ID even if subscription fetch fails
          if (session.user) {
            (session.user as ExtendedSessionUser).id = token.sub;
          }
        }
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Authentication utility functions for server-side usage
 */

/**
 * Get the current user session on the server side
 * Returns the session or null if not authenticated
 */
export async function getCurrentSession() {
  try {
    return await auth();
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
}

/**
 * Require authentication on the server side
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect('/auth/login');
  }
  return session;
}

/**
 * Check if user is authenticated (server-side)
 * Returns boolean without redirecting
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session?.user;
}
