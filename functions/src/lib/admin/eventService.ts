import { Timestamp, FieldValue, FieldPath } from "firebase-admin/firestore";
import type * as FirebaseFirestore from "firebase-admin/firestore";
import { firestore, admin } from "../../firebase";
import type { Event } from "./types";

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

function mapEvent(id: string, data: Record<string, any>): Event {
  return {
    id,
    title: normalizeLocalizedField(data.title),
    oneLiner: normalizeLocalizedField(data.oneLiner),
    content: normalizeLocalizedField(data.content),

    featuredImage: typeof data.featuredImage === "string" ? data.featuredImage : undefined,
    thumbnailImage: typeof data.thumbnailImage === "string" ? data.thumbnailImage : undefined,

    showInBanner: Boolean(data.showInBanner ?? false),
    bannerPriority: typeof data.bannerPriority === "number" ? data.bannerPriority : 999,

    startDate: convertTimestamp(data.startDate || data.eventStartAt),
    endDate: convertTimestamp(data.endDate || data.eventEndAt),
    eventStartAt: convertTimestamp(data.eventStartAt),
    eventEndAt: convertTimestamp(data.eventEndAt),
    displayStartAt: convertTimestamp(data.displayStartAt),
    displayEndAt: convertTimestamp(data.displayEndAt),

    published: Boolean(data.published),
    publishedAt: convertTimestamp(data.publishedAt),
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),

    editorType: data.editorType === "toast" || data.editorType === "nextra" ? data.editorType : undefined,
    saveFormat: data.saveFormat === "markdown" || data.saveFormat === "html" ? data.saveFormat : undefined,

    enabled: normalizeEnabled(data.enabled),

    isMainEvent: Boolean(data.isMainEvent ?? false),
    subEventOrder: typeof data.subEventOrder === "number" && [1, 2, 3].includes(data.subEventOrder) ? data.subEventOrder : null,

    hasCtaButton: Boolean(data.hasCtaButton ?? false),
    ctaButtonText: data.ctaButtonText ? normalizeLocalizedField(data.ctaButtonText) : undefined,

    views: typeof data.views === "number" ? data.views : 0,

    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    updatedBy: data.updatedBy ? String(data.updatedBy) : undefined,
  };
}

export async function getEvents(options?: {
  page?: number;
  limit?: number;
  published?: boolean;
  showInBanner?: boolean;
  hasCtaButton?: boolean;
  search?: string;
}): Promise<{ events: Event[]; total: number; page: number; limit: number; totalPages: number }> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    const eventsRef = firestore.collection("events");

    // 필터링
    let query: FirebaseFirestore.Query = eventsRef;
    if (options?.published !== undefined) {
      query = query.where("published", "==", options.published);
      console.log("[getEvents] 발행 상태 필터 적용:", options.published);
    }
    if (options?.showInBanner !== undefined) {
      query = query.where("showInBanner", "==", options.showInBanner);
      console.log("[getEvents] 배너 노출 필터 적용:", options.showInBanner);
    }
    if (options?.hasCtaButton !== undefined) {
      query = query.where("hasCtaButton", "==", options.hasCtaButton);
      console.log("[getEvents] CTA 버튼 필터 적용:", options.hasCtaButton);
    }

    // 검색어 필터링을 위해 더 많은 데이터를 가져와서 필터링
    let events: Event[] = [];
    let total = 0;
    
    if (options?.search && options.search.trim()) {
      // 검색어가 있으면 더 많은 데이터를 가져와서 필터링
      console.log("[getEvents] 검색어 필터 적용:", options.search);
      const searchSnap = await withTimeout(query.orderBy("createdAt", "desc").limit(1000).get(), 10000);
      let allEvents = searchSnap.docs.map((d) => mapEvent(d.id, d.data() as Record<string, any>));
      
      const searchLower = options.search.toLowerCase().trim();
      allEvents = allEvents.filter((event) => {
        const titleKo = (event.title?.ko || "").toLowerCase();
        const titleEn = (event.title?.en || "").toLowerCase();
        const contentKo = (event.content?.ko || "").toLowerCase();
        const contentEn = (event.content?.en || "").toLowerCase();
        const oneLinerKo = (event.oneLiner?.ko || "").toLowerCase();
        const oneLinerEn = (event.oneLiner?.en || "").toLowerCase();
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
      total = allEvents.length;
      
      // 정렬: createdAt DESC (메인/서브 이벤트는 목록 페이지에서 별도 처리)
      allEvents.sort((a, b) => {
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate;
      });
      
      // 페이지네이션 적용
      const startIdx = offset;
      const endIdx = offset + limit;
      events = allEvents.slice(startIdx, endIdx);
    } else {
      // 검색어가 없으면 기존 방식 사용
      // 총 개수 조회
      try {
        const countSnap = await withTimeout(query.count().get(), 5000);
        total = countSnap.data().count;
      } catch (countError) {
        console.warn("[getEvents] count() not supported, using fallback method");
        const allSnap = await withTimeout(query.get(), 10000);
        total = allSnap.size;
      }

      // 페이지네이션 적용
      // 정렬을 위해 클라이언트 사이드에서 정렬
      const q = query.orderBy("createdAt", "desc").limit(limit * 2).offset(offset);
      const snap = await withTimeout(q.get(), 5000);
      events = snap.docs.map((d) => mapEvent(d.id, d.data() as Record<string, any>));
      
      // 정렬: createdAt DESC (메인/서브 이벤트는 목록 페이지에서 별도 처리)
      events.sort((a, b) => {
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate;
      });
      
      // limit만큼만 반환
      events = events.slice(0, limit);
    }

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error("[getEvents] 에러:", error?.message || error);
    return {
      events: [],
      total: 0,
      page: options?.page || 1,
      limit: options?.limit || 20,
      totalPages: 0,
    };
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const docSnap = await withTimeout<FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>>(
      firestore.collection("events").doc(id).get(), 
      5000
    );
    if (!docSnap.exists) return null;
    return mapEvent(docSnap.id, (docSnap.data() || {}) as Record<string, any>);
  } catch (error: any) {
    console.error("[getEventById] 에러:", error?.message || error);
    return null;
  }
}

