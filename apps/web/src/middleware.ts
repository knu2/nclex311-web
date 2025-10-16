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

  // Return 404 for static assets under /concepts/ to prevent treating them as concept slugs
  if (
    pathname.startsWith('/concepts/') &&
    /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|zip)$/i.test(pathname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  // Skip middleware for RSC (React Server Component) prefetch/fetch requests
  // These are internal Next.js requests that shouldn't trigger auth redirects
  const isRSCRequest =
    searchParams.has('_rsc') ||
    request.headers.get('rsc') === '1' ||
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('next-router-state-tree') !== null ||
    request.headers.get('x-nextjs-data') !== null;

  // Skip middleware if this is an RSC prefetch or navigation from auth pages
  const nextUrl = request.headers.get('next-url');
  const referer = request.headers.get('referer');
  const isFromAuthPage =
    nextUrl === '/login' ||
    nextUrl === '/signup' ||
    referer?.includes('/login') ||
    referer?.includes('/signup');
  const isProtectedPath = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Skip auth check for RSC requests - they inherit the parent page's auth state
  if (isRSCRequest) {
    return NextResponse.next();
  }

  // Skip auth check for navigations from auth pages to protected pages
  // This prevents redirect loops after successful login
  if (isFromAuthPage && isProtectedPath) {
    return NextResponse.next();
  }

  // Get current session token (Edge runtime compatible)
  // NextAuth v5 uses a different cookie name format
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    // Explicitly specify the cookie name for NextAuth v5
    cookieName:
      process.env.NODE_ENV === 'production'
        ? '__Secure-authjs.session-token'
        : 'authjs.session-token',
  });
  const isAuthenticated = !!token;

  // Check if current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Check if current path is a protected route
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  // Authenticated user tries to access auth pages → redirect to callbackUrl or /chapters
  if (isAuthenticated && isAuthRoute) {
    const callbackUrl = searchParams.get('callbackUrl');
    // If there's a callbackUrl, redirect there; otherwise default to /chapters
    const redirectUrl = callbackUrl || '/chapters';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
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
