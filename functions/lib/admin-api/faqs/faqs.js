"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const firestore_1 = require("firebase-admin/firestore");
const requestAuth_1 = require("../_shared/requestAuth");
const firestoreUtils_1 = require("../_shared/firestoreUtils");
const mappers_1 = require("../_shared/mappers");
// GET /api/faqs
async function handleGet(request, response) {
    try {
        // ✅ Express의 request.query 사용 (Firebase Functions에서 안전)
        const categoryId = request.query.categoryId;
        const tags = Array.isArray(request.query.tags)
            ? request.query.tags
            : request.query.tags
                ? [request.query.tags]
                : [];
        const search = request.query.search;
        const orderBy = request.query.orderBy;
        const orderDirection = request.query.orderDirection;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        let q = firebase_1.firestore.collection("faqs");
        // 카테고리 필터링
        if (categoryId && categoryId !== '__no_category__') {
            q = q.where("categoryId", "==", categoryId);
        }
        // 태그 필터링
        if (tags.length > 0) {
            const tagsToQuery = tags.slice(0, 10); // Firestore는 최대 10개까지만 지원
            q = q.where("tags", "array-contains-any", tagsToQuery);
        }
        // 정렬
        try {
            if (orderBy === 'isTop') {
                q = q.orderBy("isTop", orderDirection === 'asc' ? 'asc' : 'desc');
                q = q.orderBy("level", "asc");
                q = q.orderBy("order", "asc");
            }
            else if (orderBy === 'level') {
                q = q.orderBy("level", orderDirection === 'asc' ? 'asc' : 'desc');
                q = q.orderBy("order", "asc");
            }
            else {
                q = q.orderBy("createdAt", orderDirection === 'asc' ? 'asc' : 'desc');
            }
        }
        catch (error) {
            console.warn('[GET /api/faqs] orderBy failed, using default:', error);
            q = q.orderBy("createdAt", "desc");
        }
        const snap = await q.get();
        let faqs = snap.docs.map(mappers_1.mapFaqDoc);
        // 미분류 필터링 (클라이언트 측)
        if (categoryId === '__no_category__') {
            faqs = faqs.filter((faq) => !faq.categoryId || faq.categoryId.trim() === '');
        }
        // 검색 필터링 (클라이언트 측)
        if (search) {
            const searchLower = search.toLowerCase();
            faqs = faqs.filter((faq) => {
                const questionKo = faq.question.ko?.toLowerCase() || '';
                const questionEn = faq.question.en?.toLowerCase() || '';
                const answerKo = faq.answer.ko?.toLowerCase() || '';
                const answerEn = faq.answer.en?.toLowerCase() || '';
                return questionKo.includes(searchLower) ||
                    questionEn.includes(searchLower) ||
                    answerKo.includes(searchLower) ||
                    answerEn.includes(searchLower);
            });
        }
        // 총 개수 계산
        const total = faqs.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        // 페이지네이션 적용
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedFaqs = faqs.slice(startIndex, endIndex);
        console.log('[GET /api/faqs] 페이지네이션 정보:', {
            total,
            page,
            limit,
            totalPages,
            startIndex,
            endIndex,
            paginatedCount: paginatedFaqs.length
        });
        response.json({
            faqs: paginatedFaqs,
            total,
            page,
            limit,
            totalPages
        });
    }
    catch (error) {
        console.error("[GET /api/faqs] 에러:", error.message);
        response.status(500).json({ error: "FAQ 목록을 불러오는 중 오류가 발생했습니다." });
    }
}
// POST /api/faqs  (새 FAQ 생성)
async function handlePost(request, response) {
    // ✅ request.method 체크 제거 (handle 함수에서 이미 체크함)
    try {
        const adminId = (0, requestAuth_1.getRequestAdminId)(request);
        // 요청 본문 파싱
        const body = request.body;
        // 필수 필드 검증
        if (!body.question?.ko) {
            response.status(400).json({ error: "질문(한국어)은 필수 입력 항목입니다." });
            return;
        }
        if (!body.answer?.ko) {
            response.status(400).json({ error: "답변(한국어)은 필수 입력 항목입니다." });
            return;
        }
        const now = firestore_1.Timestamp.fromDate(new Date());
        const faqsRef = firebase_1.firestore.collection("faqs");
        const docRef = await faqsRef.add((0, firestoreUtils_1.removeUndefinedFields)({
            ...body,
            level: body.level ?? 999,
            isTop: body.isTop ?? false,
            order: body.order ?? 0,
            views: 0, // 생성 시 0으로 초기화
            createdAt: now,
            updatedAt: now,
            createdBy: adminId,
            updatedBy: adminId,
        }));
        response.json({ success: true, id: docRef.id });
    }
    catch (error) {
        console.error("[POST /api/faqs] 에러:", error.message);
        response.status(500).json({ error: "FAQ 생성 중 오류가 발생했습니다." });
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
//# sourceMappingURL=faqs.js.map