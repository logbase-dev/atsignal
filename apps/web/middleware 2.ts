import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge Runtime에서는 환경 변수를 직접 접근해야 함
const BASIC_AUTH_USER = process.env.BASIC_AUTH_USER || 'admin';
const BASIC_AUTH_PASS = process.env.BASIC_AUTH_PASS || 'password';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 정적 파일 및 Next.js 내부 파일 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/videos') ||
    pathname.startsWith('/file.svg') ||
    pathname.startsWith('/globe.svg') ||
    pathname.startsWith('/next.svg') ||
    pathname.startsWith('/vercel.svg') ||
    pathname.startsWith('/window.svg') ||
    pathname.startsWith('/Textures.jpg') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|mov|mp4|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Basic Auth 헤더 확인
  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const [type, value] = authHeader.split(' ');

    if (type === 'Basic' && value) {
      try {
        const decoded = Buffer.from(value, 'base64').toString('utf-8');
        const colonIndex = decoded.indexOf(':');
        
        if (colonIndex === -1) {
          // 콜론이 없으면 잘못된 형식
          throw new Error('Invalid auth format');
        }
        
        const user = decoded.substring(0, colonIndex);
        const pass = decoded.substring(colonIndex + 1);

        // 디버깅용 (프로덕션에서는 제거)
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth check:', {
            received: { user, pass },
            expected: { user: BASIC_AUTH_USER, pass: BASIC_AUTH_PASS },
            match: user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS
          });
        }

        if (user === BASIC_AUTH_USER && pass === BASIC_AUTH_PASS) {
          return NextResponse.next();
        }
      } catch (e) {
        // 잘못된 형식의 인증 헤더
        console.error('Auth error:', e);
      }
    }
  }

  // 인증 실패 시 401 응답
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="AtSignal Protected Area"',
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mov|mp4|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};