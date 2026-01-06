"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const blogCategoryService_1 = require("../../../lib/admin/blogCategoryService");
/**
 * GET /api/admin/blog/categories/:id
 * PUT /api/admin/blog/categories/:id
 * DELETE /api/admin/blog/categories/:id
 */
async function handle(request, response, id) {
    try {
        if (request.method === "GET") {
            const category = await (0, blogCategoryService_1.getBlogCategoryById)(id);
            if (!category) {
                response.status(404).json({ error: "블로그 카테고리를 찾을 수 없습니다." });
                return;
            }
            response.json({ category });
            return;
        }
        const isProduction = process.env.GCLOUD_PROJECT && !process.env.FUNCTIONS_EMULATOR;
        if (isProduction) {
            // TODO: enforce cookie auth in production once blog UI is complete
        }
        if (request.method === "PUT") {
            const body = (request.body || {});
            const normalizeLocalized = (v) => {
                if (!v)
                    return { ko: "" };
                if (typeof v === "string")
                    return { ko: v };
                if (typeof v === "object")
                    return { ko: String(v.ko || ""), ...(v.en ? { en: String(v.en) } : {}) };
                return { ko: String(v) };
            };
            await (0, blogCategoryService_1.updateBlogCategory)(id, {
                name: body.name !== undefined ? normalizeLocalized(body.name) : undefined,
                description: body.description !== undefined ? (body.description ? normalizeLocalized(body.description) : undefined) : undefined,
                slug: body.slug !== undefined ? String(body.slug) : undefined,
                order: body.order !== undefined ? Number(body.order ?? 0) : undefined,
                enabled: body.enabled !== undefined
                    ? body.enabled && typeof body.enabled === "object"
                        ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? true) }
                        : { ko: true, en: true }
                    : undefined,
            });
            response.json({ success: true });
            return;
        }
        if (request.method === "DELETE") {
            await (0, blogCategoryService_1.deleteBlogCategory)(id);
            response.json({ success: true });
            return;
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /blog/categories/:id] 에러:", error);
        response.status(500).json({ error: "블로그 카테고리 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=%5Bid%5D.js.map