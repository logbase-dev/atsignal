import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { PageDraftPayload } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가
import { getRequestAdminId } from "../_shared/requestAuth";
import { normalizeLocalizedField, removeUndefinedFields } from "../_shared/firestoreUtils";
import { extractFileNameFromUrl, extractImageUrls } from "../_shared/contentImageUtils";
import { mapPageDoc } from "../_shared/mappers";
import { deleteImagesForFileName } from "../_shared/storageImageUtils";

// GET /api/pages/[id]
export async function handleGet(_req: Request, res: Response, id: string) {
  try {
    const pageRef = firestore.collection("pages").doc(id);
    const pageSnap = await pageRef.get();

    if (!pageSnap.exists) {
      res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
      return;
    }

    const page = mapPageDoc(pageSnap);
    res.json({ page });
  } catch (error: any) {
    console.error("[GET /api/pages/[id]] 에러:", error.message);
    res.status(500).json({ error: "페이지 정보를 불러오는 중 오류가 발생했습니다." });
  }
}

// PUT /api/pages/[id] (draft/publish)
export async function handlePut(req: Request, res: Response, id: string) {
  try {
    const adminId = getRequestAdminId(req);

    const pageRef = firestore.collection("pages").doc(id);
    const pageSnap = await pageRef.get();

    if (!pageSnap.exists) {
      res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
      return;
    }

    const body = req.body as { action: "draft" | "publish"; payload: PageDraftPayload };
    if (!body?.action || (body.action !== "draft" && body.action !== "publish")) {
      res.status(400).json({ error: 'action은 "draft" 또는 "publish"여야 합니다.' });
      return;
    }

    const normalizedLabels = normalizeLocalizedField(body.payload.labels);
    const normalizedContent = normalizeLocalizedField(body.payload.content);
    const now = Timestamp.fromDate(new Date());
    const existingData = pageSnap.data() as any;

    // 기존/신규 이미지 비교 → 삭제 대상 추출
    const existingContentSources = [
      existingData.contentLive?.ko,
      existingData.contentLive?.en,
      existingData.contentDraft?.ko,
      existingData.contentDraft?.en,
    ].filter(Boolean) as string[];
    const existingImageUrls = new Set<string>();
    existingContentSources.forEach((c) => extractImageUrls(c).forEach((u) => existingImageUrls.add(u)));

    const newContentSources = [normalizedContent.ko, normalizedContent.en].filter(Boolean) as string[];
    const newImageUrls = new Set<string>();
    newContentSources.forEach((c) => extractImageUrls(c).forEach((u) => newImageUrls.add(u)));

    const removedImageUrls = Array.from(existingImageUrls).filter((url) => !newImageUrls.has(url));

    // 제거된 이미지 삭제 (실패해도 계속)
    if (removedImageUrls.length > 0) {
      try {
        await Promise.all(
          removedImageUrls.map(async (url) => {
            const fileName = extractFileNameFromUrl(url);
            if (fileName) {
              await deleteImagesForFileName(fileName, { logPrefix: "Page Update" });
            }
          })
        );
      } catch (err) {
        console.error("[Page Update] 이미지 삭제 중 오류:", err);
      }
    }

    if (body.action === "draft") {
      await pageRef.update(
        removeUndefinedFields({
          menuId: body.payload.menuId,
          slug: body.payload.slug,
          labelsDraft: normalizedLabels,
          contentDraft: normalizedContent,
          editorType: body.payload.editorType || "toast",
          saveFormat: body.payload.saveFormat || "markdown",
          draftUpdatedAt: now,
          updatedBy: adminId,
        })
      );
    } else {
      await pageRef.update(
        removeUndefinedFields({
          menuId: body.payload.menuId,
          slug: body.payload.slug,
          labelsLive: normalizedLabels,
          contentLive: normalizedContent,
          labelsDraft: normalizedLabels,
          contentDraft: normalizedContent,
          editorType: body.payload.editorType || "toast",
          saveFormat: body.payload.saveFormat || "markdown",
          updatedAt: now,
          draftUpdatedAt: now,
          updatedBy: adminId,
        })
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/pages/[id]] 에러:", error.message);
    if (error.message?.includes("인증")) {
      res.status(401).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "페이지 수정 중 오류가 발생했습니다." });
  }
}

// DELETE /api/pages/[id]
export async function handleDelete(req: Request, res: Response, id: string) {
  try {
    // Router already enforced auth; this is just a sanity check.
    getRequestAdminId(req);

    const pageRef = firestore.collection("pages").doc(id);
    const pageSnap = await pageRef.get();

    if (!pageSnap.exists) {
      res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
      return;
    }

    // 페이지 데이터에서 이미지 URL 추출
    const pageData = pageSnap.data() as any;
    const contentSources = [
      pageData.contentLive?.ko,
      pageData.contentLive?.en,
      pageData.contentDraft?.ko,
      pageData.contentDraft?.en,
    ].filter(Boolean) as string[];

    const allImageUrls = new Set<string>();
    contentSources.forEach((content) => extractImageUrls(content).forEach((url) => allImageUrls.add(url)));

    // 연결된 이미지 삭제 (실패해도 계속)
    if (allImageUrls.size > 0) {
      try {
        await Promise.all(
          Array.from(allImageUrls).map(async (url) => {
            const fileName = extractFileNameFromUrl(url);
            if (fileName) await deleteImagesForFileName(fileName, { logPrefix: "Page Delete" });
          })
        );
      } catch (err) {
        console.error("[Page Delete] 이미지 삭제 중 오류 발생:", err);
        // 이미지 삭제 실패해도 페이지 삭제는 계속 진행
      }
    }

    // 페이지 삭제
    await pageRef.delete();

    res.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/pages/[id]] 에러:", error.message);
    res.status(500).json({ error: "페이지 삭제 중 오류가 발생했습니다." });
  }
}

// 라우터 진입점
export async function handle(req: Request, res: Response, id: string) {
  if (req.method === "GET") return handleGet(req, res, id);
  if (req.method === "PUT") return handlePut(req, res, id);
  if (req.method === "DELETE") return handleDelete(req, res, id);
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}