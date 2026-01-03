"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDemoRequests = getDemoRequests;
exports.getDemoRequestById = getDemoRequestById;
exports.createDemoRequest = createDemoRequest;
exports.updateDemoRequest = updateDemoRequest;
exports.deleteDemoRequest = deleteDemoRequest;
const firebase_1 = require("../../firebase");
const types_1 = require("./types");
async function getDemoRequests(options = {}) {
    const { page = 1, limit = 20, status, search } = options;
    const offset = (page - 1) * limit;
    let query = firebase_1.firestore.collection(types_1.COLLECTIONS.DEMO_REQUESTS).orderBy('createdAt', 'desc');
    // 상태 필터
    if (status) {
        query = query.where('status', '==', status);
    }
    // 검색 필터 (이름, 회사명, 이메일)
    if (search) {
        // Firestore는 full-text search를 지원하지 않으므로 클라이언트 사이드에서 필터링
        // 실제 프로덕션에서는 Algolia나 Elasticsearch 등을 사용하는 것이 좋습니다.
    }
    const snapshot = await query.get();
    let allDemoRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        contactedAt: doc.data().contactedAt?.toDate(),
    }));
    // 클라이언트 사이드 검색 필터링
    if (search) {
        const searchLower = search.toLowerCase();
        allDemoRequests = allDemoRequests.filter(request => request.name.toLowerCase().includes(searchLower) ||
            request.company.toLowerCase().includes(searchLower) ||
            request.email.toLowerCase().includes(searchLower));
    }
    const total = allDemoRequests.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedRequests = allDemoRequests.slice(offset, offset + limit);
    return {
        demoRequests: paginatedRequests,
        total,
        page,
        limit,
        totalPages,
    };
}
async function getDemoRequestById(id) {
    const doc = await firebase_1.firestore.collection(types_1.COLLECTIONS.DEMO_REQUESTS).doc(id).get();
    if (!doc.exists) {
        return null;
    }
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        contactedAt: data.contactedAt?.toDate(),
    };
}
async function createDemoRequest(demoRequest) {
    const now = new Date();
    const docRef = await firebase_1.firestore.collection(types_1.COLLECTIONS.DEMO_REQUESTS).add({
        ...demoRequest,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}
async function updateDemoRequest(id, updates) {
    const updateData = {
        ...updates,
        updatedAt: new Date(),
    };
    // Date 객체들을 Firestore Timestamp로 변환
    if (updateData.contactedAt) {
        updateData.contactedAt = updateData.contactedAt;
    }
    await firebase_1.firestore.collection(types_1.COLLECTIONS.DEMO_REQUESTS).doc(id).update(updateData);
}
async function deleteDemoRequest(id) {
    await firebase_1.firestore.collection(types_1.COLLECTIONS.DEMO_REQUESTS).doc(id).delete();
}
//# sourceMappingURL=demoRequestService.js.map