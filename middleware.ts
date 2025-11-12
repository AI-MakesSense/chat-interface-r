/**
 * Next.js Middleware for Route Protection
 *
 * Intercepts requests and validates authentication before allowing access
 * to protected routes. Uses JWT token from HTTP-only cookies.
 *
 * Protected Routes:
 * - /dashboard/* - User dashboard (requires authentication)
 * - /configurator/* - Widget configurator (requires authentication)
 * - /licenses/* - License management (requires authentication)
 *
 * Public Routes:
 * - /auth/* - Authentication pages (login, signup)
 * - / - Home page
 * - /api/widget/* - Widget serving (has its own validation)
 * - /api/stripe/webhook - Stripe webhook (no auth required)
 *
 * Redirect Behavior:
 * - Unauthenticated users accessing protected routes → /auth/login
 * - Authenticated users accessing auth pages → /dashboard
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * JWT secret key for token verification
 * Must match the key used in app/api/auth/* routes
 *
 * SECURITY: JWT_SECRET must be set in environment variables
 * and must be at least 32 characters for adequate security.
 */
const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET_STRING.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

/**
 * Protected route patterns
 * Routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/configurator',
  '/licenses',
];

/**
 * Auth route patterns
 * Routes that should redirect to dashboard if already authenticated
 */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
];

/**
 * Public API routes that skip authentication
 * These routes have their own validation logic
 */
const PUBLIC_API_ROUTES = [
  '/api/widget/', // Widget serving (validates license)
  '/api/stripe/webhook', // Stripe webhook (validates signature)
];

/**
 * Verify JWT token from HTTP-only cookie
 *
 * @param request - Next.js request object
 * @returns User ID if token is valid, null otherwise
 */
async function verifyAuth(request: NextRequest): Promise<string | null> {
  try {
    // Get token from HTTP-only cookie
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const verified = await jwtVerify(token, JWT_SECRET);

    // Extract user ID from payload
    const userId = verified.payload.userId as string;

    return userId || null;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Check if path matches any protected route pattern
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if path is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if path is a public API route
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Middleware function
 *
 * Runs on every request to protected routes and auth routes.
 * Validates authentication and redirects as needed.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public API routes
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Verify authentication
  const userId = await verifyAuth(request);
  const isAuthenticated = userId !== null;

  // Protected routes: Require authentication
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // User is authenticated, allow access
    return NextResponse.next();
  }

  // Auth routes: Redirect to dashboard if already authenticated
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      // User is already logged in, redirect to dashboard
      const url = new URL('/dashboard', request.url);
      return NextResponse.redirect(url);
    }

    // User is not authenticated, allow access to auth pages
    return NextResponse.next();
  }

  // All other routes: Allow access
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Defines which routes the middleware should run on.
 * Uses matcher to include only relevant paths for better performance.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
