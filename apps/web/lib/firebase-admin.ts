import * as admin from "firebase-admin";

// Firebase Admin SDK 초기화 (서버 사이드에서만 사용)
if (admin.apps.length === 0) {
  try {
    // 환경에 따라 다른 초기화 방식 사용
    if (process.env.NODE_ENV === 'development') {
      // 개발 환경: Service Account Key 사용
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccount) {
        // 환경 변수에서 Service Account Key 사용
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'atsignal',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'atsignal.firebasestorage.app',
        });
        console.log('[Firebase Admin] 개발 환경 초기화 완료 (Service Account Key 사용)');
      } else {
        // Service Account Key가 없으면 ADC 사용 (Signed URL 제한)
        admin.initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'atsignal',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'atsignal.firebasestorage.app',
          credential: admin.credential.applicationDefault(),
        });
        console.log('[Firebase Admin] 개발 환경 초기화 완료 (ADC 사용 - Signed URL 제한)');
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