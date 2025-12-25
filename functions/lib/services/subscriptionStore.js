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
exports.createSyncedSubscription = exports.markSubscriptionFailed = exports.markSubscriptionSynced = exports.updateSubscriptionStatus = exports.createPendingSubscription = exports.parseSubscribeRequest = exports.normalizePhone = exports.normalizeEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_1 = require("../firebase");
const firestore_1 = require("firebase-admin/firestore"); // ← 추가
const stibee_1 = require("../config/stibee");
/**
 * 기본적인 이메일/휴대폰 검증을 위해 사용하는 정규식.
 * 서비스 정책에 따라 세부 규칙을 확장할 수 있다.
 */
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_REGEX = /^010-?\d{4}-?\d{4}$/;
const normalizeEmail = (value) => value.trim().toLowerCase();
exports.normalizeEmail = normalizeEmail;
const normalizePhone = (value) => value.replace(/[^\d]/g, "");
exports.normalizePhone = normalizePhone;
/**
 * HTTP 요청 본문을 검증하고 유효한 구독 요청으로 변환한다.
 */
const parseSubscribeRequest = (body) => {
    if (!body || typeof body !== "object") {
        throw new functions.https.HttpsError("invalid-argument", "요청 본문이 올바르지 않습니다.");
    }
    const { name, company, email, phone, privacyConsent } = body;
    if (typeof name !== "string" || name.trim().length < 2) {
        throw new functions.https.HttpsError("invalid-argument", "성함을 정확히 입력해 주세요.");
    }
    if (typeof company !== "string" ||
        company.trim().length < 2) {
        throw new functions.https.HttpsError("invalid-argument", "소속/회사명을 정확히 입력해 주세요.");
    }
    if (typeof email !== "string" ||
        !EMAIL_REGEX.test(email)) {
        throw new functions.https.HttpsError("invalid-argument", "이메일 형식이 올바르지 않습니다.");
    }
    if (typeof phone !== "string" ||
        !PHONE_REGEX.test(phone)) {
        throw new functions.https.HttpsError("invalid-argument", "휴대폰 번호 형식이 올바르지 않습니다.");
    }
    if (privacyConsent !== true) {
        throw new functions.https.HttpsError("invalid-argument", "개인정보 처리방침에 동의해야 합니다.");
    }
    return {
        name: name.trim(),
        company: company.trim(),
        email: (0, exports.normalizeEmail)(email),
        phone,
        privacyConsent: true,
    };
};
exports.parseSubscribeRequest = parseSubscribeRequest;
/**
 * 구독 요청을 Firestore에 `pending` 상태로 기록한다.
 * Stibee 동기화 결과는 이후 업데이트 단계에서 덮어쓴다.
 */
const createPendingSubscription = async (payload) => {
    const docRef = firebase_1.firestore
        .collection(stibee_1.stibeeConfig.subscribersCollection)
        .doc();
    const now = firestore_1.FieldValue.serverTimestamp(); // ← 수정: admin.firestore.FieldValue → FieldValue
    await docRef.set({
        ...payload,
        emailNormalized: payload.email,
        phoneNormalized: (0, exports.normalizePhone)(payload.phone),
        status: "pending",
        stibee: {
            listId: stibee_1.stibeeConfig.listId,
            subscriberId: null,
            lastSyncedAt: null,
            lastResult: null,
        },
        consent: {
            agreedAt: now,
            source: "website:newsletter",
        },
        createdAt: now,
        updatedAt: now,
    });
    return { id: docRef.id, ref: docRef };
};
exports.createPendingSubscription = createPendingSubscription;
/**
 * 공통적인 상태 업데이트 로직. 추가 필드를 함께 변경할 때 재사용한다.
 */
const updateSubscriptionStatus = async (docRef, status, data) => {
    await docRef.update({
        status,
        ...data,
        updatedAt: firestore_1.FieldValue.serverTimestamp(), // ← 수정
    });
};
exports.updateSubscriptionStatus = updateSubscriptionStatus;
/**
 * Stibee 동기화 성공 시 호출되어 `subscribed` 상태로 전환한다.
 */
const markSubscriptionSynced = async (docRef, options) => {
    await (0, exports.updateSubscriptionStatus)(docRef, "subscribed", {
        stibee: {
            listId: stibee_1.stibeeConfig.listId,
            subscriberId: options.subscriberId ?? null,
            lastSyncedAt: firestore_1.FieldValue.serverTimestamp(), // ← 수정
            lastResult: {
                code: options.statusCode,
                message: options.message ?? "OK",
            },
        },
    });
};
exports.markSubscriptionSynced = markSubscriptionSynced;
/**
 * 외부 API 실패 등의 사유를 Firestore에 기록한다.
 * 필요 시 별도의 재시도 프로세스에서 이 정보를 활용할 수 있다.
 */
const markSubscriptionFailed = async (docRef, options) => {
    await (0, exports.updateSubscriptionStatus)(docRef, "error", {
        stibee: {
            listId: stibee_1.stibeeConfig.listId,
            subscriberId: null,
            lastSyncedAt: firestore_1.FieldValue.serverTimestamp(), // ← 수정
            lastResult: {
                code: options.statusCode,
                message: options.message,
            },
        },
    });
};
exports.markSubscriptionFailed = markSubscriptionFailed;
/**
 * ✅ Stibee 동기화 성공 후 Firestore에 저장 (새 함수)
 * 기존 createPendingSubscription 대신 사용
 */
const createSyncedSubscription = async (payload, stibeeResult) => {
    const docRef = firebase_1.firestore
        .collection(stibee_1.stibeeConfig.subscribersCollection)
        .doc();
    const now = firestore_1.FieldValue.serverTimestamp();
    await docRef.set({
        ...payload,
        emailNormalized: payload.email,
        phoneNormalized: (0, exports.normalizePhone)(payload.phone),
        status: "subscribed", // ✅ 바로 subscribed 상태
        stibee: {
            listId: stibee_1.stibeeConfig.listId,
            subscriberId: stibeeResult.subscriberId ?? null,
            lastSyncedAt: now,
            lastResult: {
                code: stibeeResult.statusCode,
                message: stibeeResult.message ?? "OK",
            },
        },
        consent: {
            agreedAt: now,
            source: "website:newsletter",
        },
        createdAt: now,
        updatedAt: now,
    });
    return { id: docRef.id };
};
exports.createSyncedSubscription = createSyncedSubscription;
//# sourceMappingURL=subscriptionStore.js.map