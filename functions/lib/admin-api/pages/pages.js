"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore"); // ✅ 추가
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const mappers_1 = require("../_shared/mappers");
// GET /api/pages
async function handle(request, response) {
    if (request.method === "GET") {
        try {
            const { searchParams } = new URL(request.url, "http://localhost");
            const site = searchParams.get("site");
            const minimal = searchParams.get("minimal") === "true"; // 메뉴 관리용: content 필드 제외
            if (!site || (site !== "web" && site !== "docs")) {
                response.status(400).json({ error: "유효한 site 파라미터가 필요합니다 (web 또는 docs)." });
                return;
            }
            const pagesRef = firebase_1.firestore.collection("pages");
            const q = pagesRef.where("site", "==", site);
            const snap = await q.get();
            const pages = snap.docs.map((docSnap) => {
                if (minimal) {
                    // 메뉴 관리용: 메타데이터만 반환 (content 제외)
                    const data = docSnap.data() || {};
                    return {
                        id: docSnap.id,
                        site: data.site,
                        menuId: data.menuId,
                        slug: data.slug,
                        labelsLive: (0, firestoreUtils_1.normalizeLocalizedField)(data.labelsLive || data.labels),
                        labelsDraft: data.labelsDraft ? (0, firestoreUtils_1.normalizeLocalizedField)(data.labelsDraft) : undefined,
                        editorType: data.editorType || "toast",
                        saveFormat: data.saveFormat || "markdown",
                        createdAt: (0, firestoreUtils_1.convertTimestamp)(data.createdAt),
                        updatedAt: (0, firestoreUtils_1.convertTimestamp)(data.updatedAt),
                        draftUpdatedAt: (0, firestoreUtils_1.convertTimestamp)(data.draftUpdatedAt),
                        createdBy: data.createdBy || undefined,
                        updatedBy: data.updatedBy || undefined,
                        // contentLive, contentDraft는 제외 (성능 최적화)
                    };
                }
                return (0, mappers_1.mapPageDoc)(docSnap);
            });
            response.json({ pages });
        }
        catch (error) {
            console.error("[GET /api/pages] 에러:", error.message);
            response.status(500).json({ error: "페이지 목록을 불러오는 중 오류가 발생했습니다." });
        }
        return;
    }
    if (request.method === "POST") {
        try {
            const adminId = (0, requestAuth_1.getRequestAdminId)(request);
            const body = request.body;
            if (!body.site || (body.site !== "web" && body.site !== "docs")) {
                response.status(400).json({ error: "유효한 site가 필요합니다 (web 또는 docs)." });
                return;
            }
            if (!body.payload?.menuId || !body.payload?.slug) {
                response.status(400).json({ error: "menuId와 slug는 필수 입력 항목입니다." });
                return;
            }
            const normalizedLabels = (0, firestoreUtils_1.normalizeLocalizedField)(body.payload.labels);
            const normalizedContent = (0, firestoreUtils_1.normalizeLocalizedField)(body.payload.content);
            const EMPTY_LOCALIZED = { ko: "", en: "" };
            const now = firestore_1.Timestamp.fromDate(new Date());
            const pagesRef = firebase_1.firestore.collection("pages");
            const docRef = await pagesRef.add((0, firestoreUtils_1.removeUndefinedFields)({
                site: body.site,
                menuId: body.payload.menuId,
                slug: body.payload.slug,
                labelsLive: EMPTY_LOCALIZED,
                contentLive: EMPTY_LOCALIZED,
                labelsDraft: normalizedLabels,
                contentDraft: normalizedContent,
                editorType: body.payload.editorType || "toast",
                saveFormat: body.payload.saveFormat || "markdown",
                createdAt: now,
                updatedAt: null,
                draftUpdatedAt: now,
                createdBy: adminId,
                updatedBy: adminId,
            }));
            response.json({ success: true, id: docRef.id });
        }
        catch (error) {
            console.error("[POST /api/pages] 에러:", error.message);
            response.status(500).json({ error: "페이지 생성 중 오류가 발생했습니다." });
        }
        return;
    }
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
//# sourceMappingURL=pages.js.map