import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 정적 파일 및 Next.js 내부 파일 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname.startsWith('/assets') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|mov|mp4|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 쿠키에서 인증 토큰 확인
  const cookieStore = await cookies();
  const authToken = cookieStore.get('admin-auth')?.value;

  // 쿠키가 있으면 통과 (실제 관리자 검증은 각 페이지/API에서 처리)
  if (authToken) {
    try {
      // 토큰 디코딩 (형식: adminId:username)
      const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
      const [adminId] = decoded.split(':');

      // adminId가 있으면 통과 (Edge Runtime에서는 Firestore 검증 불가)
      if (adminId) {
        return NextResponse.next();
      }
    } catch (e) {
      console.error('Auth token decode error:', e);
    }
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mov|mp4|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};

