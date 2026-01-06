import { NextResponse } from 'next/server';
import { getAdminById } from '@/lib/admin/adminService';
import { getLoginLogsByAdminId } from '@/lib/admin/adminLoginLogService';
import type { LoginLogFilters } from '@/lib/admin/adminLoginLogService';

/**
 * GET /api/admins/[id]/logs
 * 관리자 접속 기록 조회
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // 관리자 존재 여부 확인
    const admin = await getAdminById(id);
    if (!admin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 필터 파라미터 파싱
    const filters: LoginLogFilters = {};

    // 성공/실패 필터
    const successParam = searchParams.get('success');
    if (successParam !== null) {
      filters.success = successParam === 'true';
    }

    // 날짜 필터
    const startDateParam = searchParams.get('startDate');
    if (startDateParam) {
      filters.startDate = new Date(startDateParam);
    }

    const endDateParam = searchParams.get('endDate');
    if (endDateParam) {
      filters.endDate = new Date(endDateParam);
    }

    // 페이지네이션
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      filters.limit = parseInt(limitParam, 10);
    }

    const result = await getLoginLogsByAdminId(id, filters);

    return NextResponse.json({
      logs: result.logs,
      hasMore: result.hasMore,
    });
  } catch (error: any) {
    console.error('[GET /api/admins/[id]/logs] 에러:', error);
    console.error('[GET /api/admins/[id]/logs] 에러 메시지:', error.message);
    console.error('[GET /api/admins/[id]/logs] 에러 스택:', error.stack);
    
    // Firestore 인덱스 에러인 경우 특별 처리
    if (error.message && error.message.includes('index')) {
      return NextResponse.json(
        { 
          error: 'Firestore 인덱스가 필요합니다. 에러 메시지의 링크를 클릭하여 인덱스를 생성해주세요.',
          details: error.message,
          requiresIndex: true
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: '접속 기록을 불러오는 중 오류가 발생했습니다.',
        details: error.message || '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

