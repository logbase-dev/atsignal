import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * 공개 FAQ 목록 API
 * GET /api/resources/faqs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const enabledKo = searchParams.get('enabledKo');
    const enabledEn = searchParams.get('enabledEn');
    const orderBy = searchParams.get('orderBy') || 'createdAt';
    const orderDirection = searchParams.get('orderDirection') || 'desc';
    
    console.log('[FAQs API] Using Firebase Admin SDK with options:', { 
      page, limit, search, categoryId, enabledKo, enabledEn, orderBy, orderDirection 
    });

    // Firebase Admin SDK로 직접 조회
    let query = db.collection('faqs').orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let faqs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });

    // 필터링
    if (categoryId) {
      faqs = faqs.filter((faq: any) => faq.categoryId === categoryId);
    }

    if (enabledKo === 'true') {
      faqs = faqs.filter((faq: any) => faq.enabled?.ko === true);
    }

    if (enabledEn === 'true') {
      faqs = faqs.filter((faq: any) => faq.enabled?.en === true);
    }

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      faqs = faqs.filter((faq: any) => 
        faq.question?.ko?.toLowerCase().includes(searchLower) ||
        faq.question?.en?.toLowerCase().includes(searchLower) ||
        faq.answer?.ko?.toLowerCase().includes(searchLower) ||
        faq.answer?.en?.toLowerCase().includes(searchLower)
      );
    }

    // 정렬 적용
    faqs.sort((a: any, b: any) => {
      if (orderBy === 'isTop') {
        // isTop: true가 먼저 오도록 정렬, 그 다음 level 오름차순
        if (a.isTop !== b.isTop) {
          return orderDirection === 'desc' 
            ? (b.isTop === true ? 1 : -1) 
            : (a.isTop === true ? 1 : -1);
        }
        // isTop이 같으면 level로 정렬 (낮은 값이 먼저)
        const levelA = a.level ?? 999;
        const levelB = b.level ?? 999;
        return levelA - levelB;
      } else if (orderBy === 'level') {
        const levelA = a.level ?? 999;
        const levelB = b.level ?? 999;
        return orderDirection === 'asc' ? levelA - levelB : levelB - levelA;
      } else {
        // createdAt 기본 정렬
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return orderDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    const total = faqs.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFaqs = faqs.slice(startIndex, endIndex);

    return NextResponse.json({
      faqs: paginatedFaqs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('[FAQs API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}