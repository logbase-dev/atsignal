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
exports.getStibeeConfig = getStibeeConfig;
const functions = __importStar(require("firebase-functions"));
/**
 * Stibee API 호출에 필요한 핵심 설정 값
 */
function getStibeeConfig() {
    const config = functions.config();
    const apiKey = config.stibee?.api_key;
    const listId = config.stibee?.list_id;
    const apiBaseUrl = config.stibee?.api_base_url || 'https://api.stibee.com/v2';
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