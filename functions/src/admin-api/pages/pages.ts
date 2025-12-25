import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { PageDraftPayload, Site } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가
import { getRequestAdminId } from "../_shared/requestAuth";
import { normalizeLocalizedField, removeUndefinedFields, convertTimestamp } from "../_shared/firestoreUtils";
import { mapPageDoc } from "../_shared/mappers";

// GET /api/pages
export async function handle(request: Request, response: Response) {
  if (request.method === "GET") {
    try {
      const { searchParams } = new URL(request.url, "http://localhost");
      const site = searchParams.get("site") as Site | null;
      const minimal = searchParams.get("minimal") === "true"; // 메뉴 관리용: content 필드 제외

      if (!site || (site !== "web" && site !== "docs")) {
        response.status(400).json({ error: "유효한 site 파라미터가 필요합니다 (web 또는 docs)." });
        return;
      }

      const pagesRef = firestore.collection("pages");
      const q = pagesRef.where("site", "==", site);
      const snap = await q.get();
      
      const pages = snap.docs.map((docSnap) => {
        if (minimal) {
          // 메뉴 관리용: 메타데이터만 반환 (content 제외)
          const data = docSnap.data() || {};
          return {
            id: docSnap.id,
            site: data.site,
            menuId: data.menuId,
            slug: data.slug,
            labelsLive: normalizeLocalizedField(data.labelsLive || data.labels),
            labelsDraft: data.labelsDraft ? normalizeLocalizedField(data.labelsDraft) : undefined,
            editorType: data.editorType || "toast",
            saveFormat: data.saveFormat || "markdown",
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            draftUpdatedAt: convertTimestamp(data.draftUpdatedAt),
            createdBy: data.createdBy || undefined,
            updatedBy: data.updatedBy || undefined,
            // contentLive, contentDraft는 제외 (성능 최적화)
          };
        }
        return mapPageDoc(docSnap);
      });

      response.json({ pages });
    } catch (error: any) {
      console.error("[GET /api/pages] 에러:", error.message);
      response.status(500).json({ error: "페이지 목록을 불러오는 중 오류가 발생했습니다." });
    }
    return;
  }

  if (request.method === "POST") {
    try {
      const adminId = getRequestAdminId(request);

      const body = request.body as { site: Site; payload: PageDraftPayload };

      if (!body.site || (body.site !== "web" && body.site !== "docs")) {
        response.status(400).json({ error: "유효한 site가 필요합니다 (web 또는 docs)." });
        return;
      }

      if (!body.payload?.menuId || !body.payload?.slug) {
        response.status(400).json({ error: "menuId와 slug는 필수 입력 항목입니다." });
        return;
      }

      const normalizedLabels = normalizeLocalizedField(body.payload.labels);
      const normalizedContent = normalizeLocalizedField(body.payload.content);
      const EMPTY_LOCALIZED = { ko: "", en: "" };
      const now = Timestamp.fromDate(new Date());

      const pagesRef = firestore.collection("pages");
      const docRef = await pagesRef.add(
        removeUndefinedFields({
          site: body.site,
          menuId: body.payload.menuId,
          slug: body.payload.slug,
          labelsLive: EMPTY_LOCALIZED,
          contentLive: EMPTY_LOCALIZED,
          labelsDraft: normalizedLabels,
          contentDraft: normalizedContent,
          editorType: body.payload.editorType || "toast",
          saveFormat: body.payload.saveFormat || "markdown",
          createdAt: now,
          updatedAt: null,
          draftUpdatedAt: now,
          createdBy: adminId,
          updatedBy: adminId,
        })
      );

      response.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("[POST /api/pages] 에러:", error.message);
      response.status(500).json({ error: "페이지 생성 중 오류가 발생했습니다." });
    }
    return;
  }

  response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}