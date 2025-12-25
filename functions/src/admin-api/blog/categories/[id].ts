import { Request, Response } from "express";
import { deleteBlogCategory, getBlogCategoryById, updateBlogCategory } from "../../../lib/admin/blogCategoryService";
import type { LocalizedField } from "../../../lib/admin/types";

/**
 * GET /api/admin/blog/categories/:id
 * PUT /api/admin/blog/categories/:id
 * DELETE /api/admin/blog/categories/:id
 */
export async function handle(request: Request, response: Response, id: string) {
  try {
    if (request.method === "GET") {
      const category = await getBlogCategoryById(id);
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
      const body = (request.body || {}) as any;
      const normalizeLocalized = (v: any): LocalizedField => {
        if (!v) return { ko: "" };
        if (typeof v === "string") return { ko: v };
        if (typeof v === "object") return { ko: String(v.ko || ""), ...(v.en ? { en: String(v.en) } : {}) };
        return { ko: String(v) };
      };

      await updateBlogCategory(id, {
        name: body.name !== undefined ? normalizeLocalized(body.name) : undefined,
        description: body.description !== undefined ? (body.description ? normalizeLocalized(body.description) : undefined) : undefined,
        slug: body.slug !== undefined ? String(body.slug) : undefined,
        order: body.order !== undefined ? Number(body.order ?? 0) : undefined,
        enabled:
          body.enabled !== undefined
            ? body.enabled && typeof body.enabled === "object"
              ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? true) }
              : { ko: true, en: true }
            : undefined,
      });

      response.json({ success: true });
      return;
    }

    if (request.method === "DELETE") {
      await deleteBlogCategory(id);
      response.json({ success: true });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /blog/categories/:id] 에러:", error);
    response.status(500).json({ error: "블로그 카테고리 처리 중 오류가 발생했습니다." });
  }
}


