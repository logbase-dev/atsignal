import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type * as FirebaseFirestore from "firebase-admin/firestore";
import { firestore, admin } from "../../firebase";
import type { WhatsNew } from "./types";

type LocalizedField = { ko: string; en?: string };

function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null) return value;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value;

  if (Array.isArray(value)) {
    return value.map((v) => stripUndefinedDeep(v)) as any;
  }

  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as any)) {
      if (v === undefined) continue;
      const next = stripUndefinedDeep(v);
      if (next === undefined) continue;
      out[k] = next;
    }
    return out as any;
  }

  return value;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

function normalizeLocalizedField(value: any): LocalizedField {
  if (!value) return { ko: "" };
  if (typeof value === "string") return { ko: value };
  if (typeof value === "object") {
    return {
      ko: typeof value.ko === "string" ? value.ko : "",
      en: typeof value.en === "string" ? value.en : undefined,
    };
  }
  return { ko: String(value) };
}

function normalizeEnabled(value: any): { ko: boolean; en: boolean } {
  if (value && typeof value === "object") {
    return {
      ko: Boolean(value.ko ?? true),
      en: Boolean(value.en ?? true),
    };
  }
  return { ko: true, en: true };
}

function mapWhatsNew(id: string, data: Record<string, any>): WhatsNew {
  return {
    id,
    title: normalizeLocalizedField(data.title),
    oneLiner: normalizeLocalizedField(data.oneLiner),
    content: normalizeLocalizedField(data.content),

    showInBanner: Boolean(data.showInBanner ?? false),
    bannerPriority: typeof data.bannerPriority === "number" ? data.bannerPriority : 999,

    displayStartAt: convertTimestamp(data.displayStartAt),
    displayEndAt: convertTimestamp(data.displayEndAt),

    published: Boolean(data.published),
    publishedAt: convertTimestamp(data.publishedAt),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),

    editorType: data.editorType === "toast" || data.editorType === "nextra" ? data.editorType : undefined,
    saveFormat: data.saveFormat === "markdown" || data.saveFormat === "html" ? data.saveFormat : undefined,

    enabled: normalizeEnabled(data.enabled),

    isTop: Boolean(data.isTop ?? false),

    views: typeof data.views === "number" ? data.views : 0,

    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

export async function getWhatsNews(options?: {
  page?: number;
  limit?: number;
  published?: boolean;
  showInBanner?: boolean;
  search?: string;
}): Promise<{ whatsnews: WhatsNew[]; total: number; page: number; limit: number; totalPages: number }> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const whatsnewsRef = firestore.collection("whatsnew");

    // 필터링
    let query: FirebaseFirestore.Query = whatsnewsRef;
    if (options?.published !== undefined) {
      query = query.where("published", "==", options.published);
      console.log("[getWhatsNews] 발행 상태 필터 적용:", options.published);
    }
    if (options?.showInBanner !== undefined) {
      query = query.where("showInBanner", "==", options.showInBanner);
      console.log("[getWhatsNews] 배너 노출 필터 적용:", options.showInBanner);
    }

    // 검색어 필터링을 위해 더 많은 데이터를 가져와서 필터링
    // (Firestore에서 텍스트 검색은 복잡하므로 클라이언트 측 필터링 사용)
    let whatsnews: WhatsNew[] = [];
    let total = 0;
    
    if (options?.search && options.search.trim()) {
      // 검색어가 있으면 더 많은 데이터를 가져와서 필터링
      console.log("[getWhatsNews] 검색어 필터 적용:", options.search);
      const searchSnap = await withTimeout(query.orderBy("createdAt", "desc").limit(1000).get(), 10000);
      let allWhatsNews = searchSnap.docs.map((d) => mapWhatsNew(d.id, d.data() as Record<string, any>));
      
      const searchLower = options.search.toLowerCase().trim();
      allWhatsNews = allWhatsNews.filter((whatsnew) => {
        const titleKo = (whatsnew.title?.ko || "").toLowerCase();
        const titleEn = (whatsnew.title?.en || "").toLowerCase();
        const contentKo = (whatsnew.content?.ko || "").toLowerCase();
        const contentEn = (whatsnew.content?.en || "").toLowerCase();
        const oneLinerKo = (whatsnew.oneLiner?.ko || "").toLowerCase();
        const oneLinerEn = (whatsnew.oneLiner?.en || "").toLowerCase();
        return (
          titleKo.includes(searchLower) ||
          titleEn.includes(searchLower) ||
          contentKo.includes(searchLower) ||
          contentEn.includes(searchLower) ||
          oneLinerKo.includes(searchLower) ||
          oneLinerEn.includes(searchLower)
        );
      });
      
      // 검색 필터링 후 총 개수 재계산
      total = allWhatsNews.length;
      
      // isTop 우선 정렬 (고정된 항목이 먼저, 그 다음 createdAt DESC)
      allWhatsNews.sort((a, b) => {
        if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate;
      });
      
      // 페이지네이션 적용
      const startIdx = offset;
      const endIdx = offset + limit;
      whatsnews = allWhatsNews.slice(startIdx, endIdx);
    } else {
      // 검색어가 없으면 기존 방식 사용
      // 총 개수 조회
      try {
        const countSnap = await withTimeout(query.count().get(), 5000);
        total = countSnap.data().count;
      } catch (countError) {
        console.warn("[getWhatsNews] count() not supported, using fallback method");
        const allSnap = await withTimeout(query.get(), 10000);
        total = allSnap.size;
      }

      // 페이지네이션 적용
      // isTop 우선 정렬을 위해 클라이언트 사이드에서 정렬
      // Firestore는 복합 인덱스가 필요하므로 일단 createdAt으로 정렬 후 클라이언트에서 재정렬
      const q = query.orderBy("createdAt", "desc").limit(limit * 2).offset(offset);
      const snap = await withTimeout(q.get(), 5000);
      whatsnews = snap.docs.map((d) => mapWhatsNew(d.id, d.data() as Record<string, any>));
      
      // isTop 우선 정렬 (고정된 항목이 먼저, 그 다음 createdAt DESC)
      whatsnews.sort((a, b) => {
        if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate;
      });
      
      // limit만큼만 반환
      whatsnews = whatsnews.slice(0, limit);
    }

    return {
      whatsnews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("[getWhatsNews] 에러:", error?.message || error);
    return {
      whatsnews: [],
      total: 0,
      page: options?.page || 1,
      limit: options?.limit || 20,
      totalPages: 0,
    };
  }
}

