import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { UserService } from '@/lib/db/services';

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
          // Use UserService to authenticate user
          const userService = new UserService();
          const user = await userService.authenticateUser(email, password);

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.email, // Use email as display name since fullName doesn't exist in current schema
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
