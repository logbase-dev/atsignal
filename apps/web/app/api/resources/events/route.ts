import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * 공개 이벤트 목록 API
 * GET /api/resources/events
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    
    console.log('[Events API] Using Firebase Admin SDK with options:', { page, limit, search });

    // Firebase Admin SDK로 직접 조회
    let query = db.collection('events')
      .where('published', '==', true)
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    let events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        publishedAt: data.publishedAt?.toDate(),
        eventStartAt: data.eventStartAt?.toDate(),
        eventEndAt: data.eventEndAt?.toDate(),
        displayStartAt: data.displayStartAt?.toDate(),
        displayEndAt: data.displayEndAt?.toDate(),
      };
    });

    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      events = events.filter((event: any) => 
        event.title?.ko?.toLowerCase().includes(searchLower) ||
        event.title?.en?.toLowerCase().includes(searchLower) ||
        event.content?.ko?.toLowerCase().includes(searchLower) ||
        event.content?.en?.toLowerCase().includes(searchLower) ||
        event.oneLiner?.ko?.toLowerCase().includes(searchLower) ||
        event.oneLiner?.en?.toLowerCase().includes(searchLower) ||
        event.description?.ko?.toLowerCase().includes(searchLower) ||
        event.description?.en?.toLowerCase().includes(searchLower)
      );
    }

    // 정렬: 메인 이벤트 > 서브 이벤트 > 일반 이벤트
    events.sort((a: any, b: any) => {
      // 메인 이벤트가 최우선
      if (a.isMainEvent && !b.isMainEvent) return -1;
      if (!a.isMainEvent && b.isMainEvent) return 1;
      
      // 서브 이벤트는 order 순서대로
      if (a.subEventOrder && b.subEventOrder) {
        return a.subEventOrder - b.subEventOrder;
      }
      if (a.subEventOrder && !b.subEventOrder) return -1;
      if (!a.subEventOrder && b.subEventOrder) return 1;
      
      // 나머지는 생성일 역순
      const aDate = a.createdAt?.getTime() || 0;
      const bDate = b.createdAt?.getTime() || 0;
      return bDate - aDate;
    });

    const total = events.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return NextResponse.json({
      events: paginatedEvents,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('[Events API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}