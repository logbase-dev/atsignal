import { Request, Response } from "express";
import * as admin from "firebase-admin";
import { firestore } from "../../firebase";
import type { GlossaryCategory } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore";
import { getRequestAdminId } from "../_shared/requestAuth";
import { convertTimestamp, normalizeLocalizedField, removeUndefinedFields } from "../_shared/firestoreUtils";

// GlossaryCategory 매핑
function mapGlossaryCategoryData(docSnap: admin.firestore.DocumentSnapshot): GlossaryCategory {
  const data = docSnap.data() as Record<string, any>;
  return {
    id: docSnap.id,
    name: normalizeLocalizedField(data.name),
    description: data.description ? normalizeLocalizedField(data.description) : undefined,
    order: Number(data.order ?? 0),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

// GET /api/admin/glossary-categories/[id]
async function handleGet(req: Request, res: Response, id: string) {
  try {
    const categoryRef = firestore.collection("glossaryCategories").doc(id);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      res.status(404).json({ error: "용어사전 카테고리를 찾을 수 없습니다." });
      return;
    }

    const category = mapGlossaryCategoryData(categorySnap);
    res.json({ category });
  } catch (error: any) {
    console.error("[GET /api/admin/glossary-categories/[id]] 에러:", error.message);
    res.status(500).json({ error: "용어사전 카테고리 정보를 불러오는 중 오류가 발생했습니다." });
  }
}

// PUT /api/admin/glossary-categories/[id] (순서 재조정 포함)
async function handlePut(req: Request, res: Response, id: string) {
  try {
    const adminId = getRequestAdminId(req);

    const categoryRef = firestore.collection("glossaryCategories").doc(id);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      res.status(404).json({ error: "용어사전 카테고리를 찾을 수 없습니다." });
      return;
    }

    const currentData = categorySnap.data() as Record<string, any>;
    const oldOrder = currentData.order;
    const body = req.body as Partial<Omit<GlossaryCategory, "id" | "createdBy">>;

    // 순서 변경 시 다른 카테고리 순서 재조정
    if (body.order !== undefined && body.order !== oldOrder) {
      const allSnap = await firestore.collection("glossaryCategories").get();
      const batch = firestore.batch();
      const newOrder = body.order;

      if (newOrder > oldOrder) {
        // 4→8: 5~8번을 4~7로 당김
        allSnap.docs.forEach((docSnap) => {
          if (docSnap.id === id) return;
          const data = docSnap.data() as any;
          const ord = data.order;
          if (ord > oldOrder && ord <= newOrder) {
            batch.update(docSnap.ref, { order: ord - 1 });
          }
        });
      } else {
        // 8→4: 4~7번을 5~8로 밀어냄
        allSnap.docs.forEach((docSnap) => {
          if (docSnap.id === id) return;
          const data = docSnap.data() as any;
          const ord = data.order;
          if (ord >= newOrder && ord < oldOrder) {
            batch.update(docSnap.ref, { order: ord + 1 });
          }
        });
      }

      await batch.commit();
    }

    const now = Timestamp.fromDate(new Date());
    await categoryRef.update(
      removeUndefinedFields({
        ...body,
        name: body.name ? normalizeLocalizedField(body.name) : undefined,
        description: body.description ? normalizeLocalizedField(body.description) : undefined,
        updatedAt: now,
        updatedBy: adminId,
      })
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/admin/glossary-categories/[id]] 에러:", error.message);
    res.status(500).json({ error: "용어사전 카테고리 수정 중 오류가 발생했습니다." });
  }
}

// DELETE /api/admin/glossary-categories/[id]
async function handleDelete(req: Request, res: Response, id: string) {
  try {
    getRequestAdminId(req);

    const categoryRef = firestore.collection("glossaryCategories").doc(id);
    const categorySnap = await categoryRef.get();

    if (!categorySnap.exists) {
      res.status(404).json({ error: "용어사전 카테고리를 찾을 수 없습니다." });
      return;
    }

    // ✅ 해당 카테고리를 사용하는 Glossary가 있는지 확인
    const glossariesWithCategory = await firestore
      .collection("glossaries")
      .where("categoryId", "==", id)
      .limit(1)
      .get();

    if (!glossariesWithCategory.empty) {
      res.status(400).json({
        error: "이 카테고리를 사용하는 용어가 있어서 삭제할 수 없습니다. 먼저 해당 용어의 카테고리를 변경해주세요.",
      });
      return;
    }

    // 카테고리 삭제
    await categoryRef.delete();

    res.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/admin/glossary-categories/[id]] 에러:", error.message);
    res.status(500).json({ error: "용어사전 카테고리 삭제 중 오류가 발생했습니다." });
  }
}

// 진입점
export async function handle(req: Request, res: Response, id: string) {
  if (req.method === "GET") return handleGet(req, res, id);
  if (req.method === "PUT") return handlePut(req, res, id);
  if (req.method === "DELETE") return handleDelete(req, res, id);
  res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}

