"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const noticeService_1 = require("../../lib/admin/noticeService");
const requestAuth_1 = require("../_shared/requestAuth");
/**
 * GET /api/admin/notice
 * POST /api/admin/notice
 */
async function handle(request, response) {
    try {
        if (request.method === "GET") {
            const page = request.query.page ? parseInt(String(request.query.page), 10) : 1;
            const limit = request.query.limit ? parseInt(String(request.query.limit), 10) : 20;
            const published = request.query.published !== undefined && request.query.published !== ""
                ? (request.query.published === "true" || request.query.published === "1")
                : undefined;
            const showInBanner = request.query.showInBanner !== undefined && request.query.showInBanner !== ""
                ? (request.query.showInBanner === "true" || request.query.showInBanner === "1")
                : undefined;
            const search = request.query.search && String(request.query.search).trim()
                ? String(request.query.search).trim()
                : undefined;
            console.log("[Notice API] 검색 파라미터:", { page, limit, published, showInBanner, search });
            const result = await (0, noticeService_1.getNotices)({ page, limit, published, showInBanner, search });
            response.json(result);
            return;
        }
        if (request.method === "POST") {
            const adminId = (0, requestAuth_1.getRequestAdminId)(request);
            const body = (request.body || {});
            const title = body.title;
            const oneLiner = body.oneLiner;
            const content = body.content;
            const published = body.published !== undefined ? Boolean(body.published) : undefined;
            const normalizeLocalized = (v) => {
                if (!v)
                    return { ko: "" };
                if (typeof v === "string")
                    return { ko: v };
                if (typeof v === "object")
                    return { ko: String(v.ko || ""), ...(v.en ? { en: String(v.en) } : {}) };
                return { ko: String(v) };
            };
            const normTitle = normalizeLocalized(title);
            const normOneLiner = normalizeLocalized(oneLiner);
            const normContent = normalizeLocalized(content);
            if (!normTitle.ko || !normOneLiner.ko || !normContent.ko || published === undefined) {
                response.status(400).json({ error: "title.ko, oneLiner.ko, content.ko, published는 필수입니다." });
                return;
            }
            // 한 줄 문구 50글자 제한 검증
            if (normOneLiner.ko.length > 50) {
                response.status(400).json({ error: "한 줄 문구(oneLiner.ko)는 50글자를 초과할 수 없습니다." });
                return;
            }
            const id = await (0, noticeService_1.createNotice)({
                title: normTitle,
                oneLiner: normOneLiner,
                content: normContent,
                showInBanner: body.showInBanner !== undefined ? Boolean(body.showInBanner) : false,
                bannerPriority: typeof body.bannerPriority === "number" ? body.bannerPriority : 999,
                displayStartAt: body.displayStartAt ? new Date(body.displayStartAt) : undefined,
                displayEndAt: body.displayEndAt ? new Date(body.displayEndAt) : undefined,
                editorType: body.editorType === "toast" || body.editorType === "nextra" ? body.editorType : undefined,
                saveFormat: body.saveFormat === "markdown" || body.saveFormat === "html" ? body.saveFormat : undefined,
                enabled: body.enabled && typeof body.enabled === "object"
                    ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? false) }
                    : { ko: true, en: false },
                isTop: body.isTop !== undefined ? Boolean(body.isTop) : false,
                published,
                createdBy: adminId,
                updatedBy: adminId,
            });
            console.log(`[POST /notice] isTop 값:`, body.isTop, `->`, body.isTop !== undefined ? Boolean(body.isTop) : false);
            response.json({ success: true, id });
            return;
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /notice] 에러:", error);
        response.status(500).json({ error: "공지사항 요청 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=index.js.map