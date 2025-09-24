import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { supabase } from '@/lib/database';

/**
 * NextAuth credentials provider for email/password login
 * - Validates credentials against users table
 * - Passwords compared using bcrypt
 */
export const {
  handlers: { GET, POST },
} = NextAuth({
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
          // Cast to untyped client for flexible selects (typed schema may diverge)
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
  callbacks: {
    async session({ session, token }) {
      if (token && session.user && token.sub) {
        // Add user id to session from token
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
