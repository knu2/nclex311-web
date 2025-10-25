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
    async jwt({ token, user, trigger }) {
      // Persist user data to token on sign in
      // Note: token.sub is automatically set by NextAuth from user.id
      if (user) {
        token.email = user.email;
      }

      // Fetch fresh subscription data on token update or session check
      if (trigger === 'update' || !token.subscriptionStatus) {
        try {
          const userService = new UserService();
          const userId = token.sub as string;
          const subscription = await userService.getSubscription(userId);

          if (subscription) {
            token.subscriptionStatus = subscription.status;
            token.subscriptionPlan = subscription.plan;
            token.subscriptionExpiresAt = subscription.expiresAt?.toISOString();
            token.autoRenew = subscription.autoRenew;
          }
        } catch (error) {
          console.error('Error fetching subscription for token:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user id, email, and subscription data to session from token
      if (token && session.user) {
        // Use token.sub (subject) which is automatically set by NextAuth from user.id
        (session.user as { id?: string }).id = token.sub as string;
        session.user.email = token.email as string;

        // Add subscription fields to session
        (
          session.user as {
            subscriptionStatus?: string;
            subscriptionPlan?: string;
            subscriptionExpiresAt?: string;
            autoRenew?: boolean;
          }
        ).subscriptionStatus = token.subscriptionStatus as string | undefined;
        (session.user as { subscriptionPlan?: string }).subscriptionPlan =
          token.subscriptionPlan as string | undefined;
        (
          session.user as { subscriptionExpiresAt?: string }
        ).subscriptionExpiresAt = token.subscriptionExpiresAt as
          | string
          | undefined;
        (session.user as { autoRenew?: boolean }).autoRenew =
          token.autoRenew as boolean | undefined;
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