export async function createEvent(event: Omit<Event, "id">): Promise<string> {
  const now = Timestamp.fromDate(new Date());
  const data: Record<string, any> = {
    ...stripUndefinedDeep(event),
    showInBanner: event.showInBanner ?? false,
    bannerPriority: event.bannerPriority ?? 999,
    enabled: event.enabled ?? { ko: true, en: false },
    isMainEvent: event.isMainEvent ?? false,
    subEventOrder: event.subEventOrder && [1, 2, 3].includes(event.subEventOrder) ? event.subEventOrder : null,
    hasCtaButton: event.hasCtaButton ?? false,
    views: 0, // 조회수는 0으로 초기화
    createdAt: now,
    updatedAt: now,
    publishedAt: event.published ? now : null,
  };
  
  console.log(`[createEvent] 생성 데이터:`, JSON.stringify(data, null, 2));
  
  // Date를 Timestamp로 변환
  if (event.startDate instanceof Date) {
    data.startDate = Timestamp.fromDate(event.startDate);
  } else if (event.eventStartAt instanceof Date) {
    data.startDate = Timestamp.fromDate(event.eventStartAt);
  }
  if (event.endDate instanceof Date) {
    data.endDate = Timestamp.fromDate(event.endDate);
  } else if (event.eventEndAt instanceof Date) {
    data.endDate = Timestamp.fromDate(event.eventEndAt);
  }
  if (event.eventStartAt instanceof Date) {
    data.eventStartAt = Timestamp.fromDate(event.eventStartAt);
  }
  if (event.eventEndAt instanceof Date) {
    data.eventEndAt = Timestamp.fromDate(event.eventEndAt);
  }
  if (event.displayStartAt instanceof Date) {
    data.displayStartAt = Timestamp.fromDate(event.displayStartAt);
  }
  if (event.displayEndAt instanceof Date) {
    data.displayEndAt = Timestamp.fromDate(event.displayEndAt);
  }
  
  // 메인 이벤트 자동 해제: 새로 메인으로 설정하면 기존 메인 이벤트 해제
  if (event.isMainEvent) {
    try {
      const existingMainSnap = await withTimeout(
        firestore.collection("events").where("isMainEvent", "==", true).limit(1).get(),
        5000
      );
      if (!existingMainSnap.empty) {
        const existingMainId = existingMainSnap.docs[0].id;
        await withTimeout(
          firestore.collection("events").doc(existingMainId).update({ isMainEvent: false }),
          5000
        );
        console.log(`[createEvent] 기존 메인 이벤트 해제: ${existingMainId}`);
      }
    } catch (err) {
      console.error("[createEvent] 메인 이벤트 해제 실패:", err);
    }
  }

  // 서브 이벤트 자동 교체: 새로 서브로 설정하면 기존 서브 이벤트 해제
  if (event.subEventOrder && [1, 2, 3].includes(event.subEventOrder)) {
    try {
      const existingSubSnap = await withTimeout(
        firestore.collection("events").where("subEventOrder", "==", event.subEventOrder).limit(1).get(),
        5000
      );
      if (!existingSubSnap.empty) {
        const existingSubId = existingSubSnap.docs[0].id;
        await withTimeout(
          firestore.collection("events").doc(existingSubId).update({ subEventOrder: null }),
          5000
        );
        console.log(`[createEvent] 기존 서브 이벤트 해제: ${existingSubId} (순서: ${event.subEventOrder})`);
      }
    } catch (err) {
      console.error("[createEvent] 서브 이벤트 해제 실패:", err);
    }
  }

  const docRef = await withTimeout<FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>>(
    firestore.collection("events").add(data), 
    5000
  );
  return docRef.id;
}

