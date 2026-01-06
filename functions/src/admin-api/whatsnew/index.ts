import { Request, Response } from "express";
import { createWhatsNew, getWhatsNews } from "../../lib/admin/whatsnewService";
import type { LocalizedField } from "../../lib/admin/types";
import { getRequestAdminId } from "../_shared/requestAuth";

/**
 * GET /api/admin/whatsnew
 * POST /api/admin/whatsnew
 */
export async function handle(request: Request, response: Response) {
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

      console.log("[WhatsNew API] 검색 파라미터:", { page, limit, published, showInBanner, search });

      const result = await getWhatsNews({ page, limit, published, showInBanner, search });
      response.json(result);
      return;
    }
    if (request.method === "POST") {
      const adminId = getRequestAdminId(request);
      const body = (request.body || {}) as any;
      const title: LocalizedField | string | undefined = body.title;
      const oneLiner: LocalizedField | string | undefined = body.oneLiner;
      const content: LocalizedField | string | undefined = body.content;
      const published = body.published !== undefined ? Boolean(body.published) : undefined;

      const normalizeLocalized = (v: any): LocalizedField => {
        if (!v) return { ko: "" };
        if (typeof v === "string") return { ko: v };
        if (typeof v === "object") return { ko: String(v.ko || ""), ...(v.en ? { en: String(v.en) } : {}) };
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

      const id = await createWhatsNew({
        title: normTitle,
        oneLiner: normOneLiner,
        content: normContent,

        showInBanner: body.showInBanner !== undefined ? Boolean(body.showInBanner) : false,
        bannerPriority: typeof body.bannerPriority === "number" ? body.bannerPriority : 999,

        displayStartAt: body.displayStartAt ? new Date(body.displayStartAt) : undefined,
        displayEndAt: body.displayEndAt ? new Date(body.displayEndAt) : undefined,

        editorType: body.editorType === "toast" || body.editorType === "nextra" ? body.editorType : undefined,
        saveFormat: body.saveFormat === "markdown" || body.saveFormat === "html" ? body.saveFormat : undefined,

        enabled:
          body.enabled && typeof body.enabled === "object"
            ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? false) }
            : { ko: true, en: false },

        isTop: body.isTop !== undefined ? Boolean(body.isTop) : false,

        published,
        createdBy: adminId,
        updatedBy: adminId,
      });
      console.log(`[POST /whatsnew] isTop 값:`, body.isTop, `->`, body.isTop !== undefined ? Boolean(body.isTop) : false);
      response.json({ success: true, id });
      return;
    }
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /whatsnew] 에러:", error);
    response.status(500).json({ error: "What's new 요청 처리 중 오류가 발생했습니다." });
  }
}

