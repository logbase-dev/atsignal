import { NextResponse } from 'next/server';
import { getAdminById, updateAdmin, deleteAdmin } from '@/lib/admin/adminService';
import type { UpdateAdminData } from '@/lib/admin/adminService';

/**
 * GET /api/admins/[id]
 * 관리자 단일 조회
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getAdminById(id);

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
    console.error('[GET /api/admins/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: '관리자 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admins/[id]
 * 관리자 정보 수정
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateAdminData = await request.json();

    // 관리자 존재 여부 확인
    const existingAdmin = await getAdminById(id);
    if (!existingAdmin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 비밀번호가 제공된 경우 길이 검사
    if (body.password && body.password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    await updateAdmin(id, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[PUT /api/admins/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: '관리자 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admins/[id]
 * 관리자 비활성화 (물리적 삭제 아님)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 관리자 존재 여부 확인
    const existingAdmin = await getAdminById(id);
    if (!existingAdmin) {
      return NextResponse.json(
        { error: '관리자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    await deleteAdmin(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admins/[id]] 에러:', error.message);
    return NextResponse.json(
      { error: '관리자 비활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

