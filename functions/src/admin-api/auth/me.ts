import { Request, Response } from "express";
import { getAdminById } from "../../lib/admin/adminService";
import { requireAdmin } from "../../lib/admin/adminAuth";

/**
 * GET /api/auth/me
 * 현재 로그인한 관리자 정보 조회
 */
export async function handle(request: Request, response: Response): Promise<void> {
  if (request.method !== "GET") {
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  try {
    const auth = await requireAdmin(request);
    if (!auth) {
      response.status(401).json({ error: "인증되지 않았습니다." });
      return;
    }

    const adminId = auth.adminId;
    const admin = await getAdminById(adminId);
    if (!admin) {
      response.status(404).json({ error: "관리자를 찾을 수 없습니다." });
      return;
    }

    const { password, ...safeAdmin } = admin;
    response.json({ admin: safeAdmin });
  } catch (error: any) {
    console.error("[GET /api/auth/me] 에러:", error.message);
    response.status(500).json({ error: "관리자 정보를 불러오는 중 오류가 발생했습니다." });
  }
}