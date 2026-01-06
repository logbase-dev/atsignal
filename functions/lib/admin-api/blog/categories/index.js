"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const blogCategoryService_1 = require("../../../lib/admin/blogCategoryService");
/**
 * GET /api/admin/blog/categories
 * POST /api/admin/blog/categories
 */
async function handle(request, response) {
    try {
        if (request.method === "GET") {
            const categories = await (0, blogCategoryService_1.getBlogCategories)();
            response.json({ categories });
            return;
        }
        if (request.method === "POST") {
            const isProduction = process.env.GCLOUD_PROJECT && !process.env.FUNCTIONS_EMULATOR;
            if (isProduction) {
                // TODO: enforce cookie auth in production once blog UI is complete
            }
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
            const name = normalizeLocalized(body.name);
            const slug = body.slug ? String(body.slug) : "";
            if (!name.ko || !slug) {
                response.status(400).json({ error: "name.ko, slug는 필수입니다." });
                return;
            }
            const id = await (0, blogCategoryService_1.createBlogCategory)({
                name,
                description: body.description ? normalizeLocalized(body.description) : undefined,
                slug,
                order: typeof body.order === "number" ? body.order : Number(body.order ?? 0),
                enabled: body.enabled && typeof body.enabled === "object"
                    ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? true) }
                    : { ko: true, en: true },
            });
            response.json({ success: true, id });
            return;
        }
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    catch (error) {
        console.error("[Admin API /blog/categories] 에러:", error);
        response.status(500).json({ error: "블로그 카테고리 요청 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=index.js.map