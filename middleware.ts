import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For /app and /admin routes, ensure they're always dynamic
  if (request.nextUrl.pathname.startsWith('/app') || request.nextUrl.pathname.startsWith('/admin')) {
    const response = NextResponse.next();
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};
