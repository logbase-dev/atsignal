"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalesInquiries = getSalesInquiries;
exports.getSalesInquiryById = getSalesInquiryById;
exports.createSalesInquiry = createSalesInquiry;
exports.updateSalesInquiry = updateSalesInquiry;
exports.deleteSalesInquiry = deleteSalesInquiry;
const firebase_1 = require("../../firebase");
const types_1 = require("./types");
async function getSalesInquiries(options) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    let query = firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES).orderBy('createdAt', 'desc');
    // 상태 필터
    if (options?.status) {
        query = query.where('status', '==', options.status);
    }
    // 검색 (이름, 회사명, 이메일)
    if (options?.search) {
        const searchTerm = options.search.toLowerCase();
        // Firestore는 부분 문자열 검색을 직접 지원하지 않으므로,
        // 모든 데이터를 가져와서 클라이언트에서 필터링
        const allDocs = await query.get();
        const filteredDocs = allDocs.docs.filter(doc => {
            const data = doc.data();
            return (data.name?.toLowerCase().includes(searchTerm) ||
                data.company?.toLowerCase().includes(searchTerm) ||
                data.email?.toLowerCase().includes(searchTerm));
        });
        const total = filteredDocs.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedDocs = filteredDocs.slice(offset, offset + limit);
        const salesInquiries = paginatedDocs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
            contactedAt: doc.data().contactedAt?.toDate(),
        }));
        return { salesInquiries, total, page, limit, totalPages };
    }
    // 검색이 없는 경우 일반적인 페이지네이션
    const countQuery = options?.status
        ? firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES).where('status', '==', options.status)
        : firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES);
    const [snapshot, countSnapshot] = await Promise.all([
        query.limit(limit).offset(offset).get(),
        countQuery.get()
    ]);
    const total = countSnapshot.size;
    const totalPages = Math.ceil(total / limit);
    const salesInquiries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        contactedAt: doc.data().contactedAt?.toDate(),
    }));
    return { salesInquiries, total, page, limit, totalPages };
}
async function getSalesInquiryById(id) {
    const doc = await firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES).doc(id).get();
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
async function createSalesInquiry(salesInquiry) {
    const now = new Date();
    const docRef = await firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES).add({
        ...salesInquiry,
        createdAt: now,
        updatedAt: now,
    });
    return docRef.id;
}
async function updateSalesInquiry(id, updates) {
    const updateData = {
        ...updates,
        updatedAt: new Date(),
    };
    // Date 객체들을 Firestore Timestamp로 변환
    if (updateData.contactedAt) {
        updateData.contactedAt = updateData.contactedAt;
    }
    await firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES).doc(id).update(updateData);
}
async function deleteSalesInquiry(id) {
    await firebase_1.firestore.collection(types_1.COLLECTIONS.SALES_INQUIRIES).doc(id).delete();
}
//# sourceMappingURL=salesInquiryService.js.map