export async function updateEvent(id: string, patch: Partial<Event>): Promise<void> {
  const now = Timestamp.fromDate(new Date());
  
  console.log(`[updateEvent] 입력 patch:`, JSON.stringify(patch, null, 2));
  
  const updateData: Record<string, any> = { ...stripUndefinedDeep(patch), updatedAt: now };
  
  // views는 수정 시 변경하지 않음 (웹앱에서만 증가)
  delete updateData.views;
  // createdBy는 수정 시 변경하지 않음 (생성 시에만 설정)
  delete updateData.createdBy;
  if (patch.published !== undefined) updateData.publishedAt = patch.published ? now : null;
  
  // Date를 Timestamp로 변환
  if (patch.eventStartAt instanceof Date) {
    updateData.eventStartAt = Timestamp.fromDate(patch.eventStartAt);
  }
  if (patch.eventEndAt instanceof Date) {
    updateData.eventEndAt = Timestamp.fromDate(patch.eventEndAt);
  }
  if (patch.displayStartAt instanceof Date) {
    updateData.displayStartAt = Timestamp.fromDate(patch.displayStartAt);
  }
  if (patch.displayEndAt instanceof Date) {
    updateData.displayEndAt = Timestamp.fromDate(patch.displayEndAt);
  }

  // 메인 이벤트 자동 해제: 새로 메인으로 설정하면 기존 메인 이벤트 해제
  if (patch.isMainEvent === true) {
    try {
      const existingMainSnap = await withTimeout(
        firestore.collection("events").where("isMainEvent", "==", true).where(FieldPath.documentId(), "!=", id).limit(1).get(),
        5000
      );
      if (!existingMainSnap.empty) {
        const existingMainId = existingMainSnap.docs[0].id;
        await withTimeout(
          firestore.collection("events").doc(existingMainId).update({ isMainEvent: false }),
          5000
        );
        console.log(`[updateEvent] 기존 메인 이벤트 해제: ${existingMainId}`);
      }
    } catch (err) {
      console.error("[updateEvent] 메인 이벤트 해제 실패:", err);
    }
  }

  // 서브 이벤트 자동 교체: 새로 서브로 설정하면 기존 서브 이벤트 해제
  if (patch.subEventOrder !== undefined && patch.subEventOrder !== null && [1, 2, 3].includes(patch.subEventOrder)) {
    try {
      const existingSubSnap = await withTimeout(
        firestore.collection("events").where("subEventOrder", "==", patch.subEventOrder).where(FieldPath.documentId(), "!=", id).limit(1).get(),
        5000
      );
      if (!existingSubSnap.empty) {
        const existingSubId = existingSubSnap.docs[0].id;
        await withTimeout(
          firestore.collection("events").doc(existingSubId).update({ subEventOrder: null }),
          5000
        );
        console.log(`[updateEvent] 기존 서브 이벤트 해제: ${existingSubId} (순서: ${patch.subEventOrder})`);
      }
    } catch (err) {
      console.error("[updateEvent] 서브 이벤트 해제 실패:", err);
    }
  }
  
  console.log(`[updateEvent] 최종 업데이트 데이터:`, JSON.stringify(updateData, null, 2));
  
  await withTimeout(firestore.collection("events").doc(id).update(updateData), 5000);
}

