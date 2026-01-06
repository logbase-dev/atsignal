"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const demoRequestService_1 = require("../../lib/admin/demoRequestService");
const requestAuth_1 = require("../_shared/requestAuth");
/**
 * GET /api/admin/demo-requests/:id
 * PUT /api/admin/demo-requests/:id
 * DELETE /api/admin/demo-requests/:id
 */
async function handle(request, response, id) {
    try {
        if (request.method === "GET") {
            const demoRequest = await (0, demoRequestService_1.getDemoRequestById)(id);
            if (!demoRequest) {
                response.status(404).json({ error: "데모신청을 찾을 수 없습니다." });
                return;
            }
            response.json({ demoRequest });
            return;
        }
        if (request.method === "PUT") {
            const adminId = (0, requestAuth_1.getRequestAdminId)(request);
            const body = (request.body || {});
            // 기존 데모신청 확인
            const existingRequest = await (0, demoRequestService_1.getDemoRequestById)(id);
            if (!existingRequest) {
                response.status(404).json({ error: "데모신청을 찾을 수 없습니다." });
                return;
            }
            const updatePayload = {
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
                if (body.status === 'contacted' && existingRequest.status !== 'contacted') {
                    updatePayload.contactedAt = new Date();
                }
            }
            if (body.notes !== undefined) {
                updatePayload.notes = body.notes ? String(body.notes).trim() : undefined;
            }
            console.log(`[PUT /demo-requests/:id] updatePayload:`, JSON.stringify(updatePayload, null, 2));
            await (0, demoRequestService_1.updateDemoRequest)(id, updatePayload);
            response.json({ success: true });
            return;
        }
        if (request.method === "DELETE") {
            await (0, demoRequestService_1.deleteDemoRequest)(id);
            response.json({ success: true });
            return;
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /demo-requests/:id] 에러:", error);
        response.status(500).json({ error: "데모신청 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=%5Bid%5D.js.map