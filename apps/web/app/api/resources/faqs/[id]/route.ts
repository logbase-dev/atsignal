import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 항상 최신 카테고리 반환 (캐시 비활성화)
export const dynamic = 'force-dynamic';

/**
 * 공개 FAQ 상세 API
 * GET /api/resources/faqs/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('[FAQ Detail API] Using Firebase Admin SDK for ID:', id);

    // Firebase Admin SDK로 직접 조회
    const doc = await db.collection('faqs').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'FAQ not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    const faq = {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
    };

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('[FAQ Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}