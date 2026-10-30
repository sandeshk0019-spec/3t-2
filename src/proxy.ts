import { NextRequest, NextResponse } from 'next/server';
import {
  verifySession,
  ADMIN_COOKIE_NAME,
  FARMER_COOKIE_NAME,
  LEGACY_ADMIN_COOKIE,
  LEGACY_FARMER_COOKIE
} from '@/lib/auth';

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
  '/api/auth/bank-update-otp/send',
  '/api/auth/bank-update-otp/verify',
  '/api/display-sync',
  '/api/admin/broadcast',
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
  '/branch/',
  '/api/ai-mitra',
  '/api/notifications',
  '/api/payments/',
  '/api/auth/bank-update-otp/',
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

  // ── 0. Static assets and internal paths pass through ──
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // ── 1. Farmer Passbook Protection (/farmer/[farmerId]) ──
  // Any attempt to view a farmer passbook requires valid OTP session for THAT farmer
  if (pathname.startsWith('/farmer/') && pathname !== '/farmer/login') {
    const parts = pathname.split('/').filter(Boolean);
    const requestedFarmerId = parts[1]?.toUpperCase();

    const farmerToken = request.cookies.get(FARMER_COOKIE_NAME)?.value;

    if (!farmerToken) {
      const loginUrl = new URL('/farmer/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(LEGACY_FARMER_COOKIE);
      res.cookies.delete(LEGACY_ADMIN_COOKIE);
      return addSecurityHeaders(res);
    }

    const farmerSession = await verifySession(farmerToken);

    if (!farmerSession || farmerSession.role !== 'farmer' || !farmerSession.name) {
      const loginUrl = new URL('/farmer/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(FARMER_COOKIE_NAME);
      res.cookies.delete(LEGACY_FARMER_COOKIE);
      return addSecurityHeaders(res);
    }

    // Ensure session farmer ID strictly matches the requested URL
    if (requestedFarmerId && farmerSession.name.toUpperCase() !== requestedFarmerId) {
      const loginUrl = new URL('/farmer/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      loginUrl.searchParams.set('error', 'unauthorized');
      const res = NextResponse.redirect(loginUrl);
      return addSecurityHeaders(res);
    }

    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  // ── 2. Farmer Ledger Data API Protection (/api/farmer/[farmerId]/data) ──
  if (pathname.match(/^\/api\/farmer\/[^/]+\/data/)) {
    const parts = pathname.split('/').filter(Boolean);
    const requestedFarmerId = parts[2]?.toUpperCase();

    const farmerToken = request.cookies.get(FARMER_COOKIE_NAME)?.value;
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    let authorized = false;

    if (farmerToken) {
      const session = await verifySession(farmerToken);
      if (session && session.role === 'farmer' && session.name?.toUpperCase() === requestedFarmerId) {
        authorized = true;
      }
    }

    if (!authorized && adminToken) {
      const adminSession = await verifySession(adminToken);
      if (adminSession && (adminSession.role === 'SUPER_ADMIN' || adminSession.role === 'BRANCH_MANAGER')) {
        authorized = true;
      }
    }

    if (!authorized) {
      const res = NextResponse.json(
        { success: false, error: 'Unauthorized. Valid farmer OTP session required.' },
        { status: 401 }
      );
      return addSecurityHeaders(res);
    }

    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  // ── 3. Check if route is public ──
  const isPublic =
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPublic) {
    const res = NextResponse.next();
    return addSecurityHeaders(res);
  }

  // ── 4. Admin & Protected Routes (e.g. /dashboard, /dashboard/*) ──
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

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
    res.cookies.delete(LEGACY_ADMIN_COOKIE);
    res.cookies.delete(LEGACY_FARMER_COOKIE);
    return addSecurityHeaders(res);
  }

  const session = await verifySession(token);

  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'BRANCH_MANAGER')) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json(
        { success: false, error: 'Session expired or unauthorized. Please log in again.' },
        { status: 401 }
      );
      res.cookies.delete(ADMIN_COOKIE_NAME);
      res.cookies.delete(LEGACY_ADMIN_COOKIE);
      return addSecurityHeaders(res);
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(ADMIN_COOKIE_NAME);
    res.cookies.delete(LEGACY_ADMIN_COOKIE);
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
