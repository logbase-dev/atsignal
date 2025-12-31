import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * 공개 주요용어 목록 API
 * GET /api/resources/glossaries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const initialLetter = searchParams.get('initialLetter');
    const enabledKo = searchParams.get('enabledKo');
    const enabledEn = searchParams.get('enabledEn');
    
    console.log('[Glossaries API] Using Firebase Admin SDK with options:', { 
      page, limit, search, categoryId, initialLetter, enabledKo, enabledEn 
    });

    // Firebase Admin SDK로 직접 조회
    let query = db.collection('glossaries').orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let glossaries = snapshot.docs.map(doc => {
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
      glossaries = glossaries.filter((glossary: any) => glossary.categoryId === categoryId);
    }

    if (enabledKo === 'true') {
      glossaries = glossaries.filter((glossary: any) => glossary.enabled?.ko === true);
    }

    if (enabledEn === 'true') {
      glossaries = glossaries.filter((glossary: any) => glossary.enabled?.en === true);
    }

    if (initialLetter) {
      glossaries = glossaries.filter((glossary: any) => {
        const term = glossary.term?.ko || glossary.term?.en || '';
        return term.toLowerCase().startsWith(initialLetter.toLowerCase());
      });
    }

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      glossaries = glossaries.filter((glossary: any) => 
        glossary.term?.ko?.toLowerCase().includes(searchLower) ||
        glossary.term?.en?.toLowerCase().includes(searchLower) ||
        glossary.description?.ko?.toLowerCase().includes(searchLower) ||
        glossary.description?.en?.toLowerCase().includes(searchLower)
      );
    }

    const total = glossaries.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedGlossaries = glossaries.slice(startIndex, endIndex);

    return NextResponse.json({
      glossaries: paginatedGlossaries,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('[Glossaries API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}