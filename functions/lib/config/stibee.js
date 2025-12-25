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
exports.requireStibeeConfig = exports.stibeeConfig = void 0;
const functions = __importStar(require("firebase-functions"));
/**
 * Firebase Functions runtime config 혹은 환경변수에서
 * Stibee 연동에 필요한 기본 정보를 불러온다.
 * - 로컬 개발 시 .env / process.env 사용
 * - 배포 환경에서는 `firebase functions:config:set` 값 우선
 */
const runtimeConfig = functions.config?.() ?? {};
/**
 * Stibee API 호출에 필요한 핵심 설정 값 모음.
 */
exports.stibeeConfig = {
    apiKey: process.env.STIBEE_API_KEY ?? runtimeConfig.stibee?.api_key ?? "",
    listId: process.env.STIBEE_LIST_ID ?? runtimeConfig.stibee?.list_id ?? "",
    apiBaseUrl: process.env.STIBEE_API_BASE_URL ??
        runtimeConfig.stibee?.api_base_url ??
        "https://api.stibee.com/v2",
    subscribersCollection: process.env.SUBSCRIBERS_COLLECTION ?? "subscribers",
};
/**
 * 필수 설정이 누락된 경우 함수를 즉시 종료시켜
 * 잘못된 구성으로 API를 호출하는 상황을 방지한다.
 */
const requireStibeeConfig = () => {
    if (!exports.stibeeConfig.apiKey) {
        throw new functions.https.HttpsError("failed-precondition", "STIBEE_API_KEY is not configured.");
    }
    if (!exports.stibeeConfig.listId) {
        throw new functions.https.HttpsError("failed-precondition", "STIBEE_LIST_ID is not configured.");
    }
};
exports.requireStibeeConfig = requireStibeeConfig;
//# sourceMappingURL=stibee.js.map