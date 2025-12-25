"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const blogService_1 = require("../../lib/admin/blogService");
const requestAuth_1 = require("../_shared/requestAuth");
/**
 * GET /api/admin/blog
 * POST /api/admin/blog
 */
async function handle(request, response) {
    try {
        if (request.method === "GET") {
            const page = request.query.page ? parseInt(String(request.query.page), 10) : 1;
            const limit = request.query.limit ? parseInt(String(request.query.limit), 10) : 20;
            const categoryId = request.query.categoryId && String(request.query.categoryId).trim()
                ? String(request.query.categoryId).trim()
                : undefined;
            const search = request.query.search && String(request.query.search).trim()
                ? String(request.query.search).trim()
                : undefined;
            const published = request.query.published !== undefined && request.query.published !== ""
                ? (request.query.published === "true" || request.query.published === "1")
                : undefined;
            console.log("[Blog API] 검색 파라미터:", { page, limit, categoryId, search, published });
            const result = await (0, blogService_1.getBlogPosts)({ page, limit, categoryId, search, published });
            response.json(result);
            return;
        }
        if (request.method === "POST") {
            const adminId = (0, requestAuth_1.getRequestAdminId)(request);
            const isProduction = process.env.GCLOUD_PROJECT && !process.env.FUNCTIONS_EMULATOR;
            if (isProduction) {
                // TODO: enforce cookie auth in production once blog UI is complete
            }
            const body = (request.body || {});
            const title = body.title;
            const content = body.content;
            const slug = body.slug ? String(body.slug) : "";
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
            const normContent = normalizeLocalized(content);
            if (!normTitle.ko || !slug || published === undefined) {
                response.status(400).json({ error: "title.ko, slug, published는 필수입니다." });
                return;
            }
            const authorName = body.authorName !== undefined ? String(body.authorName).trim() : undefined;
            const authorImage = body.authorImage !== undefined ? String(body.authorImage).trim() : undefined;
            console.log('[Blog Create] body.authorName:', body.authorName, 'body.authorImage:', body.authorImage);
            console.log('[Blog Create] processed authorName:', authorName, 'authorImage:', authorImage);
            const id = await (0, blogService_1.createBlogPost)({
                title: normTitle,
                slug,
                content: normContent,
                excerpt: body.excerpt ? normalizeLocalized(body.excerpt) : undefined,
                categoryId: body.categoryId ? String(body.categoryId) : undefined,
                tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
                thumbnail: body.thumbnail ? String(body.thumbnail) : undefined,
                featuredImage: body.featuredImage ? String(body.featuredImage) : undefined,
                authorName: authorName && authorName.length > 0 ? authorName : undefined,
                authorImage: authorImage && authorImage.length > 0 ? authorImage : undefined,
                editorType: body.editorType === "toast" || body.editorType === "nextra" ? body.editorType : undefined,
                saveFormat: body.saveFormat === "markdown" || body.saveFormat === "html" ? body.saveFormat : undefined,
                enabled: body.enabled && typeof body.enabled === "object"
                    ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? true) }
                    : { ko: true, en: true },
                metaTitle: body.metaTitle ? normalizeLocalized(body.metaTitle) : undefined,
                metaDescription: body.metaDescription ? normalizeLocalized(body.metaDescription) : undefined,
                metaKeywords: Array.isArray(body.metaKeywords) ? body.metaKeywords.map(String) : undefined,
                isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
                order: typeof body.order === "number" ? body.order : undefined,
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
        console.error("[Admin API /blog] 에러:", error);
        response.status(500).json({ error: "블로그 요청 처리 중 오류가 발생했습니다." });
    }
}
//# sourceMappingURL=index.js.map