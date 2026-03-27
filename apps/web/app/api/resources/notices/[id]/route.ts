import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// 항상 최신 카테고리 반환 (캐시 비활성화)
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
 * 개별 공지사항 조회 API
 * GET /api/resources/notices/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('[Notice Detail API] 시작 - ID:', id);

    const docRef = db.collection('notices').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log('[Notice Detail API] 문서를 찾을 수 없음:', id);
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }

    const data = doc.data()!;
    console.log('[Notice Detail API] 문서 데이터:', {
      id: doc.id,
      hasTitle: !!data.title,
      hasContent: !!data.content,
      published: data.published,
      createdBy: data.createdBy
    });

    // 공개되지 않은 공지사항은 404 처리
    if (!data.published) {
      console.log('[Notice Detail API] 공개되지 않은 공지사항:', id);
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }

    // 관리자 이름 조회
    let authorName: string | undefined;
    if (data.createdBy) {
      authorName = await getAdminName(data.createdBy);
    }

    // 조회수 증가
    try {
      await docRef.update({
        views: (data.views || 0) + 1
      });
      console.log('[Notice Detail API] 조회수 증가 완료');
    } catch (viewError) {
      console.error('[Notice Detail API] 조회수 증가 실패:', viewError);
      // 조회수 증가 실패는 무시하고 계속 진행
    }

    const notice = {
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

    console.log('[Notice Detail API] 최종 결과:', {
      id: notice.id,
      hasTitle: !!(notice as any).title,
      hasContent: !!(notice as any).content,
      authorName: notice.authorName
    });

    return NextResponse.json({ notice });
  } catch (error) {
    console.error('[Notice Detail API] 에러 발생:', error);
    console.error('[Notice Detail API] 에러 스택:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to fetch notice',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}