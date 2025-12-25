"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore");
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const mappers_1 = require("../_shared/mappers");
const glossaryService_1 = require("../../lib/admin/glossaryService");
// GET /api/admin/glossaries/[id]
async function handleGet(request, response, id) {
    try {
        const glossaryRef = firebase_1.firestore.collection("glossaries").doc(id);
        const glossarySnap = await glossaryRef.get();
        if (!glossarySnap.exists) {
            response.status(404).json({ error: "용어를 찾을 수 없습니다." });
            return;
        }
        const glossary = (0, mappers_1.mapGlossaryDoc)(glossarySnap);
        response.json({ glossary });
    }
    catch (error) {
        console.error("[GET /api/admin/glossaries/[id]]] 에러:", error.message);
        response.status(500).json({ error: "용어 정보를 불러오는 중 오류가 발생했습니다." });
    }
}
// PUT /api/admin/glossaries/[id]
async function handlePut(request, response, id) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(request);
        const glossaryRef = firebase_1.firestore.collection("glossaries").doc(id);
        const glossarySnap = await glossaryRef.get();
        if (!glossarySnap.exists) {
            response.status(404).json({ error: "용어를 찾을 수 없습니다." });
            return;
        }
        const body = request.body;
        // term이 변경된 경우 initialLetter 재계산
        let updateData = {
            ...body,
            updatedAt: firestore_1.Timestamp.fromDate(new Date()),
            updatedBy: adminId,
        };
        if (body.term) {
            const existingData = glossarySnap.data();
            const locale = body.enabled?.ko !== undefined ? (body.enabled.ko ? "ko" : "en") :
                (existingData?.enabled?.ko ? "ko" : "en");
            updateData.initialLetter = (0, glossaryService_1.calculateInitialLetter)(body.term, locale);
        }
        await glossaryRef.update((0, firestoreUtils_1.removeUndefinedFields)(updateData));
        response.json({ success: true });
    }
    catch (error) {
        console.error("[PUT /api/admin/glossaries/[id]] 에러:", error.message);
        response.status(500).json({ error: "용어 정보 수정 중 오류가 발생했습니다." });
    }
}
// DELETE /api/admin/glossaries/[id]
async function handleDelete(request, response, id) {
    try {
        (0, requestAuth_1.getRequestAdminId)(request);
        const glossaryRef = firebase_1.firestore.collection("glossaries").doc(id);
        const glossarySnap = await glossaryRef.get();
        if (!glossarySnap.exists) {
            response.status(404).json({ error: "용어를 찾을 수 없습니다." });
            return;
        }
        // 용어 삭제
        await glossaryRef.delete();
        response.json({ success: true });
    }
    catch (error) {
        console.error("[DELETE /api/admin/glossaries/[id]] 에러:", error.message);
        response.status(500).json({ error: "용어 삭제 중 오류가 발생했습니다." });
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