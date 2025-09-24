import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

/**
 * Authentication utility functions for server-side usage
 */

/**
 * Get the current user session on the server side
 * Returns the session or null if not authenticated
 */
export async function getCurrentSession() {
  try {
    return await getServerSession();
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
