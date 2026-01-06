"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStibeeConfig = getStibeeConfig;
/**
 * Stibee API 호출에 필요한 핵심 설정 값
 */
function getStibeeConfig() {
    const apiKey = process.env.STIBEE_API_KEY;
    const listId = process.env.STIBEE_LIST_ID;
    const apiBaseUrl = process.env.STIBEE_API_BASE_URL || 'https://api.stibee.com/v2';
    if (!apiKey || !listId) {
        throw new Error('Stibee 설정이 완료되지 않았습니다. STIBEE_API_KEY와 STIBEE_LIST_ID를 확인해주세요.');
    }
    return {
        apiKey,
        listId,
        apiBaseUrl,
    };
}
//# sourceMappingURL=config.js.map