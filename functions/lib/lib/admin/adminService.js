"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdmins = getAdmins;
exports.getAdminById = getAdminById;
exports.getAdminByUsername = getAdminByUsername;
exports.checkUsernameExists = checkUsernameExists;
exports.createAdmin = createAdmin;
exports.updateAdmin = updateAdmin;
exports.updateLastLoginAt = updateLastLoginAt;
exports.deleteAdmin = deleteAdmin;
const firebase_1 = require("../../firebase");
const password_1 = require("../utils/password");
const firestore_1 = require("firebase-admin/firestore"); // ✅ 추가
// 타임아웃 헬퍼 함수
function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        })
    ]);
}
// Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestamp(value) {
    if (!value)
        return undefined;
    if (value instanceof firestore_1.Timestamp) {
        return value.toDate();
    }
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        return value.toDate();
    }
    if (value instanceof Date) {
        return value;
    }
    return undefined;
}
// undefined 값을 제거하는 헬퍼 함수 (Firestore는 undefined 값을 허용하지 않음)
function removeUndefinedFields(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            cleaned[key] = value;
        }
    }
    return cleaned;
}
// Firestore 데이터를 Admin 객체로 변환
function mapAdminData(docSnapshot) {
    const data = docSnapshot.data();
    if (!data) {
        throw new Error('Document data is missing');
    }
    return {
        id: docSnapshot.id,
        username: data.username || '',
        password: data.password || '', // 해시된 비밀번호
        name: data.name || '',
        enabled: data.enabled !== undefined ? data.enabled : true,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
        lastLoginAt: convertTimestamp(data.lastLoginAt),
        createdBy: data.createdBy || undefined,
    };
}
/**
 * 모든 관리자 목록을 조회합니다.
 */
async function getAdmins() {
    try {
        const adminsRef = firebase_1.firestore.collection('admins');
        const q = adminsRef.orderBy('createdAt', 'desc');
        const querySnapshot = await withTimeout(q.get(), 5000);
        return querySnapshot.docs.map(mapAdminData);
    }
    catch (error) {
        console.error('[getAdmins] 에러:', error.message);
        return [];
    }
}
/**
 * ID로 관리자를 조회합니다.
 */
async function getAdminById(id) {
    try {
        const adminDoc = await firebase_1.firestore.collection('admins').doc(id).get();
        if (!adminDoc.exists) {
            return null;
        }
        return mapAdminData(adminDoc);
    }
    catch (error) {
        console.error('[getAdminById] 에러:', error.message);
        throw error;
    }
}
/**
 * 아이디로 관리자를 조회합니다.
 */
async function getAdminByUsername(username) {
    try {
        const adminsRef = firebase_1.firestore.collection('admins');
        const q = adminsRef.where('username', '==', username.toLowerCase());
        const querySnapshot = await withTimeout(q.get(), 5000);
        if (querySnapshot.empty) {
            return null;
        }
        return mapAdminData(querySnapshot.docs[0]);
    }
    catch (error) {
        console.error('[getAdminByUsername] 에러:', error.message);
        throw error;
    }
}
/**
 * 아이디 중복 여부를 확인합니다.
 */
async function checkUsernameExists(username) {
    const admin = await getAdminByUsername(username);
    return admin !== null;
}
/**
 * 새 관리자를 생성합니다.
 */
async function createAdmin(data) {
    try {
        // 아이디 중복 체크
        const exists = await checkUsernameExists(data.username);
        if (exists) {
            throw new Error('이미 사용 중인 아이디입니다.');
        }
        // 비밀번호 해시화
        const hashedPassword = await (0, password_1.hashPassword)(data.password);
        const now = new Date();
        const adminData = removeUndefinedFields({
            username: data.username.toLowerCase(),
            password: hashedPassword,
            name: data.name,
            enabled: data.enabled !== undefined ? data.enabled : true,
            createdAt: firestore_1.Timestamp.fromDate(now),
            updatedAt: firestore_1.Timestamp.fromDate(now),
            createdBy: data.createdBy,
        });
        const docRef = await firebase_1.firestore.collection('admins').add(adminData);
        return docRef.id;
    }
    catch (error) {
        console.error('[createAdmin] 에러:', error.message);
        throw error;
    }
}
/**
 * 관리자 정보를 수정합니다.
 */
async function updateAdmin(id, data) {
    try {
        const updateData = {
            updatedAt: firestore_1.Timestamp.fromDate(new Date()),
        };
        // 비밀번호가 제공된 경우에만 해시화하여 업데이트
        if (data.password) {
            updateData.password = await (0, password_1.hashPassword)(data.password);
        }
        // 다른 필드 업데이트
        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.enabled !== undefined) {
            updateData.enabled = data.enabled;
        }
        await firebase_1.firestore.collection('admins').doc(id).update(removeUndefinedFields(updateData));
    }
    catch (error) {
        console.error('[updateAdmin] 에러:', error.message);
        throw error;
    }
}
/**
 * 관리자의 마지막 로그인 시간을 업데이트합니다.
 */
async function updateLastLoginAt(id) {
    try {
        await firebase_1.firestore.collection('admins').doc(id).update({
            lastLoginAt: firestore_1.Timestamp.fromDate(new Date()),
            updatedAt: firestore_1.Timestamp.fromDate(new Date()),
        });
    }
    catch (error) {
        console.error('[updateLastLoginAt] 에러:', error.message);
        throw error;
    }
}
/**
 * 관리자를 비활성화합니다 (물리적 삭제 대신 enabled: false로 설정).
 */
async function deleteAdmin(id) {
    try {
        await firebase_1.firestore.collection('admins').doc(id).update({
            enabled: false,
            updatedAt: firestore_1.Timestamp.fromDate(new Date()),
        });
    }
    catch (error) {
        console.error('[deleteAdmin] 에러:', error.message);
        throw error;
    }
}
//# sourceMappingURL=adminService.js.map