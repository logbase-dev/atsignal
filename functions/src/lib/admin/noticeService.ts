import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type * as FirebaseFirestore from "firebase-admin/firestore";
import { firestore } from "../../firebase";
import type { Notice } from "./types";

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

function mapNotice(id: string, data: Record<string, any>): Notice {
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

export async function getNotices(options?: {
  page?: number;
  limit?: number;
  published?: boolean;
  showInBanner?: boolean;
  search?: string;
}): Promise<{ notices: Notice[]; total: number; page: number; limit: number; totalPages: number }> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const noticesRef = firestore.collection("notices");

    // 필터링
    let query: FirebaseFirestore.Query = noticesRef;
    if (options?.published !== undefined) {
      query = query.where("published", "==", options.published);
      console.log("[getNotices] 발행 상태 필터 적용:", options.published);
    }
    if (options?.showInBanner !== undefined) {
      query = query.where("showInBanner", "==", options.showInBanner);
      console.log("[getNotices] 배너 노출 필터 적용:", options.showInBanner);
    }

    // 검색어 필터링을 위해 더 많은 데이터를 가져와서 필터링
    // (Firestore에서 텍스트 검색은 복잡하므로 클라이언트 측 필터링 사용)
    let notices: Notice[] = [];
    let total = 0;
    
    if (options?.search && options.search.trim()) {
      // 검색어가 있으면 더 많은 데이터를 가져와서 필터링
      console.log("[getNotices] 검색어 필터 적용:", options.search);
      const searchSnap = await withTimeout(query.orderBy("createdAt", "desc").limit(1000).get(), 10000);
      let allNotices = searchSnap.docs.map((d) => mapNotice(d.id, d.data() as Record<string, any>));
      
      const searchLower = options.search.toLowerCase().trim();
      allNotices = allNotices.filter((notice) => {
        const titleKo = (notice.title?.ko || "").toLowerCase();
        const titleEn = (notice.title?.en || "").toLowerCase();
        const contentKo = (notice.content?.ko || "").toLowerCase();
        const contentEn = (notice.content?.en || "").toLowerCase();
        const oneLinerKo = (notice.oneLiner?.ko || "").toLowerCase();
        const oneLinerEn = (notice.oneLiner?.en || "").toLowerCase();
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
      total = allNotices.length;
      
      // isTop 우선 정렬 (고정된 항목이 먼저, 그 다음 createdAt DESC)
      allNotices.sort((a, b) => {
        if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate;
      });
      
      // 페이지네이션 적용
      const startIdx = offset;
      const endIdx = offset + limit;
      notices = allNotices.slice(startIdx, endIdx);
    } else {
      // 검색어가 없으면 기존 방식 사용
      // 총 개수 조회
      try {
        const countSnap = await withTimeout(query.count().get(), 5000);
        total = countSnap.data().count;
      } catch (countError) {
        console.warn("[getNotices] count() not supported, using fallback method");
        const allSnap = await withTimeout(query.get(), 10000);
        total = allSnap.size;
      }

      // 페이지네이션 적용
      // isTop 우선 정렬을 위해 클라이언트 사이드에서 정렬
      // Firestore는 복합 인덱스가 필요하므로 일단 createdAt으로 정렬 후 클라이언트에서 재정렬
      const q = query.orderBy("createdAt", "desc").limit(limit * 2).offset(offset);
      const snap = await withTimeout(q.get(), 5000);
      notices = snap.docs.map((d) => mapNotice(d.id, d.data() as Record<string, any>));
      
      // isTop 우선 정렬 (고정된 항목이 먼저, 그 다음 createdAt DESC)
      notices.sort((a, b) => {
        if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate;
      });
      
      // limit만큼만 반환
      notices = notices.slice(0, limit);
    }

    return {
      notices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("[getNotices] 에러:", error?.message || error);
    return {
      notices: [],
      total: 0,
      page: options?.page || 1,
      limit: options?.limit || 20,
      totalPages: 0,
    };
  }
}

export async function getNoticeById(id: string): Promise<Notice | null> {
  try {
    const docSnap = await withTimeout<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>(
      firestore.collection("notices").doc(id).get(), 
      5000
    );
    if (!docSnap.exists) return null;
    return mapNotice(docSnap.id, (docSnap.data() || {}) as Record<string, any>);
  } catch (error: any) {
    console.error("[getNoticeById] 에러:", error?.message || error);
    return null;
  }
}

export async function createNotice(notice: Omit<Notice, "id">): Promise<string> {
  const now = Timestamp.fromDate(new Date());
  const data: Record<string, any> = {
    ...stripUndefinedDeep(notice),
    showInBanner: notice.showInBanner ?? false,
    bannerPriority: notice.bannerPriority ?? 999,
    enabled: notice.enabled ?? { ko: true, en: false },
    isTop: notice.isTop ?? false,
    views: 0, // 조회수는 0으로 초기화
    createdAt: now,
    updatedAt: now,
    publishedAt: notice.published ? now : null,
  };
  
  console.log(`[createNotice] isTop 설정: ${data.isTop} (원본: ${notice.isTop})`);
  
  // Date를 Timestamp로 변환
  if (notice.displayStartAt instanceof Date) {
    data.displayStartAt = Timestamp.fromDate(notice.displayStartAt);
  }
  if (notice.displayEndAt instanceof Date) {
    data.displayEndAt = Timestamp.fromDate(notice.displayEndAt);
  }
  
  console.log(`[createNotice] 생성 데이터:`, JSON.stringify(data, null, 2));
  const docRef = await withTimeout<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>>(
    firestore.collection("notices").add(data), 
    5000
  );
  return docRef.id;
}

export async function updateNotice(id: string, patch: Partial<Notice>): Promise<void> {
  const now = Timestamp.fromDate(new Date());
  
  console.log(`[updateNotice] 입력 patch:`, JSON.stringify(patch, null, 2));
  console.log(`[updateNotice] patch.isTop:`, patch.isTop, `(타입: ${typeof patch.isTop})`);
  
  // isTop은 stripUndefinedDeep 전에 별도로 처리 (false도 저장되도록 보장)
  const isTopValue = patch.isTop !== undefined ? Boolean(patch.isTop) : undefined;
  console.log(`[updateNotice] isTopValue 추출:`, isTopValue);
  
  const updateData: Record<string, any> = { ...stripUndefinedDeep(patch), updatedAt: now };
  console.log(`[updateNotice] stripUndefinedDeep 후 updateData:`, JSON.stringify(updateData, null, 2));
  
  // views는 수정 시 변경하지 않음 (웹앱에서만 증가)
  delete updateData.views;
  // createdBy는 수정 시 변경하지 않음 (생성 시에만 설정)
  delete updateData.createdBy;
  if (patch.published !== undefined) updateData.publishedAt = patch.published ? now : null;
  
  // isTop이 undefined가 아닐 때 명시적으로 설정 (false도 저장되도록 보장)
  if (isTopValue !== undefined) {
    updateData.isTop = isTopValue;
    console.log(`[updateNotice] isTop 명시적 설정: ${updateData.isTop} (원본: ${patch.isTop})`);
  } else {
    console.log(`[updateNotice] isTop이 undefined이므로 설정하지 않음`);
  }
  
  // Date를 Timestamp로 변환
  if (patch.displayStartAt instanceof Date) {
    updateData.displayStartAt = Timestamp.fromDate(patch.displayStartAt);
  }
  if (patch.displayEndAt instanceof Date) {
    updateData.displayEndAt = Timestamp.fromDate(patch.displayEndAt);
  }
  
  console.log(`[updateNotice] 최종 업데이트 데이터:`, JSON.stringify(updateData, null, 2));
  console.log(`[updateNotice] isTop 필드 존재 여부:`, 'isTop' in updateData, `값:`, updateData.isTop);
  console.log(`[updateNotice] Firestore 업데이트 시작 - 문서 ID: ${id}`);
  
  await withTimeout(firestore.collection("notices").doc(id).update(updateData), 5000);
  
  console.log(`[updateNotice] Firestore 업데이트 완료`);
}

export async function incrementNoticeViews(id: string): Promise<void> {
  try {
    const docRef = firestore.collection("notices").doc(id);
    await withTimeout(
      docRef.update({
        views: FieldValue.increment(1),
      }),
      5000
    );
  } catch (error: any) {
    console.error("[incrementNoticeViews] 에러:", error?.message || error);
    throw error;
  }
}

export async function deleteNotice(id: string): Promise<void> {
  await withTimeout(firestore.collection("notices").doc(id).delete(), 5000);
}

// 배너 노출용 공지사항 조회
export async function getBannerNotices(locale: "ko" | "en" = "ko"): Promise<Notice[]> {
  try {
    const now = new Date();
    const noticesRef = firestore.collection("notices");

    // 배너 노출 조건: showInBanner=true, published=true, enabled[locale]=true
    let query: FirebaseFirestore.Query = noticesRef
      .where("showInBanner", "==", true)
      .where("published", "==", true)
      .where(`enabled.${locale}`, "==", true);

    const snap = await withTimeout(query.get(), 5000);
    const notices = snap.docs
      .map((d) => mapNotice(d.id, d.data() as Record<string, any>))
      .filter((notice) => {
        // 노출 기간 체크
        if (notice.displayStartAt && notice.displayStartAt > now) return false;
        if (notice.displayEndAt && notice.displayEndAt < now) return false;
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

    return notices;
  } catch (error: any) {
    console.error("[getBannerNotices] 에러:", error?.message || error);
    return [];
  }
}