export async function getWhatsNewById(id: string): Promise<WhatsNew | null> {
  try {
    const docSnap = await withTimeout<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>(
      firestore.collection("whatsnew").doc(id).get(), 
      5000
    );
    if (!docSnap.exists) return null;
    return mapWhatsNew(docSnap.id, (docSnap.data() || {}) as Record<string, any>);
  } catch (error: any) {
    console.error("[getWhatsNewById] 에러:", error?.message || error);
    return null;
  }
}

export async function createWhatsNew(whatsnew: Omit<WhatsNew, "id">): Promise<string> {
  const now = Timestamp.fromDate(new Date());
  const data: Record<string, any> = {
    ...stripUndefinedDeep(whatsnew),
    showInBanner: whatsnew.showInBanner ?? false,
    bannerPriority: whatsnew.bannerPriority ?? 999,
    enabled: whatsnew.enabled ?? { ko: true, en: false },
    isTop: whatsnew.isTop ?? false,
    views: 0, // 조회수는 0으로 초기화
    createdAt: now,
    updatedAt: now,
    publishedAt: whatsnew.published ? now : null,
  };
  
  console.log(`[createWhatsNew] isTop 설정: ${data.isTop} (원본: ${whatsnew.isTop})`);
  
  // Date를 Timestamp로 변환
  if (whatsnew.displayStartAt instanceof Date) {
    data.displayStartAt = Timestamp.fromDate(whatsnew.displayStartAt);
  }
  if (whatsnew.displayEndAt instanceof Date) {
    data.displayEndAt = Timestamp.fromDate(whatsnew.displayEndAt);
  }
  
  console.log(`[createWhatsNew] 생성 데이터:`, JSON.stringify(data, null, 2));
  const docRef = await withTimeout<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>>(
    firestore.collection("whatsnew").add(data), 
    5000
  );
  return docRef.id;
}

