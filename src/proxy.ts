import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE PROTECTION CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/farmer/login',
  '/manifest.json',
  '/sw.js',
  '/icon.png',
  '/apple-icon.png',
  '/favicon.ico',
  '/about',
  '/mission',
  '/careers',
  '/press-kit',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/farmer-otp/send',
  '/api/auth/farmer-otp/verify',
  '/api/auth/farmer-otp/logout',
  '/api/manifest',
  '/api/data',
  '/api/branches',
  '/api/farmers',
  '/api/collections',
  '/api/payments',
  '/api/payments/razorpay',
  '/api/settings',
  '/api/seed-supabase',
]);

const PUBLIC_PREFIXES = [
  '/farmer/',
  '/branch/',
  '/api/farmer/',
  '/api/ai-mitra',
  '/api/notifications',
  '/api/payments/',
  '/solutions/',
  '/legal/',
];

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY HEADERS
// ─────────────────────────────────────────────────────────────────────────────

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.razorpay.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.razorpay.com https://lumberjack.razorpay.com",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    ].join('; ')
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROXY — runs before EVERY request (Next.js 16 standard)
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublic =
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg');

  // ── 1. Farmer Session Check: Only auto-redirect when explicitly visiting the farmer login page ──
  const farmerToken = request.cookies.get('3t_farmer_token')?.value;
  if (farmerToken && pathname === '/farmer/login') {
    const farmerSession = await verifySession(farmerToken);
    if (farmerSession && farmerSession.role === 'farmer' && farmerSession.name) {
      const farmerId = farmerSession.name;
      const res = NextResponse.redirect(new URL(`/farmer/${farmerId}`, request.url));
      return addSecurityHeaders(res);
    }
  }

  if (isPublic) {
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  // ── Verify session token ──
  const token = request.cookies.get('3t_session_token')?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
      return addSecurityHeaders(res);
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(res);
  }

  const session = await verifySession(token);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json(
        { success: false, error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
      res.cookies.delete('3t_session_token');
      return addSecurityHeaders(res);
    }
    const loginUrl = new URL('/login', request.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('3t_session_token');
    return addSecurityHeaders(res);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-email', session.email);
  requestHeaders.set('x-user-role', session.role);
  requestHeaders.set('x-user-name', session.name);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return addSecurityHeaders(res);
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
