import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminByUsername, updateLastLoginAt } from '@/lib/admin/adminService';
import { comparePassword } from '@/lib/utils/password';
import { createLoginLog } from '@/lib/admin/adminLoginLogService';

/**
 * POST /api/login
 * 관리자 로그인 (Firestore 기반)
 */
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '사용자명과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // IP 주소 및 User-Agent 추출
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      // Firestore에서 관리자 조회
      const admin = await getAdminByUsername(username);

      if (!admin) {
        // 관리자가 없음 - 실패 기록 생성 (adminId 없이)
        await createLoginLog({
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: '존재하지 않는 아이디',
        });

        return NextResponse.json(
          { error: '사용자명 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }

      // 비활성화된 관리자 체크
      if (!admin.enabled) {
        await createLoginLog({
          adminId: admin.id!,
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: '비활성화된 계정',
        });

        return NextResponse.json(
          { error: '비활성화된 계정입니다.' },
          { status: 403 }
        );
      }

      // 비밀번호 검증
      const isPasswordValid = await comparePassword(password, admin.password);

      if (!isPasswordValid) {
        // 비밀번호 불일치 - 실패 기록 생성
        await createLoginLog({
          adminId: admin.id!,
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: '비밀번호 오류',
        });

        return NextResponse.json(
          { error: '사용자명 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 }
        );
      }

      // 로그인 성공
      // 마지막 로그인 시간 업데이트
      await updateLastLoginAt(admin.id!);

      // 접속 기록 생성
      await createLoginLog({
        adminId: admin.id!,
        username,
        ipAddress,
        userAgent,
        success: true,
      });

      // 쿠키 설정 (기존 방식 유지: adminId를 base64로 인코딩)
      const cookieStore = await cookies();
      const token = Buffer.from(`${admin.id}:${admin.username}`).toString('base64');
      
      cookieStore.set('admin-auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/',
      });

      return NextResponse.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
        },
      });
    } catch (error: any) {
      console.error('[POST /api/login] 인증 처리 중 에러:', error.message);
      
      // 에러 발생 시에도 실패 기록 생성 시도
      try {
        await createLoginLog({
          username,
          ipAddress,
          userAgent,
          success: false,
          failureReason: `시스템 오류: ${error.message}`,
        });
      } catch (logError) {
        console.error('[POST /api/login] 접속 기록 생성 실패:', logError);
      }

      return NextResponse.json(
        { error: '로그인 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[POST /api/login] 요청 처리 중 에러:', error.message);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