export async function updateWhatsNew(id: string, patch: Partial<WhatsNew>): Promise<void> {
  const now = Timestamp.fromDate(new Date());
  
  console.log(`[updateWhatsNew] 입력 patch:`, JSON.stringify(patch, null, 2));
  console.log(`[updateWhatsNew] patch.isTop:`, patch.isTop, `(타입: ${typeof patch.isTop})`);
  
  // isTop은 stripUndefinedDeep 전에 별도로 처리 (false도 저장되도록 보장)
  const isTopValue = patch.isTop !== undefined ? Boolean(patch.isTop) : undefined;
  console.log(`[updateWhatsNew] isTopValue 추출:`, isTopValue);
  
  const updateData: Record<string, any> = { ...stripUndefinedDeep(patch), updatedAt: now };
  console.log(`[updateWhatsNew] stripUndefinedDeep 후 updateData:`, JSON.stringify(updateData, null, 2));
  
  // views는 수정 시 변경하지 않음 (웹앱에서만 증가)
  delete updateData.views;
  // createdBy는 수정 시 변경하지 않음 (생성 시에만 설정)
  delete updateData.createdBy;
  if (patch.published !== undefined) updateData.publishedAt = patch.published ? now : null;
  
  // isTop이 undefined가 아닐 때 명시적으로 설정 (false도 저장되도록 보장)
  if (isTopValue !== undefined) {
    updateData.isTop = isTopValue;
    console.log(`[updateWhatsNew] isTop 명시적 설정: ${updateData.isTop} (원본: ${patch.isTop})`);
  } else {
    console.log(`[updateWhatsNew] isTop이 undefined이므로 설정하지 않음`);
  }
  
  // Date를 Timestamp로 변환
  if (patch.displayStartAt instanceof Date) {
    updateData.displayStartAt = Timestamp.fromDate(patch.displayStartAt);
  }
  if (patch.displayEndAt instanceof Date) {
    updateData.displayEndAt = Timestamp.fromDate(patch.displayEndAt);
  }
  
  console.log(`[updateWhatsNew] 최종 업데이트 데이터:`, JSON.stringify(updateData, null, 2));
  console.log(`[updateWhatsNew] isTop 필드 존재 여부:`, 'isTop' in updateData, `값:`, updateData.isTop);
  console.log(`[updateWhatsNew] Firestore 업데이트 시작 - 문서 ID: ${id}`);
  
  await withTimeout(firestore.collection("whatsnew").doc(id).update(updateData), 5000);
  
  console.log(`[updateWhatsNew] Firestore 업데이트 완료`);
}

export async function incrementWhatsNewViews(id: string): Promise<void> {
  try {
    const docRef = firestore.collection("whatsnew").doc(id);
    await withTimeout(
      docRef.update({
        views: FieldValue.increment(1),
      }),
      5000
    );
  } catch (error: any) {
    console.error("[incrementWhatsNewViews] 에러:", error?.message || error);
    throw error;
  }
}

// 이미지 삭제 헬퍼 함수
async function deleteImageFromStorage(fileName: string, pathPrefix: string): Promise<void> {
  const bucket = admin.storage().bucket();
  try {
    await bucket.file(`${pathPrefix}/${fileName}`).delete({ ignoreNotFound: true });
  } catch (err: any) {
    if (err?.code !== 404) {
      console.warn(`[WhatsNew Delete] 이미지 삭제 실패: ${pathPrefix}/${fileName}`, err);
    }
  }
}

// 에디터 이미지 삭제 (여러 사이즈)
async function deleteEditorImage(fileName: string): Promise<void> {
  const sizes = ["original", "thumbnail", "medium", "large"];
  await Promise.all(
    sizes.map((size) => deleteImageFromStorage(fileName, `images/editor/${size}`))
  );
  // 구 경로 호환성: images/{size}/{fileName} (기존 데이터용)
  await Promise.all(
    sizes.map((size) => deleteImageFromStorage(fileName, `images/${size}`))
  );
}

