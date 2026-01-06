import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminByUsername, updateLastLoginAt } from '@/lib/admin/adminService.server';
import { comparePassword } from '@/lib/utils/password';
import { createLoginLog } from '@/lib/admin/adminLoginLogService';

/**
 * POST /admin-api/admin/login
 * IMPORTANT: Functions 프록시를 타면 App Hosting에서 Set-Cookie가 깨질 수 있으므로
 * 로그인만큼은 Next.js Route Handler에서 직접 쿠키를 설정한다.
 */
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '사용자명과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const admin = await getAdminByUsername(username);
    if (!admin) {
      await createLoginLog({
        username,
        ipAddress,
        userAgent,
        success: false,
        failureReason: '존재하지 않는 아이디',
      });
      return NextResponse.json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    if (!admin.enabled) {
      await createLoginLog({
        adminId: admin.id!,
        username,
        ipAddress,
        userAgent,
        success: false,
        failureReason: '비활성화된 계정',
      });
      return NextResponse.json({ error: '비활성화된 계정입니다.' }, { status: 403 });
    }

    const isPasswordValid = await comparePassword(password, admin.password);
    if (!isPasswordValid) {
      await createLoginLog({
        adminId: admin.id!,
        username,
        ipAddress,
        userAgent,
        success: false,
        failureReason: '비밀번호 오류',
      });
      return NextResponse.json({ error: '사용자명 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    await updateLastLoginAt(admin.id!);
    await createLoginLog({
      adminId: admin.id!,
      username,
      ipAddress,
      userAgent,
      success: true,
    });

    const cookieStore = await cookies();
    const token = Buffer.from(`${admin.id}:${admin.username}`).toString('base64');
    cookieStore.set('admin-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      admin: { id: admin.id, username: admin.username, name: admin.name },
    });
  } catch (error: any) {
    console.error('[POST /admin-api/admin/login] 에러:', error?.message);
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}


