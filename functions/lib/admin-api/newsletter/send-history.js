"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const client_1 = require("../../lib/stiee/client");
const types_1 = require("../../lib/stiee/types");
// 쿠키 파싱 헬퍼
function getAuthToken(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader)
        return undefined;
    const map = Object.fromEntries(cookieHeader.split(";").map((c) => {
        const [k, ...rest] = c.trim().split("=");
        return [k, rest.join("=")];
    }));
    return map["admin-auth"];
}
async function handle(request, response) {
    if (request.method !== "GET") {
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
        return;
    }
    try {
        // ✅ 에뮬레이터에서는 개발 모드로 처리 (쿠키 검증 생략)
        const isProduction = process.env.GCLOUD_PROJECT &&
            !process.env.FUNCTIONS_EMULATOR;
        // 개발 모드가 아니면 인증 확인
        if (isProduction) {
            const authToken = getAuthToken(request);
            if (!authToken) {
                response.status(401).json({ error: "인증이 필요합니다." });
                return;
            }
        }
        const { searchParams } = new URL(request.url, "http://localhost");
        // count만 요청
        if (searchParams.get("count") === "true") {
            const totalCount = await (0, client_1.getEmailHistoryCount)();
            response.json({ totalCount });
            return;
        }
        const offset = parseInt(searchParams.get("offset") || "0", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const includeStatistics = searchParams.get("statistics") === "true";
        // 발송 이력 목록
        const emails = await (0, client_1.getEmailHistory)(offset, limit);
        if (includeStatistics && emails.length > 0) {
            const statisticsPromises = emails.map((email) => (0, client_1.getEmailStatistics)(email.id).catch(() => null));
            const statisticsResults = await Promise.all(statisticsPromises);
            const emailsWithStats = emails.map((email, index) => {
                const stats = statisticsResults[index];
                return {
                    ...email,
                    openRate: stats?.openRate,
                    clickRate: stats?.clickRate,
                };
            });
            response.json({
                emails: emailsWithStats,
                offset,
                limit,
                hasMore: emails.length === limit,
            });
            return;
        }
        response.json({
            emails,
            offset,
            limit,
            hasMore: emails.length === limit,
        });
    }
    catch (error) {
        console.error("[GET /api/newsletter/send-history] 에러:", error.message);
        if (error instanceof types_1.StibeeApiError) {
            let errorDetail = null;
            try {
                errorDetail = error.body ? JSON.parse(error.body) : null;
            }
            catch {
                errorDetail = null;
            }
            // 프로 요금제 필요
            if (error.status === 400 &&
                (errorDetail?.code === "Errors.Service.UnsupportedAPI" ||
                    errorDetail?.message?.includes("프로 요금제") ||
                    errorDetail?.values?.message?.includes("프로 요금제"))) {
                response.status(402).json({
                    error: "PREMIUM_REQUIRED",
                    message: "어드민 페이지에서 뉴스레터 발송이력은 Stibee Standard에서는 제공하지 않으며, Pro이상에서 API 호출이 가능합니다. 향후 Pro 전환 시 해당 기능을 활용할 수 있습니다.",
                    details: errorDetail?.values?.message || errorDetail?.message || error.body,
                });
                return;
            }
            response.status(error.status).json({
                error: "Stibee API 호출에 실패했습니다.",
                details: error.body,
            });
            return;
        }
        response.status(500).json({
            error: error.message || "발송 이력을 불러오는 중 오류가 발생했습니다.",
        });
    }
}
//# sourceMappingURL=send-history.js.map