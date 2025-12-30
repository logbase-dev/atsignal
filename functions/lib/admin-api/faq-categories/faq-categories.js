"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const types_1 = require("../../lib/admin/types");
const firestore_1 = require("firebase-admin/firestore"); // ✅ 추가
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const mappers_1 = require("../_shared/mappers");
// GET /api/faq-categories
async function handleGet(req, res) {
    try {
        const enabledKo = req.query.enabledKo === 'true';
        const enabledEn = req.query.enabledEn === 'true';
        const snap = await firebase_1.firestore.collection(types_1.COLLECTIONS.FAQ_CATEGORIES).get();
        let categories = snap.docs.map(mappers_1.mapFaqCategoryDoc);
        // enabled 필터링 (클라이언트 측)
        if (enabledKo || enabledEn) {
            categories = categories.filter((category) => {
                if (enabledKo && enabledEn) {
                    return category.enabled.ko && category.enabled.en;
                }
                else if (enabledKo) {
                    return category.enabled.ko;
                }
                else if (enabledEn) {
                    return category.enabled.en;
                }
                return true;
            });
        }
        categories.sort((a, b) => (a.order || 0) - (b.order || 0));
        res.json({ categories });
    }
    catch (error) {
        console.error("[GET /api/faq-categories] 에러:", error.message);
        res.status(500).json({ error: "카테고리 목록을 불러오는 중 오류가 발생했습니다." });
    }
}
// POST /api/faq-categories
async function handlePost(req, res) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(req);
        const body = req.body;
        if (!body?.name?.ko) {
            res.status(400).json({ error: "카테고리 이름(한국어)은 필수입니다." });
            return;
        }
        const now = firestore_1.Timestamp.fromDate(new Date());
        const data = (0, firestoreUtils_1.removeUndefinedFields)({
            name: (0, firestoreUtils_1.normalizeLocalizedField)(body.name),
            description: body.description ? (0, firestoreUtils_1.normalizeLocalizedField)(body.description) : undefined,
            order: body.order ?? 0,
            enabled: {
                ko: body.enabled?.ko ?? true,
                en: body.enabled?.en ?? true,
            },
            createdAt: now,
            updatedAt: now,
            createdBy: adminId,
            updatedBy: adminId,
        });
        const docRef = await firebase_1.firestore.collection(types_1.COLLECTIONS.FAQ_CATEGORIES).add(data);
        res.json({ success: true, id: docRef.id });
    }
    catch (error) {
        console.error("[POST /api/faq-categories] 에러:", error.message);
        res.status(500).json({ error: "카테고리 생성 중 오류가 발생했습니다." });
    }
}
// 엔트리 포인트
async function handle(req, res) {
    if (req.method === "GET")
        return handleGet(req, res);
    if (req.method === "POST")
        return handlePost(req, res);
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
//# sourceMappingURL=faq-categories.js.map