"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore");
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const mappers_1 = require("../_shared/mappers");
const glossaryService_1 = require("../../lib/admin/glossaryService");
// GET /api/admin/glossaries
async function handleGet(request, response) {
    try {
        const categoryId = request.query.categoryId;
        const search = request.query.search;
        const locale = request.query.locale || "ko";
        const page = request.query.page ? Number(request.query.page) : 1;
        const limit = request.query.limit ? Number(request.query.limit) : 20;
        const glossariesRef = firebase_1.firestore.collection("glossaries");
        let q = glossariesRef.where(`enabled.${locale}`, "==", true);
        // 카테고리 필터링
        if (categoryId && categoryId !== "__no_category__") {
            q = q.where("categoryId", "==", categoryId);
        }
        // NOTE: orderBy를 사용하면 enabled.ko와 initialLetter에 대한 복합 인덱스가 필요합니다.
        // 인덱스 없이 동작하도록 orderBy를 제거하고 클라이언트 측에서 정렬합니다.
        // 필요시 Firebase Console에서 인덱스를 생성할 수 있습니다.
        const snap = await q.get();
        let glossaries = snap.docs.map(mappers_1.mapGlossaryDoc);
        // 미분류 필터링 (클라이언트 측)
        if (categoryId === "__no_category__") {
            glossaries = glossaries.filter((g) => !g.categoryId || g.categoryId.trim() === "");
        }
        // 검색 필터링 (클라이언트 측)
        if (search) {
            const searchLower = search.toLowerCase();
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
        const totalPages = Math.ceil(total / limit);
        // 페이지네이션 적용
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = glossaries.slice(startIndex, endIndex);
        response.json({
            items: paginatedItems,
            total,
            page,
            limit,
            totalPages,
        });
    }
    catch (error) {
        console.error("[GET /api/admin/glossaries] 에러:", error.message);
        response.status(500).json({ error: "용어사전 목록을 불러오는 중 오류가 발생했습니다." });
    }
}
// POST /api/admin/glossaries (새 용어 생성)
async function handlePost(request, response) {
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(request);
        // 요청 본문 파싱
        const body = request.body;
        // 필수 필드 검증
        if (!body.term?.ko) {
            response.status(400).json({ error: "용어명(한국어)은 필수 입력 항목입니다." });
            return;
        }
        if (!body.description?.ko) {
            response.status(400).json({ error: "설명(한국어)은 필수 입력 항목입니다." });
            return;
        }
        if (!body.categoryId) {
            response.status(400).json({ error: "카테고리는 필수 선택 항목입니다." });
            return;
        }
        // initialLetter 자동 계산
        const locale = body.enabled?.ko ? "ko" : "en";
        const initialLetter = (0, glossaryService_1.calculateInitialLetter)(body.term, locale);
        const now = firestore_1.Timestamp.fromDate(new Date());
        const glossariesRef = firebase_1.firestore.collection("glossaries");
        const docRef = await glossariesRef.add((0, firestoreUtils_1.removeUndefinedFields)({
            ...body,
            initialLetter,
            views: 0, // 생성 시 0으로 초기화
            createdAt: now,
            updatedAt: now,
            createdBy: adminId,
            updatedBy: adminId,
        }));
        response.json({ success: true, id: docRef.id });
    }
    catch (error) {
        console.error("[POST /api/admin/glossaries] 에러:", error.message);
        response.status(500).json({ error: "용어 생성 중 오류가 발생했습니다." });
    }
}
// 라우터에서 호출할 진입점
async function handle(request, response) {
    if (request.method === "GET") {
        return handleGet(request, response);
    }
    if (request.method === "POST") {
        return handlePost(request, response);
    }
    response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
}
//# sourceMappingURL=glossaries.js.map