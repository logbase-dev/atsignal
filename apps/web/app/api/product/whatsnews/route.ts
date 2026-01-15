import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * 공개 WhatsNew 목록 API
 * GET /api/product/whatsnews
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    
    console.log('[WhatsNews API] Using Firebase Admin SDK with options:', { page, limit, search });

    // Firebase Admin SDK로 직접 조회
    let query = db.collection('whatsnew')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let whatsnews = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        publishedAt: data.publishedAt?.toDate(),
      };
    });

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      whatsnews = whatsnews.filter((item: any) => 
        item.title?.ko?.toLowerCase().includes(searchLower) ||
        item.title?.en?.toLowerCase().includes(searchLower) ||
        item.content?.ko?.toLowerCase().includes(searchLower) ||
        item.content?.en?.toLowerCase().includes(searchLower) ||
        item.oneLiner?.ko?.toLowerCase().includes(searchLower) ||
        item.oneLiner?.en?.toLowerCase().includes(searchLower)
      );
    }

    const total = whatsnews.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = whatsnews.slice(startIndex, endIndex);

    return NextResponse.json({
      whatsnews: paginatedItems,
      items: paginatedItems, // 호환성을 위해 둘 다 제공
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('[WhatsNews API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}