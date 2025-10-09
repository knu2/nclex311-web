import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that should only be accessible to non-authenticated users
const AUTH_ROUTES = ['/login', '/signup'];

// Routes that require authentication
const PROTECTED_ROUTES = ['/chapters', '/concepts', '/dashboard'];

/**
 * Middleware for authentication-based route protection.
 * - Redirects authenticated users away from auth pages to /chapters
 * - Redirects unauthenticated users from protected routes to /login
 *
 * Note: Uses getToken() from next-auth/jwt which is Edge runtime compatible.
 * The getCurrentSession() function depends on bcrypt which cannot run in Edge runtime.
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for RSC (React Server Component) prefetch/fetch requests
  // These are internal Next.js requests that shouldn't trigger auth redirects
  const isRSCRequest =
    searchParams.has('_rsc') ||
    request.headers.get('rsc') === '1' ||
    request.headers.get('next-router-prefetch') === '1';

  // Skip middleware if this is an RSC prefetch or navigation from auth pages
  const nextUrl = request.headers.get('next-url');
  const isFromAuthPage = nextUrl === '/login' || nextUrl === '/signup';
  const isProtectedPath = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isRSCRequest || (isFromAuthPage && isProtectedPath)) {
    return NextResponse.next();
  }

  // Get current session token (Edge runtime compatible)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;

  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Check if current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Authenticated user tries to access auth pages → redirect to /chapters
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/chapters', request.url));
  }

  // Unauthenticated user tries to access protected route → redirect to /login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original URL as callback
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Configure middleware to run on specific paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
