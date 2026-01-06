import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /admin-api/admin/logout
 * 로그인과 동일하게 Next.js Route Handler에서 직접 쿠키를 제거한다.
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('admin-auth');
  return NextResponse.json({ success: true });
}


