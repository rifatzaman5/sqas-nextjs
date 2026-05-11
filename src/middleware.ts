import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? verifyToken(token) : null;

  // Public routes
  if (pathname === '/login' || pathname === '/') {
    if (user && pathname === '/') {
      return NextResponse.redirect(new URL(`/${user.role}`, request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — not logged in
  if (!user) {
    // Preserve the original URL (with ?token=XXX query) so login can bounce back
    const next = encodeURIComponent(pathname + search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url));
  }

  // Role-based access
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }
  if (pathname.startsWith('/teacher') && user.role !== 'teacher') {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }
  if (pathname.startsWith('/student') && user.role !== 'student') {
    return NextResponse.redirect(new URL(`/${user.role}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/teacher/:path*', '/student/:path*'],
};
