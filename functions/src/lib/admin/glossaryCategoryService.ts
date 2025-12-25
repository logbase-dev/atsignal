import * as admin from "firebase-admin";
import { firestore } from "../../firebase";
import type { GlossaryCategory, LocalizedField } from "./types";

// 타임아웃 헬퍼 함수
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

// Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate();
  }
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
}

// LocalizedField 정규화 함수
function normalizeLocalizedField(field?: { ko?: string; en?: string }): LocalizedField {
  if (!field) {
    return { ko: "" };
  }
  return {
    ko: field.ko ?? "",
    ...(field.en ? { en: field.en } : {}),
  };
}

// 카테고리 목록 조회
export async function getGlossaryCategories(): Promise<GlossaryCategory[]> {
  try {
    const categoriesRef = firestore.collection("glossaryCategories");

    // order 기준으로 정렬 (인덱스 문제 대비)
    let q = categoriesRef.orderBy("order", "asc");
    try {
      // no-op
    } catch (error) {
      console.warn("orderBy failed, fetching without order:", error);
      q = categoriesRef;
    }

    const querySnapshot = await withTimeout(q.get(), 5000);

    return querySnapshot.docs.map((docSnap) => {
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
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,
      };
    });
  } catch (error: any) {
    console.error("Error fetching Glossary categories:", error);

    if (error.message?.includes("timed out")) {
      console.error("Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.");
    }

    return [];
  }
}

// 카테고리 단건 조회
export async function getGlossaryCategoryById(id: string): Promise<GlossaryCategory | null> {
  try {
    const categoryRef = firestore.collection("glossaryCategories").doc(id);
    const categorySnap = await withTimeout(categoryRef.get(), 5000);

    if (!categorySnap.exists) {
      return null;
    }

    const data = categorySnap.data() as Record<string, any>;
    if (!data) return null;

    return {
      id: categorySnap.id,
      name: normalizeLocalizedField(data.name),
      description: data.description ? normalizeLocalizedField(data.description) : undefined,
      order: Number(data.order ?? 0),
      enabled: {
        ko: Boolean(data.enabled?.ko ?? true),
        en: Boolean(data.enabled?.en ?? true),
      },
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
    };
  } catch (error) {
    console.error("Error fetching Glossary category:", error);
    return null;
  }
}

/**
 * @deprecated API Route로 대체됨. /api/admin/glossary-categories (POST) 사용
 */
export async function createGlossaryCategory(category: Omit<GlossaryCategory, "id">): Promise<string> {
  throw new Error("createGlossaryCategory는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}

/**
 * @deprecated API Route로 대체됨. /api/admin/glossary-categories/[id] (PUT) 사용
 */
export async function updateGlossaryCategory(id: string, category: Partial<GlossaryCategory>): Promise<void> {
  throw new Error("updateGlossaryCategory는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}

// 카테고리 삭제
export async function deleteGlossaryCategory(id: string): Promise<void> {
  const categoryRef = firestore.collection("glossaryCategories").doc(id);
  await withTimeout(categoryRef.delete(), 5000);
}

// 카테고리 사용 여부 확인 (Glossary에서 사용 중인지)
export async function isCategoryInUse(categoryId: string): Promise<boolean> {
  try {
    const glossariesRef = firestore.collection("glossaries");
    const q = glossariesRef.where("categoryId", "==", categoryId);
    const querySnapshot = await withTimeout(q.get(), 5000);

    return querySnapshot.size > 0;
  } catch (error) {
    console.error("Error checking if category is in use:", error);
    return false;
  }
}

