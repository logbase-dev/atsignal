import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * 관리자 정보 조회 (캐시)
 */
const adminCache = new Map<string, { name: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

async function getAdminName(adminId: string): Promise<string | undefined> {
  // 캐시 확인
  const cached = adminCache.get(adminId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.name;
  }

  try {
    const adminDoc = await db.collection('admins').doc(adminId).get();
    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      const name = adminData?.name;
      if (name) {
        adminCache.set(adminId, { name, timestamp: Date.now() });
        return name;
      }
    }
  } catch (error) {
    console.error(`[getAdminName] 관리자 정보 조회 실패 (ID: ${adminId}):`, error);
  }
  
  return undefined;
}

/**
 * 공개 공지사항 목록 API
 * GET /api/resources/notices
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Notices API] 시작 - Firebase Admin SDK 사용');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const published = searchParams.get('published');
    const showInBanner = searchParams.get('showInBanner');
    const search = searchParams.get('search');

    console.log('[Notices API] 파라미터:', { page, limit, published, showInBanner, search });

    let query = db.collection('notices')
      .where('published', '==', true) // 공개된 공지사항만 조회
      .orderBy('createdAt', 'desc');

    // published 필터 (이미 기본적으로 published=true로 필터링됨)
    if (published !== null && published !== 'true') {
      // published=false를 명시적으로 요청한 경우에만 다른 처리
      console.log('[Notices API] published=false 요청은 무시됨 (공개 API)');
    }

    // showInBanner 필터
    if (showInBanner !== null) {
      const shouldShowInBanner = showInBanner === 'true';
      query = query.where('showInBanner', '==', shouldShowInBanner);
      console.log('[Notices API] showInBanner 필터 적용:', shouldShowInBanner);
    }

    console.log('[Notices API] Firestore 쿼리 실행 중...');

    const snapshot = await query.get();
    
    console.log('[Notices API] 쿼리 결과:', {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.length
    });

    let notices = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      console.log('[Notices API] 문서 데이터 샘플:', {
        id: doc.id,
        hasTitle: !!data.title,
        hasContent: !!data.content,
        published: data.published,
        showInBanner: data.showInBanner,
        createdAt: data.createdAt,
        createdAtType: typeof data.createdAt,
        createdBy: data.createdBy
      });
      
      // 관리자 이름 조회
      let authorName: string | undefined;
      if (data.createdBy) {
        authorName = await getAdminName(data.createdBy);
      }
      
      return {
        id: doc.id,
        ...data,
        authorName, // 관리자 이름 추가
        // 날짜 변환
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : data.publishedAt,
        displayStartAt: data.displayStartAt?.toDate ? data.displayStartAt.toDate() : data.displayStartAt,
        displayEndAt: data.displayEndAt?.toDate ? data.displayEndAt.toDate() : data.displayEndAt,
      } as any;
    }));

    console.log('[Notices API] 매핑된 공지사항 수:', notices.length);

    // 검색어가 있으면 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      notices = notices.filter((notice: any) => {
        const titleKo = notice.title?.ko?.toLowerCase() || '';
        const titleEn = notice.title?.en?.toLowerCase() || '';
        const contentKo = notice.content?.ko?.toLowerCase() || '';
        const contentEn = notice.content?.en?.toLowerCase() || '';
        const oneLinerKo = notice.oneLiner?.ko?.toLowerCase() || '';
        const oneLinerEn = notice.oneLiner?.en?.toLowerCase() || '';
        return titleKo.includes(searchLower) ||
               titleEn.includes(searchLower) ||
               contentKo.includes(searchLower) ||
               contentEn.includes(searchLower) ||
               oneLinerKo.includes(searchLower) ||
               oneLinerEn.includes(searchLower);
      });
    }

    // isTop이 true인 항목을 상단으로 정렬
    notices.sort((a: any, b: any) => {
      // isTop이 true인 항목을 먼저 정렬
      if (a.isTop && !b.isTop) return -1;
      if (!a.isTop && b.isTop) return 1;
      
      // 둘 다 isTop이거나 둘 다 아닌 경우, 생성일 기준으로 최신순 정렬
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    const total = notices.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedNotices = notices.slice(startIndex, endIndex);

    console.log('[Notices API] 최종 결과:', {
      total,
      page,
      limit,
      totalPages,
      paginatedCount: paginatedNotices.length
    });

    return NextResponse.json({
      notices: paginatedNotices,
      total,
      page,
      limit,
      totalPages,
      // 디버그 정보 추가
      debug: {
        timestamp: new Date().toISOString(),
        queryExecuted: true,
        snapshotSize: snapshot.size,
        noticesAfterMapping: notices.length,
        paginatedCount: paginatedNotices.length,
        sampleNotice: notices[0] ? {
          id: notices[0].id,
          hasTitle: !!notices[0].title,
          hasContent: !!notices[0].content,
          published: notices[0].published,
          showInBanner: notices[0].showInBanner
        } : null
      }
    });
  } catch (error) {
    console.error('[Notices API] 에러 발생:', error);
    console.error('[Notices API] 에러 스택:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to fetch notices',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}