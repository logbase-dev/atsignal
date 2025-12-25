"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncSubscriber = void 0;
const functions = __importStar(require("firebase-functions")); // ← 추가
const stibee_1 = require("../config/stibee");
const types_1 = require("./types");
/**
 * Stibee 구독자 API에 단일 구독자를 추가한다.
 * - 구성된 payload는 `subscribers` 배열로 감싸 전송.
 * - 성공/실패 여부를 StibeeSyncResult 또는 StibeeApiError로 구분한다.
 */
const syncSubscriber = async (payload) => {
    (0, stibee_1.requireStibeeConfig)();
    // 디버깅: payload 확인
    functions.logger.info("syncSubscriber payload:", {
        email: payload.email,
        name: payload.name,
        company: payload.company,
        phoneNormalized: payload.phoneNormalized,
    });
    // 이메일 검증
    if (!payload.email || payload.email.trim() === "") {
        throw new Error("Email is required but was empty or undefined");
    }
    const url = `${stibee_1.stibeeConfig.apiBaseUrl}/lists/${stibee_1.stibeeConfig.listId}/subscribers`;
    // Stibee API 실제 형식에 맞게 수정
    const requestBody = {
        subscriber: {
            email: payload.email.trim(),
            status: "subscribed",
            marketingAllowed: true,
            fields: {
                name: payload.name,
                company: payload.company,
                phone: payload.phoneNormalized,
            },
        },
        updateEnabled: false, // ✅ 변경: 이미 구독 중인 경우 업데이트하지 않음
    };
    // 디버깅: 요청 본문 확인
    // functions.logger.info("Stibee API request body:", JSON.stringify(requestBody, null, 2));
    // functions.logger.info("Stibee API URL:", url);
    // functions.logger.info("Stibee API Key (first 10 chars):", stibeeConfig.apiKey?.substring(0, 10));
    // functions.logger.info("Stibee List ID:", stibeeConfig.listId);
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            AccessToken: stibee_1.stibeeConfig.apiKey,
        },
        body: JSON.stringify(requestBody),
    });
    const rawBody = await response.text();
    // 디버깅: 응답 확인
    // functions.logger.info("Stibee API response status:", response.status);
    // functions.logger.info("Stibee API response body:", rawBody);
    let parsedBody;
    try {
        parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
    }
    catch {
        parsedBody = undefined;
    }
    if (!response.ok) {
        // 에러 응답 상세 로깅
        functions.logger.error("Stibee API error:", {
            status: response.status,
            statusText: response.statusText,
            body: rawBody,
            parsedBody: parsedBody,
        });
        throw new types_1.StibeeApiError(response.status, rawBody);
    }
    return {
        status: response.status,
        data: parsedBody,
        rawBody,
    };
};
exports.syncSubscriber = syncSubscriber;
//# sourceMappingURL=client.js.map