import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

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
    
    console.log('[FAQs API] Using Firebase Admin SDK with options:', { 
      page, limit, search, categoryId, enabledKo, enabledEn 
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