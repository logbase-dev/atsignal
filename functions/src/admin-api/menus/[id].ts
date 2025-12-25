import { Request, Response } from "express";
import { firestore } from "../../firebase";
import type { Menu } from "../../lib/admin/types";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가
import { getRequestAdminId } from "../_shared/requestAuth";
import { removeUndefinedFields } from "../_shared/firestoreUtils";
import { mapMenuDoc } from "../_shared/mappers";

// GET /api/menus/[id]
async function handleGet(request: Request, response: Response, id: string) {
  try {
    const menuRef = firestore.collection("menus").doc(id);
    const menuSnap = await menuRef.get();

    if (!menuSnap.exists) {
      response.status(404).json({ error: "메뉴를 찾을 수 없습니다." });
      return;
    }

    const menu = mapMenuDoc(menuSnap);
    response.json({ menu });
  } catch (error: any) {
    console.error("[GET /api/menus/[id]] 에러:", error.message);
    response.status(500).json({ error: "메뉴 정보를 불러오는 중 오류가 발생했습니다." });
  }
}

// PUT /api/menus/[id]
async function handlePut(request: Request, response: Response, id: string) {
  try {
    const adminId = getRequestAdminId(request);

    const menuRef = firestore.collection("menus").doc(id);
    const menuSnap = await menuRef.get();

    if (!menuSnap.exists) {
      response.status(404).json({ error: "메뉴를 찾을 수 없습니다." });
      return;
    }

    const existingMenu = menuSnap.data() as Menu;
    const body: Partial<Omit<Menu, "id" | "createdBy">> = request.body;

    // path 변경 시 연결된 페이지 slug 업데이트 (외부 링크 제외)
    if (body.path !== undefined && body.path !== existingMenu.path && existingMenu.pageType !== "links") {
      const pagesRef = firestore.collection("pages");
      const pagesQuery = pagesRef.where("menuId", "==", id);
      const pagesSnapshot = await pagesQuery.get();

      const updatePromises = pagesSnapshot.docs.map((pageDoc) =>
        pageDoc.ref.update({ slug: body.path })
      );
      await Promise.all(updatePromises);
    }

    const now = Timestamp.fromDate(new Date());
    await menuRef.update(
      removeUndefinedFields({
        ...body,
        updatedAt: now,
        updatedBy: adminId,
      })
    );

    response.json({ success: true });
  } catch (error: any) {
    console.error("[PUT /api/menus/[id]] 에러:", error.message);
    response.status(500).json({ error: "메뉴 수정 중 오류가 발생했습니다." });
  }
}

// DELETE /api/menus/[id]
async function handleDelete(request: Request, response: Response, id: string) {
  try {
    getRequestAdminId(request);

    const menuRef = firestore.collection("menus").doc(id);
    const menuSnap = await menuRef.get();

    if (!menuSnap.exists) {
      response.status(404).json({ error: "메뉴를 찾을 수 없습니다." });
      return;
    }

    // ✅ 하위 메뉴가 있는지 확인
    const childMenus = await firestore
      .collection("menus")
      .where("parentId", "==", id)
      .limit(1)
      .get();

    if (!childMenus.empty) {
      response.status(400).json({ 
        error: "하위 메뉴가 존재하므로 삭제할 수 없습니다. 하위 메뉴를 먼저 삭제해야 합니다." 
      });
      return;
    }

    // ✅ 연결된 페이지가 있는지 확인
    const connectedPages = await firestore
      .collection("pages")
      .where("menuId", "==", id)
      .limit(1)
      .get();

    if (!connectedPages.empty) {
      response.status(400).json({ 
        error: "메뉴에 연결된 페이지가 있어서 삭제할 수 없습니다. 먼저 연결된 페이지를 삭제하거나 다른 메뉴로 변경해주세요." 
      });
      return;
    }

    // 메뉴 삭제
    await menuRef.delete();

    response.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/menus/[id]] 에러:", error.message);
    response.status(500).json({ error: "메뉴 삭제 중 오류가 발생했습니다." });
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