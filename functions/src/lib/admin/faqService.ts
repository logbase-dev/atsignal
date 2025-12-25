import { admin, firestore } from "../../firebase";
import type { FAQ, LocalizedField } from "./types";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가

// Firestore 타입 별칭
type DocSnap = admin.firestore.DocumentSnapshot;
type QuerySnap = admin.firestore.QuerySnapshot;
type QueryDocSnap = admin.firestore.QueryDocumentSnapshot;

// 타임아웃 헬퍼
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)),
  ]);
}

// Timestamp → Date 변환
function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value?.toDate instanceof Function) return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

// LocalizedField 정규화
function normalizeLocalizedField(field?: { ko?: string; en?: string }): LocalizedField {
  if (!field) return { ko: "" };
  return { ko: field.ko ?? "", ...(field.en ? { en: field.en } : {}) };
}

// FAQ 매핑
function mapFAQData(doc: DocSnap): FAQ {
  const data = doc.data() as Record<string, any>;
  return {
    id: doc.id,
    question: normalizeLocalizedField(data.question),
    answer: normalizeLocalizedField(data.answer),
    categoryId: data.categoryId && String(data.categoryId).trim() ? String(data.categoryId) : undefined,
    level: Number(data.level ?? 999),
    isTop: Boolean(data.isTop ?? false),
    enabled: {
      ko: Boolean(data.enabled?.ko ?? true),
      en: Boolean(data.enabled?.en ?? true),
    },
    tags: Array.isArray(data.tags) ? data.tags.filter((t: any) => typeof t === "string") : undefined,
    views: typeof data.views === "number" ? data.views : 0,
    editorType: data.editorType || "toast",
    saveFormat: data.saveFormat || "markdown",
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    order: data.order !== undefined ? Number(data.order) : undefined,
    createdBy: data.createdBy || undefined,
    updatedBy: data.updatedBy || undefined,
  };
}

// ----- 목록 조회 (하위 호환, 클라이언트 정렬 포함) -----
export async function getFAQs(options?: {
  categoryId?: string;
  tags?: string[];
  search?: string;
  orderBy?: "level" | "isTop" | "createdAt";
  orderDirection?: "asc" | "desc";
}): Promise<FAQ[]> {
  try {
    const faqsRef = firestore.collection("faqs");
    let q: admin.firestore.Query = faqsRef;

    if (options?.categoryId && options.categoryId !== "__no_category__") {
      q = q.where("categoryId", "==", options.categoryId);
    }

    try {
      q = q.orderBy("isTop", "desc").orderBy("level", "asc").orderBy("order", "asc");
    } catch (e) {
      console.warn("orderBy failed, fallback:", e);
      try {
        q = q.orderBy("createdAt", "desc");
      } catch {
        // no-op
      }
    }

    const snap = await withTimeout<QuerySnap>(q.get(), 5000);
    let faqs = snap.docs.map(mapFAQData);

    if (options?.categoryId === "__no_category__") {
      faqs = faqs.filter((f) => !f.categoryId || f.categoryId.trim() === "");
    }

    if (options?.tags?.length) {
      faqs = faqs.filter((f) => f.tags && options.tags!.some((t) => f.tags!.includes(t)));
    }

    if (options?.search) {
      const s = options.search.toLowerCase();
      faqs = faqs.filter((f) => {
        const qk = f.question.ko?.toLowerCase() || "";
        const qe = f.question.en?.toLowerCase() || "";
        const ak = f.answer.ko?.toLowerCase() || "";
        const ae = f.answer.en?.toLowerCase() || "";
        return qk.includes(s) || qe.includes(s) || ak.includes(s) || ae.includes(s);
      });
    }

    faqs.sort((a, b) => {
      if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
      if (a.level !== b.level) return a.level - b.level;
      if (a.order !== undefined && b.order !== undefined && a.order !== b.order) return a.order - b.order;
      if (a.createdAt && b.createdAt) return b.createdAt.getTime() - a.createdAt.getTime();
      return 0;
    });

    return faqs;
  } catch (error: any) {
    console.error("Error fetching FAQs:", error);
    if (error.message?.includes("timed out")) {
      console.error("Firestore 쿼리 타임아웃 - 환경 변수/네트워크 확인");
    }
    return [];
  }
}

// ----- 목록 조회 (페이지네이션) -----
export interface FAQFilters {
  categoryId?: string;
  tags?: string[];
  search?: string;
  orderBy?: "level" | "isTop" | "createdAt";
  orderDirection?: "asc" | "desc";
  limit?: number;
  lastDoc?: QueryDocSnap;
}
export interface FAQResult {
  faqs: FAQ[];
  lastDoc?: QueryDocSnap;
  hasMore: boolean;
}

