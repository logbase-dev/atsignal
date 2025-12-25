"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.db = void 0;
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const storage_1 = require("firebase/storage");
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
// 환경 변수 체크 및 디버깅
const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => value !== undefined && value !== null && value !== '');
if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서만 로깅
    if (!isFirebaseConfigured) {
        console.error('[Firebase] 환경 변수가 설정되지 않았습니다.');
        console.error('[Firebase] 설정된 환경 변수:', {
            apiKey: firebaseConfig.apiKey ? '✓' : '✗',
            authDomain: firebaseConfig.authDomain ? '✓' : '✗',
            projectId: firebaseConfig.projectId ? '✓' : '✗',
            storageBucket: firebaseConfig.storageBucket ? '✓' : '✗',
            messagingSenderId: firebaseConfig.messagingSenderId ? '✓' : '✗',
            appId: firebaseConfig.appId ? '✓' : '✗',
        });
    }
    else {
        console.log('[Firebase] 초기화 중...', {
            projectId: firebaseConfig.projectId,
            authDomain: firebaseConfig.authDomain,
        });
    }
}
let app = null;
try {
    if (isFirebaseConfigured) {
        if ((0, app_1.getApps)().length === 0) {
            app = (0, app_1.initializeApp)(firebaseConfig);
            if (typeof window !== 'undefined') {
                console.log('[Firebase] 앱 초기화 완료');
            }
        }
        else {
            app = (0, app_1.getApps)()[0];
            if (typeof window !== 'undefined') {
                console.log('[Firebase] 기존 앱 사용');
            }
        }
    }
    else {
        if (typeof window !== 'undefined') {
            console.warn('[Firebase] 환경 변수가 설정되지 않아 초기화를 건너뜁니다.');
        }
    }
}
catch (error) {
    console.error('[Firebase] 초기화 실패:', error);
    app = null;
}
let db = null;
exports.db = db;
let storage = null;
exports.storage = storage;
if (app) {
    try {
        exports.db = db = (0, firestore_1.getFirestore)(app);
        if (typeof window !== 'undefined') {
            console.log('[Firebase] Firestore 초기화 완료');
        }
    }
    catch (error) {
        console.error('[Firebase] Firestore 초기화 실패:', error);
        exports.db = db = null;
    }
    try {
        exports.storage = storage = (0, storage_1.getStorage)(app);
        if (typeof window !== 'undefined') {
            console.log('[Firebase] Storage 초기화 완료');
        }
    }
    catch (error) {
        console.error('[Firebase] Storage 초기화 실패:', error);
        exports.storage = storage = null;
    }
}
else {
    if (typeof window !== 'undefined') {
        console.error('[Firebase] 앱이 초기화되지 않아 Firestore와 Storage를 초기화할 수 없습니다.');
    }
}
//# sourceMappingURL=firebase.js.map