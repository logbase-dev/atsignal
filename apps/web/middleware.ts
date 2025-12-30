import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Admin 경로 확인
  if (req.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set('x-is-admin', 'true');
  }
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mov|mp4|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};