"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const eventService_1 = require("../../lib/admin/eventService");
const requestAuth_1 = require("../_shared/requestAuth");
/**
 * GET /api/admin/event
 * POST /api/admin/event
 */
async function handle(request, response) {
    console.log("[Event API] handle 함수 호출됨, method:", request.method);
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
            const hasCtaButton = request.query.hasCtaButton !== undefined && request.query.hasCtaButton !== ""
                ? (request.query.hasCtaButton === "true" || request.query.hasCtaButton === "1")
                : undefined;
            const search = request.query.search && String(request.query.search).trim()
                ? String(request.query.search).trim()
                : undefined;
            console.log("[Event API] 검색 파라미터:", { page, limit, published, showInBanner, hasCtaButton, search });
            const result = await (0, eventService_1.getEvents)({ page, limit, published, showInBanner, hasCtaButton, search });
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
            // 한 줄 문구 20글자 제한 검증
            if (normOneLiner.ko.length > 20) {
                response.status(400).json({ error: "한 줄 문구(oneLiner.ko)는 20글자를 초과할 수 없습니다." });
                return;
            }
            const id = await (0, eventService_1.createEvent)({
                title: normTitle,
                oneLiner: normOneLiner,
                content: normContent,
                featuredImage: body.featuredImage ? String(body.featuredImage) : undefined,
                thumbnailImage: body.thumbnailImage ? String(body.thumbnailImage) : undefined,
                showInBanner: body.showInBanner !== undefined ? Boolean(body.showInBanner) : false,
                bannerPriority: typeof body.bannerPriority === "number" ? body.bannerPriority : 999,
                eventStartAt: body.eventStartAt ? new Date(body.eventStartAt) : undefined,
                eventEndAt: body.eventEndAt ? new Date(body.eventEndAt) : undefined,
                displayStartAt: body.displayStartAt ? new Date(body.displayStartAt) : undefined,
                displayEndAt: body.displayEndAt ? new Date(body.displayEndAt) : undefined,
                editorType: body.editorType === "toast" || body.editorType === "nextra" ? body.editorType : undefined,
                saveFormat: body.saveFormat === "markdown" || body.saveFormat === "html" ? body.saveFormat : undefined,
                enabled: body.enabled && typeof body.enabled === "object"
                    ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? false) }
                    : { ko: true, en: false },
                isMainEvent: body.isMainEvent !== undefined ? Boolean(body.isMainEvent) : false,
                subEventOrder: body.subEventOrder !== undefined && typeof body.subEventOrder === "number" && [1, 2, 3].includes(body.subEventOrder) ? body.subEventOrder : null,
                hasCtaButton: body.hasCtaButton !== undefined ? Boolean(body.hasCtaButton) : false,
                ctaButtonText: body.ctaButtonText ? normalizeLocalized(body.ctaButtonText) : undefined,
                published,
                createdBy: adminId,
                updatedBy: adminId,
            });
            response.json({ success: true, id });
            return;
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /event] 에러:", error);
        response.status(500).json({ error: "이벤트 요청 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=index.js.map