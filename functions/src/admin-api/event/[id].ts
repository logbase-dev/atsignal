import { Request, Response } from "express";
import { deleteEvent, getEventById, updateEvent, incrementEventViews } from "../../lib/admin/eventService";
import { deleteEventParticipantsByEventId } from "../../lib/admin/eventParticipantService";
import type { LocalizedField } from "../../lib/admin/types";
import { getRequestAdminId } from "../_shared/requestAuth";

/**
 * GET /api/admin/event/:id
 * PUT /api/admin/event/:id
 * PATCH /api/admin/event/:id
 * DELETE /api/admin/event/:id
 */
export async function handle(request: Request, response: Response, id: string) {
  try {
    if (request.method === "GET") {
      const event = await getEventById(id);
      if (!event) {
        response.status(404).json({ error: "이벤트를 찾을 수 없습니다." });
        return;
      }
      // 조회수 증가는 웹앱에서만 처리 (admin API에서는 증가하지 않음)
      response.json({ event });
      return;
    }

    if (request.method === "PATCH") {
      // 조회수 증가 전용 엔드포인트 (웹앱에서 사용)
      const action = request.body?.action;
      if (action === "incrementViews") {
        await incrementEventViews(id);
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

      // 한 줄 문구 20글자 제한 검증
      if (body.oneLiner !== undefined) {
        const oneLiner = normalizeLocalized(body.oneLiner);
        if (oneLiner.ko.length > 20) {
          response.status(400).json({ error: "한 줄 문구(oneLiner.ko)는 20글자를 초과할 수 없습니다." });
          return;
        }
      }

      // 이벤트 기간 검증
      if (body.eventStartAt && body.eventEndAt) {
        const startAt = new Date(body.eventStartAt);
        const endAt = new Date(body.eventEndAt);
        if (endAt < startAt) {
          response.status(400).json({ error: "이벤트 종료일시는 시작일시보다 이후여야 합니다." });
          return;
        }
      }
      // 노출 기간 검증
      if (body.displayStartAt && body.displayEndAt) {
        const startAt = new Date(body.displayStartAt);
        const endAt = new Date(body.displayEndAt);
        if (endAt < startAt) {
          response.status(400).json({ error: "노출 종료일시는 시작일시보다 이후여야 합니다." });
          return;
        }
      }

      console.log(`[PUT /event/:id] 요청 body:`, JSON.stringify(body, null, 2));

      const updatePayload = {
        title: body.title !== undefined ? normalizeLocalized(body.title) : undefined,
        oneLiner: body.oneLiner !== undefined ? normalizeLocalized(body.oneLiner) : undefined,
        content: body.content !== undefined ? normalizeLocalized(body.content) : undefined,

        featuredImage: body.featuredImage !== undefined ? (body.featuredImage ? String(body.featuredImage) : undefined) : undefined,
        thumbnailImage: body.thumbnailImage !== undefined ? (body.thumbnailImage ? String(body.thumbnailImage) : undefined) : undefined,

        showInBanner: body.showInBanner !== undefined ? Boolean(body.showInBanner) : undefined,
        bannerPriority:
          body.bannerPriority !== undefined && typeof body.bannerPriority === "number" ? body.bannerPriority : undefined,

        eventStartAt: body.eventStartAt ? new Date(body.eventStartAt) : undefined,
        eventEndAt: body.eventEndAt ? new Date(body.eventEndAt) : undefined,
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

        isMainEvent: body.isMainEvent !== undefined ? Boolean(body.isMainEvent) : undefined,
        subEventOrder: body.subEventOrder !== undefined 
          ? (typeof body.subEventOrder === "number" && [1, 2, 3].includes(body.subEventOrder) ? body.subEventOrder : null)
          : undefined,

        hasCtaButton: body.hasCtaButton !== undefined ? Boolean(body.hasCtaButton) : undefined,
        ctaButtonText: body.ctaButtonText !== undefined ? (body.ctaButtonText ? normalizeLocalized(body.ctaButtonText) : undefined) : undefined,

        published: body.published !== undefined ? Boolean(body.published) : undefined,
        updatedBy: adminId,
      };

      console.log(`[PUT /event/:id] updatePayload:`, JSON.stringify(updatePayload, null, 2));

      await updateEvent(id, updatePayload);
      response.json({ success: true });
      return;
    }

    if (request.method === "DELETE") {
      // 이벤트 삭제 시 연관된 참가자 정보도 함께 삭제 (cascade delete)
      try {
        await deleteEventParticipantsByEventId(id);
      } catch (err) {
        console.error("[Event Delete] 참가자 정보 삭제 중 오류:", err);
        // 참가자 삭제 실패해도 이벤트는 삭제 진행
      }
      await deleteEvent(id);
      response.json({ success: true });
      return;
    }

    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  } catch (error: any) {
    console.error("[Admin API /event/:id] 에러:", error);
    response.status(500).json({ error: "이벤트 처리 중 오류가 발생했습니다." });
  }
}

