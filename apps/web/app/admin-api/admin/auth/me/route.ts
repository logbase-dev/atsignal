import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminById } from '@/lib/admin/adminService.server';

/**
 * GET /admin-api/admin/auth/me
 * Next.js Route Handler에서 쿠키 기반 인증 확인을 처리한다.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('admin-auth')?.value;

    if (!authToken) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    const decoded = Buffer.from(authToken, 'base64').toString('utf-8');
    const [adminId] = decoded.split(':');
    if (!adminId) {
      return NextResponse.json({ error: '유효하지 않은 인증 토큰입니다.' }, { status: 401 });
    }

    const admin = await getAdminById(adminId);
    if (!admin) {
      return NextResponse.json({ error: '관리자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeAdmin } = admin as any;
    return NextResponse.json({ admin: safeAdmin });
  } catch (error: any) {
    console.error('[GET /admin-api/admin/auth/me] 에러:', error?.message);
    return NextResponse.json({ error: '관리자 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}


