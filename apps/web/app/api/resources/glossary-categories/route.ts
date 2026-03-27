import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 항상 최신 카테고리 반환 (캐시 비활성화)
export const dynamic = 'force-dynamic';

/**
 * 공개 주요용어 카테고리 목록 API
 * GET /api/resources/glossary-categories
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Glossary Categories API] Using Firebase Admin SDK');

    // Firebase Admin SDK로 직접 조회
    const snapshot = await db.collection('glossaryCategories')
      .orderBy('order', 'asc')
      .get();

    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[Glossary Categories API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}