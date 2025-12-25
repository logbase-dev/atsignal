"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPages = getPages;
exports.getPageById = getPageById;
exports.getPagesByMenuId = getPagesByMenuId;
exports.savePageDraft = savePageDraft;
exports.publishPage = publishPage;
exports.deletePage = deletePage;
const firebase_1 = require("../../firebase");
// Timestamp → Date 변환
function normalizeTimestamp(value) {
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
const EMPTY_LOCALIZED = { ko: "", en: "" };
function normalizeLocalizedField(field) {
    if (!field)
        return { ...EMPTY_LOCALIZED };
    return { ko: field.ko ?? "", ...(field.en ? { en: field.en } : {}) };
}
// Page 매핑
function mapPageData(snapshot) {
    const data = snapshot.data();
    const labelsLive = normalizeLocalizedField(data.labelsLive ?? data.labels);
    const contentLive = normalizeLocalizedField(data.contentLive ?? data.content);
    const labelsDraft = data.labelsDraft ? normalizeLocalizedField(data.labelsDraft) : undefined;
    const contentDraft = data.contentDraft ? normalizeLocalizedField(data.contentDraft) : undefined;
    return {
        id: snapshot.id,
        site: data.site,
        menuId: data.menuId,
        slug: data.slug,
        labelsLive,
        contentLive,
        labelsDraft,
        contentDraft,
        editorType: data.editorType || "toast",
        saveFormat: data.saveFormat || "markdown",
        createdAt: normalizeTimestamp(data.createdAt),
        updatedAt: normalizeTimestamp(data.updatedAt),
        draftUpdatedAt: normalizeTimestamp(data.draftUpdatedAt),
    };
}
// Storage 이미지 삭제 보조 함수
async function deleteImageFromStorage(fileName) {
    const bucket = firebase_1.admin.storage().bucket();
    const sizes = ["thumbnail", "medium", "large", "original"];
    await Promise.all(sizes.map((size) => bucket.file(`images/${size}/${fileName}`).delete({ ignoreNotFound: true }).catch((err) => {
        if (err?.code !== 404) {
            console.warn(`[Page Delete] 이미지 삭제 실패: images/${size}/${fileName}`, err);
        }
    })));
}
function extractImageUrls(content) {
    const urls = [];
    const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const markdownImgRegex = /!\[.*?\]\((.*?)\)/gi;
    let match;
    while ((match = htmlImgRegex.exec(content)) !== null)
        urls.push(match[1]);
    while ((match = markdownImgRegex.exec(content)) !== null)
        urls.push(match[1]);
    return urls;
}
function extractFileNameFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/images%2F(?:thumbnail|medium|large|original)%2F(.+?)(?:\?|$)/);
        return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    }
    catch {
        return null;
    }
}
// 페이지 목록 조회
async function getPages(site) {
    const pagesRef = firebase_1.firestore.collection("pages");
    const q = pagesRef.where("site", "==", site);
    const snap = await q.get();
    return snap.docs.map(mapPageData);
}
// 단건 조회
async function getPageById(id) {
    const pageRef = firebase_1.firestore.collection("pages").doc(id);
    const pageSnap = await pageRef.get();
    if (!pageSnap.exists)
        return null;
    return mapPageData(pageSnap);
}
// 메뉴 ID로 조회
async function getPagesByMenuId(menuId) {
    const pagesRef = firebase_1.firestore.collection("pages");
    const q = pagesRef.where("menuId", "==", menuId);
    const snap = await q.get();
    return snap.docs.map(mapPageData);
}
/**
 * @deprecated API Route로 대체됨. /api/pages (POST), /api/pages/[id] (PUT) 사용
 */
async function savePageDraft() {
    throw new Error("savePageDraft는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}
/**
 * @deprecated API Route로 대체됨. /api/pages/[id] (PUT with action: \"publish\") 사용
 */
async function publishPage() {
    throw new Error("publishPage는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}
// 페이지 삭제 (연결된 이미지 삭제 포함)
async function deletePage(id) {
    const pageRef = firebase_1.firestore.collection("pages").doc(id);
    // 페이지 데이터 가져오기 (이미지 URL 추출을 위해)
    const pageSnap = await pageRef.get();
    if (pageSnap.exists) {
        const pageData = pageSnap.data();
        const contentSources = [
            pageData.contentLive?.ko,
            pageData.contentLive?.en,
            pageData.contentDraft?.ko,
            pageData.contentDraft?.en,
        ].filter(Boolean);
        const allImageUrls = new Set();
        contentSources.forEach((content) => extractImageUrls(content).forEach((url) => allImageUrls.add(url)));
        try {
            await Promise.all(Array.from(allImageUrls).map(async (url) => {
                const fileName = extractFileNameFromUrl(url);
                if (fileName)
                    await deleteImageFromStorage(fileName);
            }));
        }
        catch (err) {
            console.error("[Page Delete] 이미지 삭제 중 오류:", err);
            // 이미지 삭제 실패해도 페이지 삭제는 계속 진행
        }
    }
    await pageRef.delete();
}
//# sourceMappingURL=pageService.js.map