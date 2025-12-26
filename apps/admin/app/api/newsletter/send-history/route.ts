import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getEmailHistory, getEmailHistoryCount, getEmailStatistics } from '@/lib/stiee/client';
import { StibeeApiError } from '@/lib/stiee/types';

/**
 * GET /api/newsletter/send-history
 * Stibee에서 발송 이력을 가져옵니다.
 * Query Parameters:
 *   - offset: 조회 시작 위치 (기본값: 0)
 *   - limit: 한 번에 가져올 최대 개수 (기본값: 20)
 *   - count: true일 경우 발송 이력 수만 반환
 *   - statistics: true일 경우 각 이메일의 통계 정보도 포함
 */
export async function GET(request: Request) {
    try {
      // 인증 확인
      const cookieStore = await cookies();
      const authToken = cookieStore.get('admin-auth')?.value; // ✅ 수정: 'token' -> 'admin-auth'
  

    if (!authToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // count만 요청하는 경우
    if (searchParams.get('count') === 'true') {
      const totalCount = await getEmailHistoryCount();
      return NextResponse.json({ totalCount });
    }

    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const includeStatistics = searchParams.get('statistics') === 'true';

    // 발송 이력 목록 가져오기
    const emails = await getEmailHistory(offset, limit);

    // 통계 정보 포함 요청인 경우
    if (includeStatistics && emails.length > 0) {
      // 각 이메일의 통계를 병렬로 조회
      const statisticsPromises = emails.map((email) => 
        getEmailStatistics(email.id).catch(() => null)
      );
      
      const statisticsResults = await Promise.all(statisticsPromises);
      
      // 통계 정보를 이메일 데이터에 병합
      const emailsWithStats = emails.map((email, index) => {
        const stats = statisticsResults[index];
        return {
          ...email,
          openRate: stats?.openRate,
          clickRate: stats?.clickRate,
        };
      });

      return NextResponse.json({ 
        emails: emailsWithStats,
        offset,
        limit,
        hasMore: emails.length === limit,
      });
    }

    return NextResponse.json({ 
      emails,
      offset,
      limit,
      hasMore: emails.length === limit,
    });
} catch (error: any) {
    console.error('[GET /api/newsletter/send-history] 에러:', error.message);
    
    if (error instanceof StibeeApiError) {
      // ✅ 프로 요금제 에러 체크
      let errorDetail: any = null;
      try {
        errorDetail = error.body ? JSON.parse(error.body) : null;
      } catch {
        errorDetail = null;
      }

      // ✅ 프로 요금제가 필요한 경우 특별 처리
      if (
        error.status === 400 &&
        (errorDetail?.code === 'Errors.Service.UnsupportedAPI' ||
         errorDetail?.message?.includes('프로 요금제') ||
         errorDetail?.values?.message?.includes('프로 요금제'))
      ) {
        return NextResponse.json(
          { 
            error: 'PREMIUM_REQUIRED',
            message: '이메일 발송 이력 조회는 Stibee 프로 요금제 이상에서만 사용 가능합니다.',
            details: errorDetail?.values?.message || errorDetail?.message || error.body,
          },
          { status: 402 } // Payment Required
        );
      }

      return NextResponse.json(
        { error: 'Stibee API 호출에 실패했습니다.', details: error.body },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: error.message || '발송 이력을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}