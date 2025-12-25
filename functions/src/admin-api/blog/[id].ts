import { Request, Response } from "express";
import { deleteBlogPost, getBlogPostById, updateBlogPost, incrementBlogPostViews } from "../../lib/admin/blogService";
import type { LocalizedField } from "../../lib/admin/types";
import { getRequestAdminId } from "../_shared/requestAuth";

/**
 * GET /api/admin/blog/:id
 * PUT /api/admin/blog/:id
 * DELETE /api/admin/blog/:id
 */
export async function handle(request: Request, response: Response, id: string) {
  try {
    if (request.method === "GET") {
      const post = await getBlogPostById(id);
      if (!post) {
        response.status(404).json({ error: "블로그 포스트를 찾을 수 없습니다." });
        return;
      }
      // 조회수 증가는 웹앱에서만 처리 (admin API에서는 증가하지 않음)
      response.json({ post });
      return;
    }

    if (request.method === "PATCH") {
      // 조회수 증가 전용 엔드포인트 (웹앱에서 사용)
      const action = request.body?.action;
      if (action === "incrementViews") {
        await incrementBlogPostViews(id);
        response.json({ success: true });
        return;
      }
      response.status(400).json({ error: "Invalid action" });
      return;
    }

    const isProduction = process.env.GCLOUD_PROJECT && !process.env.FUNCTIONS_EMULATOR;
    if (isProduction) {
      // TODO: enforce cookie auth in production once blog UI is complete
    }

    if (request.method === "PUT") {
      const adminId = getRequestAdminId(request);
      const body = (request.body || {}) as any;
      const normalizeLocalized = (v: any): LocalizedField => {
        if (!v) return { ko: "" };
        if (typeof v === "string") return { ko: v };
        if (typeof v === "object") return { ko: String(v.ko || ""), ...(v.en ? { en: String(v.en) } : {}) };
        return { ko: String(v) };
      };
      const authorName = body.authorName !== undefined ? String(body.authorName).trim() : undefined;
      const authorImage = body.authorImage !== undefined ? String(body.authorImage).trim() : undefined;
      
      console.log('[Blog Update] body.authorName:', body.authorName, 'body.authorImage:', body.authorImage);
      console.log('[Blog Update] processed authorName:', authorName, 'authorImage:', authorImage);
      
      await updateBlogPost(id, {
        title: body.title !== undefined ? normalizeLocalized(body.title) : undefined,
        slug: body.slug !== undefined ? String(body.slug) : undefined,
        content: body.content !== undefined ? normalizeLocalized(body.content) : undefined,
        excerpt: body.excerpt !== undefined ? normalizeLocalized(body.excerpt) : undefined,

        categoryId: body.categoryId !== undefined ? (body.categoryId ? String(body.categoryId) : undefined) : undefined,
        tags: body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags.map(String) : undefined) : undefined,
        thumbnail: body.thumbnail !== undefined ? (body.thumbnail ? String(body.thumbnail) : undefined) : undefined,
        featuredImage: body.featuredImage !== undefined ? (body.featuredImage ? String(body.featuredImage) : undefined) : undefined,
        authorName: authorName && authorName.length > 0 ? authorName : undefined,
        authorImage: authorImage && authorImage.length > 0 ? authorImage : undefined,

        editorType: body.editorType !== undefined && (body.editorType === "toast" || body.editorType === "nextra") ? body.editorType : undefined,
        saveFormat: body.saveFormat !== undefined && (body.saveFormat === "markdown" || body.saveFormat === "html") ? body.saveFormat : undefined,

        enabled:
          body.enabled !== undefined
            ? body.enabled && typeof body.enabled === "object"
              ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? true) }
              : { ko: true, en: true }
            : undefined,

        metaTitle: body.metaTitle !== undefined ? (body.metaTitle ? normalizeLocalized(body.metaTitle) : undefined) : undefined,
        metaDescription: body.metaDescription !== undefined ? (body.metaDescription ? normalizeLocalized(body.metaDescription) : undefined) : undefined,
        metaKeywords: body.metaKeywords !== undefined ? (Array.isArray(body.metaKeywords) ? body.metaKeywords.map(String) : undefined) : undefined,

        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
        order: body.order !== undefined && typeof body.order === "number" ? body.order : undefined,
        published: body.published !== undefined ? Boolean(body.published) : undefined,
        updatedBy: adminId,
      });
      response.json({ success: true });
      return;
    }

    if (request.method === "DELETE") {
      await deleteBlogPost(id);
      response.json({ success: true });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /blog/:id] 에러:", error);
    response.status(500).json({ error: "블로그 포스트 처리 중 오류가 발생했습니다." });
  }
}


