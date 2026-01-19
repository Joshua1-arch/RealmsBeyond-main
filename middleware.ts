// @ts-nocheck
import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/token';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const user = token ? await verifyToken(token) : null;

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('returnTo', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Only allow admin role
    if (user.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
  ],
};