export async function incrementEventViews(id: string): Promise<void> {
  try {
    const docRef = firestore.collection("events").doc(id);
    await withTimeout(
      docRef.update({
        views: FieldValue.increment(1),
      }),
      5000
    );
  } catch (error: any) {
    console.error("[incrementEventViews] 에러:", error?.message || error);
    throw error;
  }
}

// 이미지 삭제 헬퍼 함수
async function deleteImageFromStorage(path: string): Promise<void> {
  const bucket = admin.storage().bucket();
  try {
    await bucket.file(path).delete({ ignoreNotFound: true });
  } catch (err: any) {
    if (err?.code !== 404) {
      console.warn(`[Event Delete] 이미지 삭제 실패: ${path}`, err);
    }
  }
}

// URL에서 Storage 경로 추출
function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Firebase Storage URL 형식: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
    const match = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch {
    return null;
  }
}

// 에디터 이미지 삭제 (여러 사이즈)
async function deleteEditorImage(fileName: string): Promise<void> {
  const sizes = ["original", "thumbnail", "medium", "large"];
  await Promise.all(
    sizes.map((size) => deleteImageFromStorage(`images/editor/${size}/${fileName}`))
  );
  // 구 경로 호환성: images/{size}/{fileName} (기존 데이터용)
  await Promise.all(
    sizes.map((size) => deleteImageFromStorage(`images/${size}/${fileName}`))
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

// URL에서 파일명 추출 (에디터 이미지용)
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

export async function deleteEvent(id: string): Promise<void> {
  const eventRef = firestore.collection("events").doc(id);
  const eventSnap = await withTimeout(eventRef.get(), 5000);

  if (eventSnap.exists) {
    const eventData = eventSnap.data() as any;
    
    // 본문에서 에디터 이미지 추출 및 삭제
    const contentSources = [eventData?.content?.ko, eventData?.content?.en].filter(Boolean) as string[];
    const allImageUrls = new Set<string>();
    contentSources.forEach((c) => extractImageUrls(c).forEach((u) => allImageUrls.add(u)));

    try {
      // 에디터 이미지 삭제
      await Promise.all(
        Array.from(allImageUrls).map(async (url) => {
          const result = extractFileNameFromUrl(url);
          if (result && result.type === 'editor') {
            await deleteEditorImage(result.fileName);
          }
        })
      );
    } catch (err) {
      console.error("[Event Delete] 에디터 이미지 삭제 중 오류:", err);
    }

    // featuredImage 삭제
    if (eventData.featuredImage) {
      try {
        const path = extractStoragePathFromUrl(eventData.featuredImage);
        if (path) {
          await deleteImageFromStorage(path);
        }
      } catch (err) {
        console.error("[Event Delete] 대표 이미지 삭제 중 오류:", err);
      }
    }

    // thumbnailImage 삭제
    if (eventData.thumbnailImage) {
      try {
        const path = extractStoragePathFromUrl(eventData.thumbnailImage);
        if (path) {
          await deleteImageFromStorage(path);
        }
      } catch (err) {
        console.error("[Event Delete] 썸네일 이미지 삭제 중 오류:", err);
      }
    }
  }

  // Firestore 문서 삭제
  await withTimeout(eventRef.delete(), 5000);
}

// 배너 노출용 이벤트 조회
export async function getBannerEvents(locale: "ko" | "en" = "ko"): Promise<Event[]> {
  try {
    const now = new Date();
    const eventsRef = firestore.collection("events");

    // 배너 노출 조건: showInBanner=true, published=true, enabled[locale]=true
    let query: FirebaseFirestore.Query = eventsRef
      .where("showInBanner", "==", true)
      .where("published", "==", true)
      .where(`enabled.${locale}`, "==", true);

    const snap = await withTimeout(query.get(), 5000);
    const events = snap.docs
      .map((d) => mapEvent(d.id, d.data() as Record<string, any>))
      .filter((event) => {
        // 노출 기간 체크
        if (event.displayStartAt && event.displayStartAt > now) return false;
        if (event.displayEndAt && event.displayEndAt < now) return false;
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

    return events;
  } catch (error: any) {
    console.error("[getBannerEvents] 에러:", error?.message || error);
    return [];
  }
}

