"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const salesInquiryService_1 = require("../../lib/admin/salesInquiryService");
const requestAuth_1 = require("../_shared/requestAuth");
/**
 * GET /api/admin/sales-inquiries
 * POST /api/admin/sales-inquiries
 */
async function handle(request, response) {
    console.log("[Sales Inquiries API] handle 함수 호출됨, method:", request.method);
    try {
        if (request.method === "GET") {
            const page = request.query.page ? parseInt(String(request.query.page), 10) : 1;
            const limit = request.query.limit ? parseInt(String(request.query.limit), 10) : 20;
            const status = request.query.status && ['pending', 'contacted', 'completed', 'cancelled'].includes(String(request.query.status))
                ? String(request.query.status)
                : undefined;
            const search = request.query.search && String(request.query.search).trim()
                ? String(request.query.search).trim()
                : undefined;
            console.log("[Sales Inquiries API] 검색 파라미터:", { page, limit, status, search });
            const result = await (0, salesInquiryService_1.getSalesInquiries)({ page, limit, status, search });
            response.json(result);
            return;
        }
        if (request.method === "POST") {
            const adminId = (0, requestAuth_1.getRequestAdminId)(request);
            const body = (request.body || {});
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
            const id = await (0, salesInquiryService_1.createSalesInquiry)({
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
    }
    catch (error) {
        console.error("[Admin API /sales-inquiries] 에러:", error);
        response.status(500).json({ error: "구입문의 요청 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=index.js.map