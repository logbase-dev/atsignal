"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const eventParticipantService_1 = require("../../../../lib/admin/eventParticipantService");
/**
 * DELETE /api/admin/event/:eventId/participants/:participantId
 */
async function handle(request, response, eventId, participantId) {
    try {
        if (request.method === "DELETE") {
            await (0, eventParticipantService_1.deleteEventParticipant)(participantId);
            response.json({ success: true });
            return;
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /event/:eventId/participants/:participantId] 에러:", error);
        response.status(500).json({ error: "이벤트 참가자 삭제 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=%5BparticipantId%5D.js.map