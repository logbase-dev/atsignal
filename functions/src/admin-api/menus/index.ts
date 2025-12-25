import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { Menu, Site } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가
import { getRequestAdminId } from "../_shared/requestAuth";
import { removeUndefinedFields } from "../_shared/firestoreUtils";
import { mapMenuDoc } from "../_shared/mappers";

// NOTE: this file previously used a custom deep-ish removeUndefinedFields.
// We now rely on upstream services to avoid undefined where needed, and strip top-level undefined here.

// GET /api/menus
async function handleGet(request: Request, response: Response) {
  try {
    const { searchParams } = new URL(request.url, "http://localhost");
    const site = searchParams.get("site") as Site | null;

    if (!site || (site !== "web" && site !== "docs")) {
      response.status(400).json({ error: "유효한 site 파라미터가 필요합니다 (web 또는 docs)." });
      return;
    }

    const q = firestore.collection("menus").where("site", "==", site);
    const snap = await q.get();

    const menus = snap.docs.map(mapMenuDoc);
    menus.sort((a, b) => (a.order || 0) - (b.order || 0));

    response.json({ menus });
  } catch (error: any) {
    console.error("[GET /api/menus] 에러:", error.message);
    response.status(500).json({ error: "메뉴 목록을 불러오는 중 오류가 발생했습니다." });
  }
}

// POST /api/menus
async function handlePost(request: Request, response: Response) {
  try {
    const adminId = getRequestAdminId(request);

    const body = request.body as Omit<Menu, "id" | "createdBy" | "updatedBy">;

    if (!body.site || (body.site !== "web" && body.site !== "docs")) {
      response.status(400).json({ error: "유효한 site가 필요합니다 (web 또는 docs)." });
      return;
    }

    if (!body.labels?.ko) {
      response.status(400).json({ error: "메뉴 이름(한국어)은 필수 입력 항목입니다." });
      return;
    }

    if (!body.path) {
      response.status(400).json({ error: "경로(path)는 필수 입력 항목입니다." });
      return;
    }

    const now = Timestamp.fromDate(new Date());
    const menuData = removeUndefinedFields({
      ...body,
      parentId: body.parentId || "0",
      enabled: body.enabled || { ko: true, en: false },
      pageType: body.pageType || "dynamic",
      createdAt: now,
      updatedAt: now,
      createdBy: adminId,
      updatedBy: adminId,
    });

    const docRef = await firestore.collection("menus").add(menuData);

    response.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("[POST /api/menus] 에러:", error.message);
    response.status(500).json({ error: "메뉴 생성 중 오류가 발생했습니다." });
  }
}

// 라우터에서 호출할 진입점
export async function handle(request: Request, response: Response) {
  if (request.method === "GET") {
    return handleGet(request, response);
  }
  if (request.method === "POST") {
    return handlePost(request, response);
  }
  response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}