// 콘텐츠에서 이미지 URL 추출
function extractImageUrls(content: string): string[] {
  const urls: string[] = [];
  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const markdownImgRegex = /!\[.*?\]\((.*?)\)/gi;
  let m;
  while ((m = htmlImgRegex.exec(content)) !== null) urls.push(m[1]);
  while ((m = markdownImgRegex.exec(content)) !== null) urls.push(m[1]);
  return urls;
}

// URL에서 파일명 추출 (새로운 경로 구조에 맞게)
function extractFileNameFromUrl(url: string): { fileName: string; type: 'editor' } | null {
  try {
    const urlObj = new URL(url);
    // 새 경로 구조: images/editor/{size}/{fileName}
    const editorMatch = urlObj.pathname.match(/images%2Feditor%2F(?:original|thumbnail|medium|large)%2F(.+?)(?:\?|$)/);
    if (editorMatch) {
      return { fileName: decodeURIComponent(editorMatch[1]), type: 'editor' };
    }
    // 구 경로 구조 호환성: images/{size}/{fileName}
    const legacyMatch = urlObj.pathname.match(/images%2F(?:thumbnail|medium|large|original)%2F(.+?)(?:\?|$)/);
    if (legacyMatch) {
      return { fileName: decodeURIComponent(legacyMatch[1]), type: 'editor' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteWhatsNew(id: string): Promise<void> {
  const whatsnewRef = firestore.collection("whatsnew").doc(id);
  const whatsnewSnap = await withTimeout(whatsnewRef.get(), 5000);

  if (whatsnewSnap.exists) {
    const whatsnewData = whatsnewSnap.data() as any;
    
    // 본문에서 에디터 이미지 추출 및 삭제
    const contentSources = [whatsnewData?.content?.ko, whatsnewData?.content?.en].filter(Boolean) as string[];
    const allImageUrls = new Set<string>();
    contentSources.forEach((c) => extractImageUrls(c).forEach((u) => allImageUrls.add(u)));

    try {
      await Promise.all(
        Array.from(allImageUrls).map(async (url) => {
          const result = extractFileNameFromUrl(url);
          if (result && result.type === 'editor') {
            await deleteEditorImage(result.fileName);
          }
        })
      );
    } catch (err) {
      console.error("[WhatsNew Delete] 에디터 이미지 삭제 중 오류:", err);
    }
  }

  // Firestore 문서 삭제
  await withTimeout(whatsnewRef.delete(), 5000);
}

// 배너 노출용 What's new 조회
export async function getBannerWhatsNews(locale: "ko" | "en" = "ko"): Promise<WhatsNew[]> {
  try {
    const now = new Date();
    const whatsnewsRef = firestore.collection("whatsnew");

    // 배너 노출 조건: showInBanner=true, published=true, enabled[locale]=true
    let query: FirebaseFirestore.Query = whatsnewsRef
      .where("showInBanner", "==", true)
      .where("published", "==", true)
      .where(`enabled.${locale}`, "==", true);

    const snap = await withTimeout(query.get(), 5000);
    const whatsnews = snap.docs
      .map((d) => mapWhatsNew(d.id, d.data() as Record<string, any>))
      .filter((whatsnew) => {
        // 노출 기간 체크
        if (whatsnew.displayStartAt && whatsnew.displayStartAt > now) return false;
        if (whatsnew.displayEndAt && whatsnew.displayEndAt < now) return false;
        return true;
      })
      .sort((a, b) => {
        // bannerPriority ASC, publishedAt DESC
        if (a.bannerPriority !== b.bannerPriority) {
          return a.bannerPriority - b.bannerPriority;
        }
        const aDate = a.publishedAt?.getTime() || 0;
        const bDate = b.publishedAt?.getTime() || 0;
        return bDate - aDate;
      });

    return whatsnews;
  } catch (error: any) {
    console.error("[getBannerWhatsNews] 에러:", error?.message || error);
    return [];
  }
}

