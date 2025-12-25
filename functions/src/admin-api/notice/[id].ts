import { Request, Response } from "express";
import { deleteNotice, getNoticeById, updateNotice, incrementNoticeViews } from "../../lib/admin/noticeService";
import type { LocalizedField } from "../../lib/admin/types";
import { getRequestAdminId } from "../_shared/requestAuth";

/**
 * GET /api/admin/notice/:id
 * PUT /api/admin/notice/:id
 * PATCH /api/admin/notice/:id
 * DELETE /api/admin/notice/:id
 */
export async function handle(request: Request, response: Response, id: string) {
  try {
    if (request.method === "GET") {
      const notice = await getNoticeById(id);
      if (!notice) {
        response.status(404).json({ error: "공지사항을 찾을 수 없습니다." });
        return;
      }
      // 조회수 증가는 웹앱에서만 처리 (admin API에서는 증가하지 않음)
      response.json({ notice });
      return;
    }

    if (request.method === "PATCH") {
      // 조회수 증가 전용 엔드포인트 (웹앱에서 사용)
      const action = request.body?.action;
      if (action === "incrementViews") {
        await incrementNoticeViews(id);
        response.json({ success: true });
        return;
      }
      response.status(400).json({ error: "Invalid action" });
      return;
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

      // 한 줄 문구 50글자 제한 검증
      if (body.oneLiner !== undefined) {
        const oneLiner = normalizeLocalized(body.oneLiner);
        if (oneLiner.ko.length > 50) {
          response.status(400).json({ error: "한 줄 문구(oneLiner.ko)는 50글자를 초과할 수 없습니다." });
          return;
        }
      }

      // 노출 기간 검증
      if (body.displayStartAt && body.displayEndAt) {
        const startAt = new Date(body.displayStartAt);
        const endAt = new Date(body.displayEndAt);
        if (endAt < startAt) {
          response.status(400).json({ error: "종료일시는 시작일시보다 이후여야 합니다." });
          return;
        }
      }

      console.log(`[PUT /notice/:id] 요청 body:`, JSON.stringify(body, null, 2));
      console.log(`[PUT /notice/:id] isTop 값:`, body.isTop, `(타입: ${typeof body.isTop})`, `->`, body.isTop !== undefined ? Boolean(body.isTop) : undefined);

      const updatePayload = {
        title: body.title !== undefined ? normalizeLocalized(body.title) : undefined,
        oneLiner: body.oneLiner !== undefined ? normalizeLocalized(body.oneLiner) : undefined,
        content: body.content !== undefined ? normalizeLocalized(body.content) : undefined,

        showInBanner: body.showInBanner !== undefined ? Boolean(body.showInBanner) : undefined,
        bannerPriority:
          body.bannerPriority !== undefined && typeof body.bannerPriority === "number" ? body.bannerPriority : undefined,

        displayStartAt: body.displayStartAt ? new Date(body.displayStartAt) : undefined,
        displayEndAt: body.displayEndAt ? new Date(body.displayEndAt) : undefined,

        editorType: body.editorType !== undefined && (body.editorType === "toast" || body.editorType === "nextra") ? body.editorType : undefined,
        saveFormat: body.saveFormat !== undefined && (body.saveFormat === "markdown" || body.saveFormat === "html") ? body.saveFormat : undefined,

        enabled:
          body.enabled !== undefined
            ? body.enabled && typeof body.enabled === "object"
              ? { ko: Boolean(body.enabled.ko ?? true), en: Boolean(body.enabled.en ?? false) }
              : { ko: true, en: false }
            : undefined,

        isTop: body.isTop !== undefined ? Boolean(body.isTop) : undefined,

        published: body.published !== undefined ? Boolean(body.published) : undefined,
        updatedBy: adminId,
      };

      console.log(`[PUT /notice/:id] updatePayload:`, JSON.stringify(updatePayload, null, 2));
      console.log(`[PUT /notice/:id] updatePayload.isTop:`, updatePayload.isTop, `(타입: ${typeof updatePayload.isTop})`);

      await updateNotice(id, updatePayload);
      response.json({ success: true });
      return;
    }

    if (request.method === "DELETE") {
      await deleteNotice(id);
      response.json({ success: true });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /notice/:id] 에러:", error);
    response.status(500).json({ error: "공지사항 처리 중 오류가 발생했습니다." });
  }
}

