"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGet = handleGet;
exports.handlePut = handlePut;
exports.handleDelete = handleDelete;
exports.handle = handle;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore"); // ✅ 추가
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const contentImageUtils_1 = require("../_shared/contentImageUtils");
const mappers_1 = require("../_shared/mappers");
const storageImageUtils_1 = require("../_shared/storageImageUtils");
// GET /api/pages/[id]
async function handleGet(_req, res, id) {
    try {
        const pageRef = firebase_1.firestore.collection("pages").doc(id);
        const pageSnap = await pageRef.get();
        if (!pageSnap.exists) {
            res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
            return;
        }
        const page = (0, mappers_1.mapPageDoc)(pageSnap);
        res.json({ page });
    }
    catch (error) {
        console.error("[GET /api/pages/[id]] 에러:", error.message);
        res.status(500).json({ error: "페이지 정보를 불러오는 중 오류가 발생했습니다." });
    }
}
// PUT /api/pages/[id] (draft/publish)
async function handlePut(req, res, id) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(req);
        const pageRef = firebase_1.firestore.collection("pages").doc(id);
        const pageSnap = await pageRef.get();
        if (!pageSnap.exists) {
            res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
            return;
        }
        const body = req.body;
        if (!body?.action || (body.action !== "draft" && body.action !== "publish")) {
            res.status(400).json({ error: 'action은 "draft" 또는 "publish"여야 합니다.' });
            return;
        }
        const normalizedLabels = (0, firestoreUtils_1.normalizeLocalizedField)(body.payload.labels);
        const normalizedContent = (0, firestoreUtils_1.normalizeLocalizedField)(body.payload.content);
        const now = firestore_1.Timestamp.fromDate(new Date());
        const existingData = pageSnap.data();
        // 기존/신규 이미지 비교 → 삭제 대상 추출
        const existingContentSources = [
            existingData.contentLive?.ko,
            existingData.contentLive?.en,
            existingData.contentDraft?.ko,
            existingData.contentDraft?.en,
        ].filter(Boolean);
        const existingImageUrls = new Set();
        existingContentSources.forEach((c) => (0, contentImageUtils_1.extractImageUrls)(c).forEach((u) => existingImageUrls.add(u)));
        const newContentSources = [normalizedContent.ko, normalizedContent.en].filter(Boolean);
        const newImageUrls = new Set();
        newContentSources.forEach((c) => (0, contentImageUtils_1.extractImageUrls)(c).forEach((u) => newImageUrls.add(u)));
        const removedImageUrls = Array.from(existingImageUrls).filter((url) => !newImageUrls.has(url));
        // 제거된 이미지 삭제 (실패해도 계속)
        if (removedImageUrls.length > 0) {
            try {
                await Promise.all(removedImageUrls.map(async (url) => {
                    const fileName = (0, contentImageUtils_1.extractFileNameFromUrl)(url);
                    if (fileName) {
                        await (0, storageImageUtils_1.deleteImagesForFileName)(fileName, { logPrefix: "Page Update" });
                    }
                }));
            }
            catch (err) {
                console.error("[Page Update] 이미지 삭제 중 오류:", err);
            }
        }
        if (body.action === "draft") {
            await pageRef.update((0, firestoreUtils_1.removeUndefinedFields)({
                menuId: body.payload.menuId,
                slug: body.payload.slug,
                labelsDraft: normalizedLabels,
                contentDraft: normalizedContent,
                editorType: body.payload.editorType || "toast",
                saveFormat: body.payload.saveFormat || "markdown",
                draftUpdatedAt: now,
                updatedBy: adminId,
            }));
        }
        else {
            await pageRef.update((0, firestoreUtils_1.removeUndefinedFields)({
                menuId: body.payload.menuId,
                slug: body.payload.slug,
                labelsLive: normalizedLabels,
                contentLive: normalizedContent,
                labelsDraft: normalizedLabels,
                contentDraft: normalizedContent,
                editorType: body.payload.editorType || "toast",
                saveFormat: body.payload.saveFormat || "markdown",
                updatedAt: now,
                draftUpdatedAt: now,
                updatedBy: adminId,
            }));
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error("[PUT /api/pages/[id]] 에러:", error.message);
        if (error.message?.includes("인증")) {
            res.status(401).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: "페이지 수정 중 오류가 발생했습니다." });
    }
}
// DELETE /api/pages/[id]
async function handleDelete(req, res, id) {
    try {
        // Router already enforced auth; this is just a sanity check.
        (0, requestAuth_1.getRequestAdminId)(req);
        const pageRef = firebase_1.firestore.collection("pages").doc(id);
        const pageSnap = await pageRef.get();
        if (!pageSnap.exists) {
            res.status(404).json({ error: "페이지를 찾을 수 없습니다." });
            return;
        }
        // 페이지 데이터에서 이미지 URL 추출
        const pageData = pageSnap.data();
        const contentSources = [
            pageData.contentLive?.ko,
            pageData.contentLive?.en,
            pageData.contentDraft?.ko,
            pageData.contentDraft?.en,
        ].filter(Boolean);
        const allImageUrls = new Set();
        contentSources.forEach((content) => (0, contentImageUtils_1.extractImageUrls)(content).forEach((url) => allImageUrls.add(url)));
        // 연결된 이미지 삭제 (실패해도 계속)
        if (allImageUrls.size > 0) {
            try {
                await Promise.all(Array.from(allImageUrls).map(async (url) => {
                    const fileName = (0, contentImageUtils_1.extractFileNameFromUrl)(url);
                    if (fileName)
                        await (0, storageImageUtils_1.deleteImagesForFileName)(fileName, { logPrefix: "Page Delete" });
                }));
            }
            catch (err) {
                console.error("[Page Delete] 이미지 삭제 중 오류 발생:", err);
                // 이미지 삭제 실패해도 페이지 삭제는 계속 진행
            }
        }
        // 페이지 삭제
        await pageRef.delete();
        res.json({ success: true });
    }
    catch (error) {
        console.error("[DELETE /api/pages/[id]] 에러:", error.message);
        res.status(500).json({ error: "페이지 삭제 중 오류가 발생했습니다." });
    }
}
// 라우터 진입점
async function handle(req, res, id) {
    if (req.method === "GET")
        return handleGet(req, res, id);
    if (req.method === "PUT")
        return handlePut(req, res, id);
    if (req.method === "DELETE")
        return handleDelete(req, res, id);
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
//# sourceMappingURL=%5Bid%5D.js.map