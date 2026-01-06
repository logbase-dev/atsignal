import { Request, Response } from "express";
import { createDemoRequest, getDemoRequests } from "../../lib/admin/demoRequestService";
import { getRequestAdminId } from "../_shared/requestAuth";

/**
 * GET /api/admin/demo-requests
 * POST /api/admin/demo-requests
 */
export async function handle(request: Request, response: Response) {
  console.log("[Demo Requests API] handle 함수 호출됨, method:", request.method);
  try {
    if (request.method === "GET") {
      const page = request.query.page ? parseInt(String(request.query.page), 10) : 1;
      const limit = request.query.limit ? parseInt(String(request.query.limit), 10) : 20;
      const status = request.query.status && ['pending', 'contacted', 'completed', 'cancelled'].includes(String(request.query.status))
        ? String(request.query.status) as 'pending' | 'contacted' | 'completed' | 'cancelled'
        : undefined;
      const search = request.query.search && String(request.query.search).trim() 
        ? String(request.query.search).trim() 
        : undefined;

      console.log("[Demo Requests API] 검색 파라미터:", { page, limit, status, search });

      const result = await getDemoRequests({ page, limit, status, search });
      response.json(result);
      return;
    }

    if (request.method === "POST") {
      const adminId = getRequestAdminId(request);
      const body = (request.body || {}) as any;

      // 필수 필드 검증
      if (!body.name || !body.company || !body.email || !body.phone || !body.inquiry) {
        response.status(400).json({ 
          error: "name, company, email, phone, inquiry는 필수입니다." 
        });
        return;
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        response.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
        return;
      }

      const id = await createDemoRequest({
        name: String(body.name).trim(),
        company: String(body.company).trim(),
        email: String(body.email).trim().toLowerCase(),
        phone: String(body.phone).trim(),
        inquiry: String(body.inquiry).trim(),
        status: 'pending',
        notes: body.notes ? String(body.notes).trim() : undefined,
        createdBy: adminId,
        updatedBy: adminId,
      });

      response.json({ success: true, id });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /demo-requests] 에러:", error);
    response.status(500).json({ error: "데모신청 요청 처리 중 오류가 발생했습니다." });
  }
}