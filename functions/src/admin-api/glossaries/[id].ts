import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { Glossary } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore";
import { getRequestAdminId } from "../_shared/requestAuth";
import { removeUndefinedFields } from "../_shared/firestoreUtils";
import { mapGlossaryDoc } from "../_shared/mappers";
import { calculateInitialLetter } from "../../lib/admin/glossaryService";

// GET /api/admin/glossaries/[id]
async function handleGet(request: Request, response: Response, id: string) {
  try {
    const glossaryRef = firestore.collection("glossaries").doc(id);
    const glossarySnap = await glossaryRef.get();

    if (!glossarySnap.exists) {
      response.status(404).json({ error: "용어를 찾을 수 없습니다." });
      return;
    }

    const glossary = mapGlossaryDoc(glossarySnap);
    response.json({ glossary });
  } catch (error: any) {
    console.error("[GET /api/admin/glossaries/[id]]] 에러:", error.message);
    response.status(500).json({ error: "용어 정보를 불러오는 중 오류가 발생했습니다." });
  }
}

// PUT /api/admin/glossaries/[id]
async function handlePut(request: Request, response: Response, id: string) {
  try {
    const adminId = getRequestAdminId(request);

    const glossaryRef = firestore.collection("glossaries").doc(id);
    const glossarySnap = await glossaryRef.get();

    if (!glossarySnap.exists) {
      response.status(404).json({ error: "용어를 찾을 수 없습니다." });
      return;
    }

    const body = request.body as Partial<Omit<Glossary, "id" | "createdBy" | "updatedBy">>;
    
    // term이 변경된 경우 initialLetter 재계산
    let updateData: any = {
      ...body,
      updatedAt: Timestamp.fromDate(new Date()),
      updatedBy: adminId,
    };

    if (body.term) {
      const existingData = glossarySnap.data() as any;
      const locale = body.enabled?.ko !== undefined ? (body.enabled.ko ? "ko" : "en") : 
                     (existingData?.enabled?.ko ? "ko" : "en");
      updateData.initialLetter = calculateInitialLetter(body.term, locale);
    }

    await glossaryRef.update(removeUndefinedFields(updateData));

    response.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/admin/glossaries/[id]] 에러:", error.message);
    response.status(500).json({ error: "용어 정보 수정 중 오류가 발생했습니다." });
  }
}

// DELETE /api/admin/glossaries/[id]
async function handleDelete(request: Request, response: Response, id: string) {
  try {
    getRequestAdminId(request);

    const glossaryRef = firestore.collection("glossaries").doc(id);
    const glossarySnap = await glossaryRef.get();

    if (!glossarySnap.exists) {
      response.status(404).json({ error: "용어를 찾을 수 없습니다." });
      return;
    }

    // 용어 삭제
    await glossaryRef.delete();

    response.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/admin/glossaries/[id]] 에러:", error.message);
    response.status(500).json({ error: "용어 삭제 중 오류가 발생했습니다." });
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

