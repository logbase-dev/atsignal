"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StibeeApiError = void 0;
/**
 * Stibee API 호출 실패 시 세부 정보를 함께 전달하기 위한 에러 타입
 */
class StibeeApiError extends Error {
    constructor(status, body) {
        super(`Stibee API Error (${status})`);
        this.status = status;
        this.body = body;
    }
}
exports.StibeeApiError = StibeeApiError;
//# sourceMappingURL=types.js.map