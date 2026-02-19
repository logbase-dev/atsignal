import * as admin from "firebase-admin";

// Firebase Admin SDK 초기화 (서버 사이드에서만 사용)
if (admin.apps.length === 0) {
  try {
    // 환경에 따라 다른 초기화 방식 사용
    if (process.env.NODE_ENV === 'development') {
      // 개발 환경: Firebase 에뮬레이터 또는 Service Account Key 사용
      const useEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST;
      
      if (useEmulator) {
        // 에뮬레이터 사용 시 (env 필수, 배포별로 다른 프로젝트 사용)
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log('[Firebase Admin] 개발 환경 초기화 완료 (에뮬레이터 사용)');
      } else {
        // Service Account Key 사용
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        
        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(serviceAccount)),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
          console.log('[Firebase Admin] 개발 환경 초기화 완료 (Service Account Key 사용)');
        } else {
          // ADC 사용 (env 없으면 credential에서 프로젝트 추론)
          admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            credential: admin.credential.applicationDefault(),
          });
          console.log('[Firebase Admin] 개발 환경 초기화 완료 (ADC 사용)');
        }
      }
    } else {
      // 프로덕션 환경: 기본 초기화
      admin.initializeApp();
      console.log('[Firebase Admin] 프로덕션 환경 초기화 완료');
    }
  } catch (error: any) {
    console.error('[Firebase Admin] 초기화 실패:', error);
    throw error;
  }
}

export { admin };
export const db = admin.firestore();
export const storage = admin.storage();