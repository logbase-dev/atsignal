import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 환경 변수 체크 및 디버깅
const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => value !== undefined && value !== null && value !== ''
);

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
  } else {
    console.log('[Firebase] 초기화 중...', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    });
  }
}

let app: ReturnType<typeof initializeApp> | null = null;

try {
  if (isFirebaseConfigured) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      if (typeof window !== 'undefined') {
        console.log('[Firebase] 앱 초기화 완료');
      }
    } else {
      app = getApps()[0];
      if (typeof window !== 'undefined') {
        console.log('[Firebase] 기존 앱 사용');
      }
    }
  } else {
    if (typeof window !== 'undefined') {
      console.warn('[Firebase] 환경 변수가 설정되지 않아 초기화를 건너뜁니다.');
    }
  }
} catch (error) {
  console.error('[Firebase] 초기화 실패:', error);
  app = null;
}

let db: ReturnType<typeof getFirestore> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

if (app) {
  try {
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      console.log('[Firebase] Firestore 초기화 완료');
    }
  } catch (error) {
    console.error('[Firebase] Firestore 초기화 실패:', error);
    db = null;
  }

  try {
    storage = getStorage(app);
    if (typeof window !== 'undefined') {
      console.log('[Firebase] Storage 초기화 완료');
    }
  } catch (error) {
    console.error('[Firebase] Storage 초기화 실패:', error);
    storage = null;
  }
} else {
  if (typeof window !== 'undefined') {
    console.error('[Firebase] 앱이 초기화되지 않아 Firestore와 Storage를 초기화할 수 없습니다.');
  }
}

export { db, storage };

