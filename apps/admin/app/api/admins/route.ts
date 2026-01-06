import { NextResponse } from 'next/server';
import { getAdmins, createAdmin } from '@/lib/admin/adminService';
import type { CreateAdminData } from '@/lib/admin/adminService';

/**
 * GET /api/admins
 * 관리자 목록 조회 또는 아이디 중복 체크
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkUsername = searchParams.get('checkUsername');

    // 아이디 중복 체크 요청인 경우
    if (checkUsername) {
      const { checkUsernameExists } = await import('@/lib/admin/adminService');
      const exists = await checkUsernameExists(checkUsername);
      return NextResponse.json({ exists });
    }

    // 관리자 목록 조회
    const admins = await getAdmins();
    
    // 비밀번호 필드 제거 (보안)
    const safeAdmins = admins.map(({ password, ...admin }) => admin);
    
    return NextResponse.json({ admins: safeAdmins });
  } catch (error: any) {
    console.error('[GET /api/admins] 에러:', error.message);
    return NextResponse.json(
      { error: '관리자 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admins
 * 새 관리자 생성
 */
export async function POST(request: Request) {
  try {
    const body: CreateAdminData = await request.json();
    
    // 필수 필드 검증
    if (!body.username || !body.password || !body.name) {
      return NextResponse.json(
        { error: '아이디, 비밀번호, 이름은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // 아이디 유효성 검사 (대소문자 모두 허용)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(body.username)) {
      return NextResponse.json(
        { error: '아이디는 영문, 숫자, 언더스코어만 사용 가능하며 3-20자여야 합니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검사
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const adminId = await createAdmin({
      username: body.username,
      password: body.password,
      name: body.name,
      enabled: body.enabled !== undefined ? body.enabled : true,
      createdBy: body.createdBy,
    });

    return NextResponse.json({ success: true, id: adminId });
  } catch (error: any) {
    console.error('[POST /api/admins] 에러:', error.message);
    
    if (error.message.includes('이미 사용 중인 아이디')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: '관리자 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

