// This file is intentionally empty.
// Route protection is handled by src/proxy.ts (Next.js 16 convention).


function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = decodeJwtPayload(token);

  // Token invalid or expired
  if (!payload || !payload.role || (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000)) {
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete(COOKIE);
    return res;
  }

  const role = payload.role as string;

  // Role-based route protection
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/teacher') && role !== 'teacher') {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (pathname.startsWith('/student') && role !== 'student') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*'],
};
