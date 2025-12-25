import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/admin/logout
 * 관리자 로그아웃
 * 개발 서버: Next.js API Route 직접 사용
 */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('admin-auth');
  
  return NextResponse.json({ success: true });
}

