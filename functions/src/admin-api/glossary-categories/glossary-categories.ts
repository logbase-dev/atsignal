import { Request, Response } from "express";
import { firestore } from "../../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { getRequestAdminId } from "../_shared/requestAuth";
import { normalizeLocalizedField, removeUndefinedFields } from "../_shared/firestoreUtils";
import { mapGlossaryCategoryDoc } from "../_shared/mappers";

// GET /api/admin/glossary-categories
async function handleGet(_req: Request, res: Response) {
  try {
    const snap = await firestore.collection("glossaryCategories").get();
    const categories = snap.docs.map(mapGlossaryCategoryDoc).sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({ categories });
  } catch (error: any) {
    console.error("[GET /api/admin/glossary-categories] 에러:", error.message);
    res.status(500).json({ error: "카테고리 목록을 불러오는 중 오류가 발생했습니다." });
  }
}

// POST /api/admin/glossary-categories
async function handlePost(req: Request, res: Response) {
  try {
    const adminId = getRequestAdminId(req);

    const body = req.body as {
      name: { ko?: string; en?: string };
      description?: { ko?: string; en?: string };
      order?: number;
      enabled?: { ko?: boolean; en?: boolean };
    };

    if (!body?.name?.ko) {
      res.status(400).json({ error: "카테고리 이름(한국어)은 필수입니다." });
      return;
    }

    const now = Timestamp.fromDate(new Date());
    const data = removeUndefinedFields({
      name: normalizeLocalizedField(body.name),
      description: body.description ? normalizeLocalizedField(body.description) : undefined,
      order: body.order ?? 0,
      enabled: {
        ko: body.enabled?.ko ?? true,
        en: body.enabled?.en ?? true,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: adminId,
      updatedBy: adminId,
    });

    const docRef = await firestore.collection("glossaryCategories").add(data);
    res.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("[POST /api/admin/glossary-categories] 에러:", error.message);
    res.status(500).json({ error: "카테고리 생성 중 오류가 발생했습니다." });
  }
}

// 엔트리 포인트
export async function handle(req: Request, res: Response) {
  if (req.method === "GET") return handleGet(req, res);
  if (req.method === "POST") return handlePost(req, res);
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}

