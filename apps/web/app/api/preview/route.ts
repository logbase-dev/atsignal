import { draftMode } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const draftId = searchParams.get('draftId');
  const slug = searchParams.get('slug');
  const locale = searchParams.get('locale') || 'ko';

  const previewSecret = process.env.NEXT_PUBLIC_PREVIEW_SECRET;
  if (!previewSecret) {
    console.warn('NEXT_PUBLIC_PREVIEW_SECRET is not configured');
  }

  if (!secret || secret !== previewSecret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (!draftId || !slug) {
    return NextResponse.json({ message: 'Missing draft parameters' }, { status: 400 });
  }

  draftMode().enable();

  const normalizedSlug = slug.replace(/^\/+/, '');
  
  // App Hosting에서는 request.url이 내부 URL을 포함하므로 고정 도메인 사용
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://web-ssr--atsignal-landing-dev-e8547.asia-east1.hosted.app'
    : new URL(request.url).origin;
    
  const target = new URL(`/${locale}/${normalizedSlug}`, baseUrl);
  target.searchParams.set('preview', '1');
  target.searchParams.set('draftId', draftId);
  
  // 디버깅 로그 추가
  console.log('[Preview API Debug]', {
    requestUrl: request.url,
    baseUrl,
    normalizedSlug,
    locale,
    draftId,
    targetUrl: target.toString()
  });
  
  return NextResponse.redirect(target);
}

