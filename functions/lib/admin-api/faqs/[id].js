"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore"); // ✅ 추가
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const contentImageUtils_1 = require("../_shared/contentImageUtils");
const mappers_1 = require("../_shared/mappers");
const storageImageUtils_1 = require("../_shared/storageImageUtils");
// GET /api/faqs/[id]
async function handleGet(request, response, id) {
    try {
        const faqRef = firebase_1.firestore.collection("faqs").doc(id);
        const faqSnap = await faqRef.get();
        if (!faqSnap.exists) {
            response.status(404).json({ error: "FAQ를 찾을 수 없습니다." });
            return;
        }
        const faq = (0, mappers_1.mapFaqDoc)(faqSnap);
        response.json({ faq });
    }
    catch (error) {
        console.error("[GET /api/faqs/[id]] 에러:", error.message);
        response.status(500).json({ error: "FAQ 정보를 불러오는 중 오류가 발생했습니다." });
    }
}
// PUT /api/faqs/[id]
async function handlePut(request, response, id) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(request);
        const faqRef = firebase_1.firestore.collection("faqs").doc(id);
        const faqSnap = await faqRef.get();
        if (!faqSnap.exists) {
            response.status(404).json({ error: "FAQ를 찾을 수 없습니다." });
            return;
        }
        const existingData = faqSnap.data();
        const body = request.body;
        // 기존/신규 이미지 비교 후 삭제 대상 결정
        const existingContentSources = [existingData.answer?.ko, existingData.answer?.en].filter(Boolean);
        const existingImageUrls = new Set();
        existingContentSources.forEach((c) => (0, contentImageUtils_1.extractImageUrls)(c).forEach((u) => existingImageUrls.add(u)));
        const newContentSources = [body.answer?.ko, body.answer?.en].filter(Boolean);
        const newImageUrls = new Set();
        newContentSources.forEach((c) => (0, contentImageUtils_1.extractImageUrls)(c).forEach((u) => newImageUrls.add(u)));
        const removedImageUrls = Array.from(existingImageUrls).filter((url) => !newImageUrls.has(url));
        // 제거된 이미지 삭제 (실패해도 계속)
        if (removedImageUrls.length > 0) {
            try {
                await Promise.all(removedImageUrls.map(async (url) => {
                    const fileName = (0, contentImageUtils_1.extractFileNameFromUrl)(url);
                    if (fileName)
                        await (0, storageImageUtils_1.deleteImagesForFileName)(fileName, { logPrefix: "FAQ Update" });
                }));
            }
            catch (err) {
                console.error("[FAQ Update] 이미지 삭제 중 오류 발생:", err);
            }
        }
        await faqRef.update((0, firestoreUtils_1.removeUndefinedFields)({
            ...body,
            updatedAt: firestore_1.Timestamp.fromDate(new Date()),
            updatedBy: adminId,
        }));
        response.json({ success: true });
    }
    catch (error) {
        console.error("[PUT /api/faqs/[id]] 에러:", error.message);
        response.status(500).json({ error: "FAQ 정보 수정 중 오류가 발생했습니다." });
    }
}
// DELETE /api/faqs/[id]
async function handleDelete(request, response, id) {
    try {
        (0, requestAuth_1.getRequestAdminId)(request);
        const faqRef = firebase_1.firestore.collection("faqs").doc(id);
        const faqSnap = await faqRef.get();
        if (!faqSnap.exists) {
            response.status(404).json({ error: "FAQ를 찾을 수 없습니다." });
            return;
        }
        // FAQ 데이터에서 이미지 URL 추출
        const faqData = faqSnap.data();
        const contentSources = [faqData.answer?.ko, faqData.answer?.en].filter(Boolean);
        const allImageUrls = new Set();
        contentSources.forEach((content) => (0, contentImageUtils_1.extractImageUrls)(content).forEach((url) => allImageUrls.add(url)));
        // 연결된 이미지 삭제 (실패해도 계속)
        if (allImageUrls.size > 0) {
            try {
                await Promise.all(Array.from(allImageUrls).map(async (url) => {
                    const fileName = (0, contentImageUtils_1.extractFileNameFromUrl)(url);
                    if (fileName)
                        await (0, storageImageUtils_1.deleteImagesForFileName)(fileName, { logPrefix: "FAQ Delete" });
                }));
            }
            catch (err) {
                console.error("[FAQ Delete] 이미지 삭제 중 오류 발생:", err);
                // 이미지 삭제 실패해도 FAQ 삭제는 계속 진행
            }
        }
        // FAQ 삭제
        await faqRef.delete();
        response.json({ success: true });
    }
    catch (error) {
        console.error("[DELETE /api/faqs/[id]] 에러:", error.message);
        response.status(500).json({ error: "FAQ 삭제 중 오류가 발생했습니다." });
    }
}
// 라우터에서 호출할 진입점
async function handle(request, response, id) {
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
//# sourceMappingURL=%5Bid%5D.js.map