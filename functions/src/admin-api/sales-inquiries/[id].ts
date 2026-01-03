import { Request, Response } from "express";
import { deleteSalesInquiry, getSalesInquiryById, updateSalesInquiry } from "../../lib/admin/salesInquiryService";
import { getRequestAdminId } from "../_shared/requestAuth";

/**
 * GET /api/admin/sales-inquiries/:id
 * PUT /api/admin/sales-inquiries/:id
 * DELETE /api/admin/sales-inquiries/:id
 */
export async function handle(request: Request, response: Response, id: string) {
  try {
    if (request.method === "GET") {
      const salesInquiry = await getSalesInquiryById(id);
      if (!salesInquiry) {
        response.status(404).json({ error: "구입문의를 찾을 수 없습니다." });
        return;
      }
      response.json({ salesInquiry });
      return;
    }

    if (request.method === "PUT") {
      const adminId = getRequestAdminId(request);
      const body = (request.body || {}) as any;

      // 기존 구입문의 확인
      const existingInquiry = await getSalesInquiryById(id);
      if (!existingInquiry) {
        response.status(404).json({ error: "구입문의를 찾을 수 없습니다." });
        return;
      }

      const updatePayload: any = {
        updatedBy: adminId,
      };

      // 선택적 필드 업데이트
      if (body.name !== undefined) {
        updatePayload.name = String(body.name).trim();
      }
      if (body.company !== undefined) {
        updatePayload.company = String(body.company).trim();
      }
      if (body.email !== undefined) {
        const email = String(body.email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          response.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
          return;
        }
        updatePayload.email = email;
      }
      if (body.phone !== undefined) {
        updatePayload.phone = String(body.phone).trim();
      }
      if (body.inquiry !== undefined) {
        updatePayload.inquiry = String(body.inquiry).trim();
      }
      if (body.status !== undefined) {
        if (!['pending', 'contacted', 'completed', 'cancelled'].includes(body.status)) {
          response.status(400).json({ 
            error: "status는 pending, contacted, completed, cancelled 중 하나여야 합니다." 
          });
          return;
        }
        updatePayload.status = body.status;
        
        // 상태가 contacted로 변경되면 contactedAt 설정
        if (body.status === 'contacted' && existingInquiry.status !== 'contacted') {
          updatePayload.contactedAt = new Date();
        }
      }
      if (body.notes !== undefined) {
        updatePayload.notes = body.notes ? String(body.notes).trim() : undefined;
      }

      console.log(`[PUT /sales-inquiries/:id] updatePayload:`, JSON.stringify(updatePayload, null, 2));

      await updateSalesInquiry(id, updatePayload);
      response.json({ success: true });
      return;
    }

    if (request.method === "DELETE") {
      await deleteSalesInquiry(id);
      response.json({ success: true });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /sales-inquiries/:id] 에러:", error);
    response.status(500).json({ error: "구입문의 처리 중 오류가 발생했습니다." });
  }
}