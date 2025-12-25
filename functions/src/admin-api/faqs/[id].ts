import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { FAQ } from "../../lib/admin/types"; 
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가
import { getRequestAdminId } from "../_shared/requestAuth";
import { removeUndefinedFields } from "../_shared/firestoreUtils";
import { extractFileNameFromUrl, extractImageUrls } from "../_shared/contentImageUtils";
import { mapFaqDoc } from "../_shared/mappers";
import { deleteImagesForFileName } from "../_shared/storageImageUtils";

// GET /api/faqs/[id]
async function handleGet(request: Request, response: Response, id: string) {
  try {
    const faqRef = firestore.collection("faqs").doc(id);
    const faqSnap = await faqRef.get();

    if (!faqSnap.exists) {
      response.status(404).json({ error: "FAQ를 찾을 수 없습니다." });
      return;
    }

    const faq = mapFaqDoc(faqSnap);
    response.json({ faq });
  } catch (error: any) {
    console.error("[GET /api/faqs/[id]] 에러:", error.message);
    response.status(500).json({ error: "FAQ 정보를 불러오는 중 오류가 발생했습니다." });
  }
}

// PUT /api/faqs/[id]
async function handlePut(request: Request, response: Response, id: string) {
  try {
    const adminId = getRequestAdminId(request);

    const faqRef = firestore.collection("faqs").doc(id);
    const faqSnap = await faqRef.get();

    if (!faqSnap.exists) {
      response.status(404).json({ error: "FAQ를 찾을 수 없습니다." });
      return;
    }

    const existingData = faqSnap.data() as any;
    const body = request.body as Partial<Omit<FAQ, "id" | "createdBy" | "updatedBy">>;

    // 기존/신규 이미지 비교 후 삭제 대상 결정
    const existingContentSources = [existingData.answer?.ko, existingData.answer?.en].filter(Boolean) as string[];
    const existingImageUrls = new Set<string>();
    existingContentSources.forEach((c) => extractImageUrls(c).forEach((u) => existingImageUrls.add(u)));

    const newContentSources = [body.answer?.ko, body.answer?.en].filter(Boolean) as string[];
    const newImageUrls = new Set<string>();
    newContentSources.forEach((c) => extractImageUrls(c).forEach((u) => newImageUrls.add(u)));

    const removedImageUrls = Array.from(existingImageUrls).filter((url) => !newImageUrls.has(url));

    // 제거된 이미지 삭제 (실패해도 계속)
    if (removedImageUrls.length > 0) {
      try {
        await Promise.all(
          removedImageUrls.map(async (url) => {
            const fileName = extractFileNameFromUrl(url);
            if (fileName) await deleteImagesForFileName(fileName, { logPrefix: "FAQ Update" });
          })
        );
      } catch (err) {
        console.error("[FAQ Update] 이미지 삭제 중 오류 발생:", err);
      }
    }

    await faqRef.update(
      removeUndefinedFields({
        ...body,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: adminId,
      })
    );

    response.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/faqs/[id]] 에러:", error.message);
    response.status(500).json({ error: "FAQ 정보 수정 중 오류가 발생했습니다." });
  }
}

// DELETE /api/faqs/[id]
async function handleDelete(request: Request, response: Response, id: string) {
  try {
    getRequestAdminId(request);

    const faqRef = firestore.collection("faqs").doc(id);
    const faqSnap = await faqRef.get();

    if (!faqSnap.exists) {
      response.status(404).json({ error: "FAQ를 찾을 수 없습니다." });
      return;
    }

    // FAQ 데이터에서 이미지 URL 추출
    const faqData = faqSnap.data() as any;
    const contentSources = [faqData.answer?.ko, faqData.answer?.en].filter(Boolean) as string[];
    const allImageUrls = new Set<string>();
    contentSources.forEach((content) => extractImageUrls(content).forEach((url) => allImageUrls.add(url)));

    // 연결된 이미지 삭제 (실패해도 계속)
    if (allImageUrls.size > 0) {
      try {
        await Promise.all(
          Array.from(allImageUrls).map(async (url) => {
            const fileName = extractFileNameFromUrl(url);
            if (fileName) await deleteImagesForFileName(fileName, { logPrefix: "FAQ Delete" });
          })
        );
      } catch (err) {
        console.error("[FAQ Delete] 이미지 삭제 중 오류 발생:", err);
        // 이미지 삭제 실패해도 FAQ 삭제는 계속 진행
      }
    }

    // FAQ 삭제
    await faqRef.delete();

    response.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/faqs/[id]] 에러:", error.message);
    response.status(500).json({ error: "FAQ 삭제 중 오류가 발생했습니다." });
  }
}

// 라우터에서 호출할 진입점
export async function handle(request: Request, response: Response, id: string) {
  if (request.method === "GET") {
    return handleGet(request, response, id);
  }
  if (request.method === "PUT") {
    return handlePut(request, response, id);
  }
  if (request.method === "DELETE") {
    return handleDelete(request, response, id);
  }
  response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}