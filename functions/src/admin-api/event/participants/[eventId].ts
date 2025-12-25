import { Request, Response } from "express";
import { getEventParticipants, createEventParticipant } from "../../../lib/admin/eventParticipantService";

/**
 * GET /api/admin/event/:eventId/participants
 * POST /api/admin/event/:eventId/participants
 */
export async function handle(request: Request, response: Response, eventId: string) {
  try {
    if (request.method === "GET") {
      const page = request.query.page ? parseInt(String(request.query.page), 10) : 1;
      const limit = request.query.limit ? parseInt(String(request.query.limit), 10) : 20;
      const search = request.query.search && String(request.query.search).trim() 
        ? String(request.query.search).trim() 
        : undefined;

      console.log("[Event Participant API] 검색 파라미터:", { eventId, page, limit, search });

      const result = await getEventParticipants({ eventId, page, limit, search });
      response.json(result);
      return;
    }

    if (request.method === "POST") {
      const body = (request.body || {}) as any;
      const { name, company, email, phone, privacyConsent } = body;

      // 필수 필드 검증
      if (!name || !company || !email || !phone || privacyConsent === undefined) {
        response.status(400).json({ error: "name, company, email, phone, privacyConsent는 필수입니다." });
        return;
      }

      // 이메일 형식 검증 (간단한 검증)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        response.status(400).json({ error: "올바른 이메일 형식이 아닙니다." });
        return;
      }

      // 전화번호 형식 검증 (010-1234-5678 형식)
      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (!phoneRegex.test(phone)) {
        response.status(400).json({ error: "전화번호는 010-1234-5678 형식이어야 합니다." });
        return;
      }

      // 개인정보 동의 검증
      if (!privacyConsent) {
        response.status(400).json({ error: "개인정보 처리방침에 동의해야 합니다." });
        return;
      }

      try {
        const id = await createEventParticipant({
          eventId,
          name: String(name).trim(),
          company: String(company).trim(),
          email: String(email).trim().toLowerCase(),
          phone: String(phone).trim(),
          privacyConsent: Boolean(privacyConsent),
        });
        response.json({ success: true, id });
        return;
      } catch (error: any) {
        // 이메일 중복 체크 에러
        if (error.message && error.message.includes("이미 신청한 이메일")) {
          response.status(409).json({ error: error.message });
          return;
        }
        throw error;
      }
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /event/:eventId/participants] 에러:", error);
    response.status(500).json({ error: "이벤트 참가자 요청 처리 중 오류가 발생했습니다." });
  }
}

