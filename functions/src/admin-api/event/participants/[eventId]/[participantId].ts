import { Request, Response } from "express";
import { deleteEventParticipant } from "../../../../lib/admin/eventParticipantService";

/**
 * DELETE /api/admin/event/:eventId/participants/:participantId
 */
export async function handle(request: Request, response: Response, eventId: string, participantId: string) {
  try {
    if (request.method === "DELETE") {
      await deleteEventParticipant(participantId);
      response.json({ success: true });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /event/:eventId/participants/:participantId] 에러:", error);
    response.status(500).json({ error: "이벤트 참가자 삭제 중 오류가 발생했습니다." });
  }
}

