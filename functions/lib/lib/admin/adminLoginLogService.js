"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLoginLog = createLoginLog;
exports.getLoginLogsByAdminId = getLoginLogsByAdminId;
exports.getLoginLogsByUsername = getLoginLogsByUsername;
const firestore_1 = require("firebase-admin/firestore"); // ✅ 추가
const firebase_1 = require("../../firebase");
// 추가: 타임아웃 헬퍼
function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
}
function convertTimestamp(value) {
    if (!value)
        return undefined;
    if (value instanceof firestore_1.Timestamp)
        return value.toDate();
    if (value?.toDate instanceof Function)
        return value.toDate();
    if (value instanceof Date)
        return value;
    return undefined;
}
function mapLoginLogData(doc) {
    const data = doc.data();
    return {
        id: doc.id,
        adminId: data.adminId || "",
        username: data.username || "",
        ipAddress: data.ipAddress || undefined,
        userAgent: data.userAgent || undefined,
        success: data.success ?? false,
        failureReason: data.failureReason || undefined,
        createdAt: convertTimestamp(data.createdAt),
    };
}
async function createLoginLog(log) {
    const now = firestore_1.Timestamp.fromDate(new Date()); // ✅ 변경
    const docRef = await firebase_1.firestore.collection("adminLoginLogs").add({
        ...log,
        createdAt: now,
    });
    return docRef.id;
}
async function getLoginLogsByAdminId(adminId, filters = {}) {
    let q = firebase_1.firestore
        .collection("adminLoginLogs")
        .where("adminId", "==", adminId)
        .orderBy("createdAt", "desc");
    if (filters.success !== undefined) {
        q = q.where("success", "==", filters.success);
    }
    if (filters.startDate) {
        q = q.where("createdAt", ">=", firestore_1.Timestamp.fromDate(filters.startDate));
    }
    if (filters.endDate) {
        q = q.where("createdAt", "<=", firestore_1.Timestamp.fromDate(filters.endDate));
    }
    if (filters.lastDoc) {
        q = q.startAfter(filters.lastDoc);
    }
    const pageSize = filters.limit ?? 20;
    q = q.limit(pageSize + 1);
    const snap = await q.get();
    const docs = snap.docs;
    const hasMore = docs.length > pageSize;
    const docsToUse = hasMore ? docs.slice(0, pageSize) : docs;
    return {
        logs: docsToUse.map(mapLoginLogData),
        hasMore,
    };
}
/**
 * 아이디로 접속 기록을 조회합니다.
 */
async function getLoginLogsByUsername(username, filters) {
    try {
        let q = firebase_1.firestore
            .collection("adminLoginLogs")
            .where("username", "==", username.toLowerCase())
            .orderBy("createdAt", "desc");
        // 성공/실패 필터
        if (filters?.success !== undefined) {
            q = q.where("success", "==", filters.success);
        }
        // 날짜 필터
        if (filters?.startDate) {
            q = q.where("createdAt", ">=", firestore_1.Timestamp.fromDate(filters.startDate));
        }
        if (filters?.endDate) {
            q = q.where("createdAt", "<=", firestore_1.Timestamp.fromDate(filters.endDate));
        }
        // 페이지네이션
        const pageLimit = filters?.limit || 50;
        if (filters?.lastDoc) {
            q = q.startAfter(filters.lastDoc);
        }
        q = q.limit(pageLimit + 1);
        const snap = await withTimeout(q.get(), 5000);
        const docs = snap.docs;
        const hasMore = docs.length > pageLimit;
        const logs = (hasMore ? docs.slice(0, pageLimit) : docs).map(mapLoginLogData);
        const lastDoc = hasMore ? docs[pageLimit - 1] : undefined;
        return { logs, lastDoc, hasMore };
    }
    catch (error) {
        console.error("[getLoginLogsByUsername] 에러:", error.message);
        throw error;
    }
}
//# sourceMappingURL=adminLoginLogService.js.map