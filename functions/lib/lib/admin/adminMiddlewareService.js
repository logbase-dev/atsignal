"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminExistsAndEnabled = checkAdminExistsAndEnabled;
const firebase_1 = require("../../firebase");
/**
 * Middleware 전용: 관리자 ID로 관리자 존재 여부 및 활성화 상태만 확인
 * bcrypt를 사용하지 않으므로 Edge Runtime에서 실행 가능
 */
async function checkAdminExistsAndEnabled(adminId) {
    try {
        const adminDoc = await firebase_1.firestore.collection("admins").doc(adminId).get();
        if (!adminDoc.exists) {
            return false;
        }
        const data = adminDoc.data();
        if (!data)
            return false;
        return data.enabled === true;
    }
    catch (error) {
        console.error("[checkAdminExistsAndEnabled] 에러:", error.message);
        return false;
    }
}
//# sourceMappingURL=adminMiddlewareService.js.map