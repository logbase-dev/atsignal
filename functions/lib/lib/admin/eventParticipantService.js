"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventParticipants = getEventParticipants;
exports.getEventParticipantById = getEventParticipantById;
exports.checkEmailExists = checkEmailExists;
exports.createEventParticipant = createEventParticipant;
exports.deleteEventParticipant = deleteEventParticipant;
exports.deleteEventParticipantsByEventId = deleteEventParticipantsByEventId;
const firestore_1 = require("firebase-admin/firestore");
const firebase_1 = require("../../firebase");
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
    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function")
        return value.toDate();
    if (value instanceof Date)
        return value;
    return undefined;
}
function mapEventParticipant(id, data) {
    return {
        id,
        eventId: String(data.eventId || ""),
        name: String(data.name || ""),
        company: String(data.company || ""),
        email: String(data.email || ""),
        phone: String(data.phone || ""),
        privacyConsent: Boolean(data.privacyConsent ?? false),
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
}
async function getEventParticipants(options) {
    try {
        if (!options?.eventId) {
            throw new Error("eventId is required");
        }
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const offset = (page - 1) * limit;
        const participantsRef = firebase_1.firestore.collection("eventParticipants");
        // eventId로 필터링
        let query = participantsRef.where("eventId", "==", options.eventId);
        // 검색어 필터링
        let participants = [];
        let total = 0;
        if (options?.search && options.search.trim()) {
            // 검색어가 있으면 더 많은 데이터를 가져와서 필터링
            console.log("[getEventParticipants] 검색어 필터 적용:", options.search);
            const searchSnap = await withTimeout(query.orderBy("createdAt", "desc").limit(1000).get(), 10000);
            let allParticipants = searchSnap.docs.map((d) => mapEventParticipant(d.id, d.data()));
            const searchLower = options.search.toLowerCase().trim();
            allParticipants = allParticipants.filter((participant) => {
                const email = (participant.email || "").toLowerCase();
                const company = (participant.company || "").toLowerCase();
                const name = (participant.name || "").toLowerCase();
                return (email.includes(searchLower) ||
                    company.includes(searchLower) ||
                    name.includes(searchLower));
            });
            // 검색 필터링 후 총 개수 재계산
            total = allParticipants.length;
            // createdAt DESC 정렬
            allParticipants.sort((a, b) => {
                const aDate = a.createdAt?.getTime() || 0;
                const bDate = b.createdAt?.getTime() || 0;
                return bDate - aDate;
            });
            // 페이지네이션 적용
            const startIdx = offset;
            const endIdx = offset + limit;
            participants = allParticipants.slice(startIdx, endIdx);
        }
        else {
            // 검색어가 없으면 기존 방식 사용
            // 총 개수 조회
            try {
                const countSnap = await withTimeout(query.count().get(), 5000);
                total = countSnap.data().count;
            }
            catch (countError) {
                console.warn("[getEventParticipants] count() not supported, using fallback method");
                const allSnap = await withTimeout(query.get(), 10000);
                total = allSnap.size;
            }
            // 페이지네이션 적용
            const q = query.orderBy("createdAt", "desc").limit(limit).offset(offset);
            const snap = await withTimeout(q.get(), 5000);
            participants = snap.docs.map((d) => mapEventParticipant(d.id, d.data()));
        }
        return {
            participants,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    catch (error) {
        console.error("[getEventParticipants] 에러:", error?.message || error);
        return {
            participants: [],
            total: 0,
            page: options?.page || 1,
            limit: options?.limit || 20,
            totalPages: 0,
        };
    }
}
async function getEventParticipantById(id) {
    try {
        const docSnap = await withTimeout(firebase_1.firestore.collection("eventParticipants").doc(id).get(), 5000);
        if (!docSnap.exists)
            return null;
        return mapEventParticipant(docSnap.id, (docSnap.data() || {}));
    }
    catch (error) {
        console.error("[getEventParticipantById] 에러:", error?.message || error);
        return null;
    }
}
// 이벤트별 이메일 중복 체크
async function checkEmailExists(eventId, email) {
    try {
        const participantsRef = firebase_1.firestore.collection("eventParticipants");
        const query = participantsRef
            .where("eventId", "==", eventId)
            .where("email", "==", email)
            .limit(1);
        const snap = await withTimeout(query.get(), 5000);
        return !snap.empty;
    }
    catch (error) {
        console.error("[checkEmailExists] 에러:", error?.message || error);
        throw error;
    }
}
async function createEventParticipant(participant) {
    const now = firestore_1.Timestamp.fromDate(new Date());
    // 이메일 중복 체크
    const emailExists = await checkEmailExists(participant.eventId, participant.email);
    if (emailExists) {
        throw new Error("이미 신청한 이메일입니다.");
    }
    const data = {
        eventId: participant.eventId,
        name: participant.name,
        company: participant.company,
        email: participant.email,
        phone: participant.phone,
        privacyConsent: Boolean(participant.privacyConsent),
        createdAt: now,
    };
    console.log(`[createEventParticipant] 생성 데이터:`, JSON.stringify(data, null, 2));
    const docRef = await withTimeout(firebase_1.firestore.collection("eventParticipants").add(data), 5000);
    return docRef.id;
}
async function deleteEventParticipant(id) {
    await withTimeout(firebase_1.firestore.collection("eventParticipants").doc(id).delete(), 5000);
}
// 이벤트 삭제 시 연관된 참가자 정보도 삭제 (cascade delete)
async function deleteEventParticipantsByEventId(eventId) {
    try {
        const participantsRef = firebase_1.firestore.collection("eventParticipants");
        const query = participantsRef.where("eventId", "==", eventId);
        const snap = await withTimeout(query.get(), 10000);
        const batch = firebase_1.firestore.batch();
        snap.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        if (snap.docs.length > 0) {
            await withTimeout(batch.commit(), 10000);
            console.log(`[deleteEventParticipantsByEventId] ${snap.docs.length}개의 참가자 정보 삭제 완료`);
        }
    }
    catch (error) {
        console.error("[deleteEventParticipantsByEventId] 에러:", error?.message || error);
        throw error;
    }
}
//# sourceMappingURL=eventParticipantService.js.map