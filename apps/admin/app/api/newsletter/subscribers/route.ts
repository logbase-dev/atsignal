import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSubscribers, getSubscriberCount } from '@/lib/stiee/client';
import { StibeeApiError } from '@/lib/stiee/types';

/**
 * GET /api/newsletter/subscribers
 * Stibee에서 구독자 목록을 가져옵니다.
 * Query Parameters:
 *   - offset: 조회 시작 위치 (기본값: 0)
 *   - limit: 한 번에 가져올 최대 개수 (기본값: 20)
 *   - count: true일 경우 구독자 수만 반환
 */
export async function GET(request: Request) {
  try {
    // 인증 확인
    const cookieStore = await cookies();
    const authToken = cookieStore.get('admin-auth')?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    
    // count만 요청하는 경우
    if (searchParams.get('count') === 'true') {
      const totalCount = await getSubscriberCount();
      return NextResponse.json({ totalCount });
    }

    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 공통 모듈을 사용하여 구독자 목록 가져오기
    const subscribers = await getSubscribers(offset, limit);

    return NextResponse.json({ 
      subscribers,
      offset,
      limit,
      hasMore: subscribers.length === limit, // limit만큼 가져왔으면 더 있을 가능성
    });
  } catch (error: any) {
    console.error('[GET /api/newsletter/subscribers] 에러:', error.message);
    
    if (error instanceof StibeeApiError) {
      return NextResponse.json(
        { error: 'Stibee API 호출에 실패했습니다.', details: error.body },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: error.message || '구독자 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}