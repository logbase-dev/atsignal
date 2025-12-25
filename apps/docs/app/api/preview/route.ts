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
  const target = new URL(`/${locale}/${normalizedSlug}`, request.url);
  target.searchParams.set('preview', '1');
  target.searchParams.set('draftId', draftId);
  return NextResponse.redirect(target);
}
