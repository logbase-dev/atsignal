import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminById } from '@/lib/admin/adminService.server';

/**
 * GET /api/admin/auth/me
 * 현재 로그인한 관리자 정보 조회
 * 개발 서버: Next.js API Route 직접 사용
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('admin-auth')?.value;

    console.log('[GET /api/admin/auth/me] 쿠키 확인:', {
      hasToken: !!authToken,
      tokenLength: authToken?.length || 0,
      allCookies: cookieStore.getAll().map(c => c.name),
    });

    if (!authToken) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      );
    }

    try {
      // 토큰 디코딩 (format: adminId:username)
      const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
      const [adminId] = decoded.split(':');

      if (!adminId) {
        return NextResponse.json(
          { error: '유효하지 않은 인증 토큰입니다.' },
          { status: 401 }
        );
      }

      // 관리자 정보 조회
      console.log('[GET /api/admin/auth/me] Firestore 조회 시작, adminId:', adminId);
      const admin = await getAdminById(adminId);
      console.log('[GET /api/admin/auth/me] Firestore 조회 완료:', {
        found: !!admin,
        adminId: admin?.id,
      });

      if (!admin) {
        return NextResponse.json(
          { error: '관리자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 비밀번호 필드 제거 (보안)
      const { password, ...safeAdmin } = admin;

      return NextResponse.json({ admin: safeAdmin });
    } catch (error: any) {
      console.error('[GET /api/admin/auth/me] 토큰 디코딩 에러:', error.message);
      console.error('[GET /api/admin/auth/me] 에러 스택:', error.stack);
      return NextResponse.json(
        { error: '인증 토큰 처리 중 오류가 발생했습니다.' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('[GET /api/admin/auth/me] 에러:', error.message);
    console.error('[GET /api/admin/auth/me] 에러 스택:', error.stack);
    return NextResponse.json(
      { error: '관리자 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