export async function getFAQsWithPagination(filters?: FAQFilters): Promise<FAQResult> {
  try {
    const faqsRef = firestore.collection("faqs");
    let q: admin.firestore.Query = faqsRef;

    if (filters?.categoryId && filters.categoryId !== "__no_category__") {
      q = q.where("categoryId", "==", filters.categoryId);
    }
    if (filters?.tags?.length) {
      const tagsToQuery = filters.tags.slice(0, 10);
      q = q.where("tags", "array-contains-any", tagsToQuery);
    }

    try {
      q = q.orderBy("isTop", "desc").orderBy("level", "asc").orderBy("order", "asc");
    } catch (e) {
      console.warn("orderBy failed, trying alternative order:", e);
      try {
        q = q.orderBy("createdAt", "desc");
      } catch {
        console.warn("All orderBy attempts failed, fetching without order");
      }
    }

    const pageLimit = filters?.limit || 20;
    if (filters?.lastDoc) {
      q = q.startAfter(filters.lastDoc);
    }
    q = q.limit(pageLimit + 1);

    const snap = await withTimeout<QuerySnap>(q.get(), 5000);
    const docs = snap.docs;
    const hasMore = docs.length > pageLimit;
    const docsToProcess = hasMore ? docs.slice(0, pageLimit) : docs;

    let faqs = docsToProcess.map(mapFAQData);

    if (filters?.categoryId === "__no_category__") {
      faqs = faqs.filter((f) => !f.categoryId || f.categoryId.trim() === "");
    }

    if (filters?.tags?.length) {
      faqs = faqs.filter((f) => f.tags && filters.tags!.some((t) => f.tags!.includes(t)));
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      faqs = faqs.filter((f) => {
        const qk = f.question.ko?.toLowerCase() || "";
        const qe = f.question.en?.toLowerCase() || "";
        const ak = f.answer.ko?.toLowerCase() || "";
        const ae = f.answer.en?.toLowerCase() || "";
        return qk.includes(s) || qe.includes(s) || ak.includes(s) || ae.includes(s);
      });
    }

    faqs.sort((a, b) => {
      if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
      if (a.level !== b.level) return a.level - b.level;
      if (a.order !== undefined && b.order !== undefined && a.order !== b.order) return a.order - b.order;
      if (a.createdAt && b.createdAt) return b.createdAt.getTime() - a.createdAt.getTime();
      return 0;
    });

    const lastDoc = hasMore && docs.length > 0 ? (docs[pageLimit - 1] as QueryDocSnap) : undefined;

    return { faqs, lastDoc, hasMore };
  } catch (error: any) {
    console.error("Error fetching FAQs with pagination:", error);
    if (error.message?.includes("timed out")) {
      console.error("Firestore 쿼리 타임아웃 - 환경 변수/네트워크 확인");
    }
    return { faqs: [], hasMore: false };
  }
}

// 단건 조회
export async function getFAQById(id: string): Promise<FAQ | null> {
  try {
    const faqRef = firestore.collection("faqs").doc(id);
    const faqSnap = await withTimeout<DocSnap>(faqRef.get(), 5000);
    if (!faqSnap.exists) return null;
    return mapFAQData(faqSnap);
  } catch (error) {
    console.error("Error fetching FAQ:", error);
    return null;
  }
}

// FAQ 생성/수정: Functions 환경에서는 사용하지 않음
export async function createFAQ(): Promise<string> {
  throw new Error("createFAQ는 Functions 환경에서 직접 사용되지 않습니다. API 라우터로 구현하세요.");
}
export async function updateFAQ(): Promise<void> {
  throw new Error("updateFAQ는 Functions 환경에서 직접 사용되지 않습니다. API 라우터로 구현하세요.");
}

// FAQ 삭제 (이미지 삭제 포함)
async function deleteImageFromStorage(fileName: string): Promise<void> {
  const bucket = admin.storage().bucket();
  const sizes = ["thumbnail", "medium", "large", "original"];
  await Promise.all(
    sizes.map((size) =>
      bucket.file(`images/${size}/${fileName}`).delete({ ignoreNotFound: true }).catch((err) => {
        if (err?.code !== 404) {
          console.warn(`[FAQ Delete] 이미지 삭제 실패: images/${size}/${fileName}`, err);
        }
      })
    )
  );
}

function extractImageUrls(content: string): string[] {
  const urls: string[] = [];
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const markdownImgRegex = /!\[.*?\]\((.*?)\)/gi;
  let m;
  while ((m = htmlImgRegex.exec(content)) !== null) urls.push(m[1]);
  while ((m = markdownImgRegex.exec(content)) !== null) urls.push(m[1]);
  return urls;
}

function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/images%2F(?:thumbnail|medium|large|original)%2F(.+?)(?:\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function deleteFAQ(id: string): Promise<void> {
  const faqRef = firestore.collection("faqs").doc(id);
  const faqSnap = await withTimeout<DocSnap>(faqRef.get(), 5000);

  if (faqSnap.exists) {
    const faqData = faqSnap.data() as any;
    const contentSources = [faqData?.answer?.ko, faqData?.answer?.en].filter(Boolean) as string[];
    const allImageUrls = new Set<string>();
    contentSources.forEach((c) => extractImageUrls(c).forEach((u) => allImageUrls.add(u)));

    try {
      await Promise.all(
        Array.from(allImageUrls).map(async (url) => {
          const fileName = extractFileNameFromUrl(url);
          if (fileName) await deleteImageFromStorage(fileName);
        })
      );
    } catch (err) {
      console.error("[FAQ Delete] 이미지 삭제 중 오류:", err);
    }
  }

  await withTimeout(faqRef.delete(), 5000);
}

// FAQ 순서 변경
export async function updateFAQOrder(id: string, order: number): Promise<void> {
  const faqRef = firestore.collection("faqs").doc(id);
  await withTimeout(
    faqRef.update({
      order,
      updatedAt: Timestamp.fromDate(new Date()),
    }),
    5000
  );
}

// 모든 해시태그 목록 조회
export async function getAllTags(): Promise<string[]> {
  try {
    const faqsRef = firestore.collection("faqs");
    const snap = await withTimeout<QuerySnap>(faqsRef.get(), 5000);

    const allTags = new Set<string>();
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data() as any;
      if (Array.isArray(data.tags)) {
        data.tags.forEach((t: string) => {
          if (typeof t === "string" && t.trim()) allTags.add(t.trim());
        });
      }
    });

    return Array.from(allTags).sort();
  } catch (error: any) {
    console.error("Error fetching all tags:", error);
    return [];
  }
}