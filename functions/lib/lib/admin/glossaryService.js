"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateInitialLetter = calculateInitialLetter;
exports.getGlossaries = getGlossaries;
exports.getGlossaryById = getGlossaryById;
exports.createGlossary = createGlossary;
exports.updateGlossary = updateGlossary;
exports.deleteGlossary = deleteGlossary;
exports.incrementGlossaryViews = incrementGlossaryViews;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore");
// 타임아웃 헬퍼
function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)),
    ]);
}
// Timestamp → Date 변환
function convertTimestamp(value) {
    if (!value)
        return undefined;
    if (value instanceof firebase_1.admin.firestore.Timestamp)
        return value.toDate();
    if (value?.toDate instanceof Function)
        return value.toDate();
    if (value instanceof Date)
        return value;
    return undefined;
}
// LocalizedField 정규화
function normalizeLocalizedField(field) {
    if (!field)
        return { ko: "" };
    return { ko: field.ko ?? "", ...(field.en ? { en: field.en } : {}) };
}
// RelatedLink 정규화
function normalizeRelatedLink(link) {
    if (!link || !link.url)
        return undefined;
    return {
        url: String(link.url),
        title: link.title ? String(link.title) : undefined,
        linkType: link.linkType || "docs",
    };
}
// 한글 초성 매핑 함수
function getInitialLetterFromKorean(text) {
    if (!text || text.length === 0)
        return "A";
    const firstChar = text.charAt(0);
    const charCode = firstChar.charCodeAt(0);
    // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3 (가 ~ 힣)
    if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
        const initialCode = Math.floor((charCode - 0xAC00) / 588);
        // 초성: ㄱ(0), ㄲ(1), ㄴ(2), ㄷ(3), ㄸ(4), ㄹ(5), ㅁ(6), ㅂ(7), ㅃ(8), ㅅ(9), ㅆ(10), ㅇ(11), ㅈ(12), ㅉ(13), ㅊ(14), ㅋ(15), ㅌ(16), ㅍ(17), ㅎ(18)
        const initialMap = {
            0: "G", 1: "K", 2: "N", 3: "D", 4: "T", 5: "R", 6: "M", 7: "B", 8: "P", 9: "S",
            10: "S", 11: "A", 12: "J", 13: "C", 14: "C", 15: "K", 16: "T", 17: "P", 18: "H"
        };
        return initialMap[initialCode] || "A";
    }
    // 영문자인 경우 대문자로 변환
    if (/[a-zA-Z]/.test(firstChar)) {
        return firstChar.toUpperCase();
    }
    // 숫자나 기타 문자는 "A"로 매핑
    return "A";
}
// initialLetter 자동 계산 함수
function calculateInitialLetter(term, locale = "ko") {
    const termText = locale === "ko" ? term.ko : (term.en || term.ko);
    if (!termText || termText.trim().length === 0)
        return "A";
    const firstChar = termText.trim().charAt(0);
    // 영문자인 경우
    if (/[a-zA-Z]/.test(firstChar)) {
        return firstChar.toUpperCase();
    }
    // 한글인 경우
    if (/[가-힣]/.test(firstChar)) {
        return getInitialLetterFromKorean(firstChar);
    }
    // 숫자나 기타 문자
    return "A";
}
// Glossary 매핑
function mapGlossaryData(doc) {
    const data = doc.data();
    return {
        id: doc.id,
        term: normalizeLocalizedField(data.term),
        description: normalizeLocalizedField(data.description),
        categoryId: String(data.categoryId || ""),
        initialLetter: String(data.initialLetter || "A").toUpperCase(),
        relatedLinks: Array.isArray(data.relatedLinks)
            ? data.relatedLinks.map(normalizeRelatedLink).filter((l) => l !== undefined)
            : undefined,
        enabled: {
            ko: Boolean(data.enabled?.ko ?? true),
            en: Boolean(data.enabled?.en ?? true),
        },
        views: typeof data.views === "number" ? data.views : 0,
        editorType: data.editorType || "toast",
        saveFormat: data.saveFormat || "markdown",
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        createdBy: data.createdBy || undefined,
        updatedBy: data.updatedBy || undefined,
    };
}
// 용어 목록 조회 (페이지네이션 지원)
async function getGlossaries(options) {
    try {
        const glossariesRef = firebase_1.firestore.collection("glossaries");
        let q = glossariesRef;
        const locale = options?.locale || "ko";
        const enabledField = `enabled.${locale}`;
        // 활성화된 항목만 필터링
        q = q.where(enabledField, "==", true);
        // 카테고리 필터
        if (options?.categoryId && options.categoryId !== "__no_category__") {
            q = q.where("categoryId", "==", options.categoryId);
        }
        // 정렬: initialLetter만 사용 (Firestore는 중첩 필드를 직접 orderBy할 수 없음)
        try {
            q = q.orderBy("initialLetter", "asc");
        }
        catch (e) {
            console.warn("orderBy failed:", e);
            // no-op
        }
        // 전체 데이터 가져오기 (검색 및 페이지네이션을 위해)
        const snap = await withTimeout(q.get(), 5000);
        let glossaries = snap.docs.map(mapGlossaryData);
        // 검색 필터링 (클라이언트 측)
        if (options?.search) {
            const searchLower = options.search.toLowerCase();
            glossaries = glossaries.filter((g) => {
                const termKo = g.term.ko?.toLowerCase() || "";
                const termEn = g.term.en?.toLowerCase() || "";
                const descKo = g.description.ko?.toLowerCase() || "";
                const descEn = g.description.en?.toLowerCase() || "";
                return (termKo.includes(searchLower) ||
                    termEn.includes(searchLower) ||
                    descKo.includes(searchLower) ||
                    descEn.includes(searchLower));
            });
        }
        // 클라이언트 측 정렬: initialLetter → term (같은 알파벳 내에서)
        glossaries.sort((a, b) => {
            // initialLetter로 먼저 정렬
            if (a.initialLetter !== b.initialLetter) {
                return a.initialLetter.localeCompare(b.initialLetter);
            }
            // 같은 initialLetter 내에서 term으로 정렬
            const termA = locale === "ko" ? (a.term.ko || "") : (a.term.en || a.term.ko || "");
            const termB = locale === "ko" ? (b.term.ko || "") : (b.term.en || b.term.ko || "");
            return termA.localeCompare(termB);
        });
        const total = glossaries.length;
        const limit = options?.limit || 20;
        const page = options?.page || 1;
        const totalPages = Math.ceil(total / limit);
        // 페이지네이션 적용
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = glossaries.slice(startIndex, endIndex);
        return {
            items: paginatedItems,
            total,
            page,
            limit,
            totalPages,
        };
    }
    catch (error) {
        console.error("Error fetching glossaries:", error);
        if (error.message?.includes("timed out")) {
            console.error("Firestore 쿼리 타임아웃 - 환경 변수/네트워크 확인");
        }
        return {
            items: [],
            total: 0,
            page: options?.page || 1,
            limit: options?.limit || 20,
            totalPages: 0,
        };
    }
}
// 용어 단건 조회
async function getGlossaryById(id) {
    try {
        const glossaryRef = firebase_1.firestore.collection("glossaries").doc(id);
        const glossarySnap = await withTimeout(glossaryRef.get(), 5000);
        if (!glossarySnap.exists)
            return null;
        return mapGlossaryData(glossarySnap);
    }
    catch (error) {
        console.error("Error fetching glossary:", error);
        return null;
    }
}
// Glossary 생성/수정: Functions 환경에서는 사용하지 않음
async function createGlossary() {
    throw new Error("createGlossary는 Functions 환경에서 직접 사용되지 않습니다. API 라우터로 구현하세요.");
}
async function updateGlossary() {
    throw new Error("updateGlossary는 Functions 환경에서 직접 사용되지 않습니다. API 라우터로 구현하세요.");
}
// Glossary 삭제
async function deleteGlossary(id) {
    const glossaryRef = firebase_1.firestore.collection("glossaries").doc(id);
    await withTimeout(glossaryRef.delete(), 5000);
}
// 용어 조회수 증가 (web 앱에서만 사용)
async function incrementGlossaryViews(id) {
    const glossaryRef = firebase_1.firestore.collection("glossaries").doc(id);
    await withTimeout(glossaryRef.update({
        views: firebase_1.admin.firestore.FieldValue.increment(1),
        updatedAt: firestore_1.Timestamp.fromDate(new Date()),
    }), 5000);
}
//# sourceMappingURL=glossaryService.js.map