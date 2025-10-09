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
  trustHost: true, // Trust the host for local production builds
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
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // Persist user data to token on sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id and email to session from token
      if (token && session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
