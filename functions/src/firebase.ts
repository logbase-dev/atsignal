import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

/**
 * Functions 환경에서 Firebase Admin SDK는 싱글턴으로
 * 초기화해야 하므로 중복 호출을 방지한다.
 */

// ✅ .env.local 파일 자동 로드 (에뮬레이터 모드에서만)
const isEmulator = !!process.env.FUNCTIONS_EMULATOR;
if (isEmulator) {
  const envLocalPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // 이미 설정된 환경 변수는 덮어쓰지 않음
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('[Firebase] ✅ .env.local 파일 로드 완료');
  }
}

// 디버깅: 모든 환경변수 확인 (가장 먼저 출력)
console.log(`[Firebase] 🔍 디버깅: isEmulator = ${isEmulator}`);
console.log(`[Firebase] 🔍 디버깅: USE_SERVER_FIRESTORE_STORAGE = "${process.env.USE_SERVER_FIRESTORE_STORAGE}"`);
console.log(`[Firebase] 🔍 디버깅: typeof USE_SERVER_FIRESTORE_STORAGE = ${typeof process.env.USE_SERVER_FIRESTORE_STORAGE}`);

const useServerFirestoreStorage = process.env.USE_SERVER_FIRESTORE_STORAGE === 'true' || process.env.USE_SERVER_FIRESTORE_STORAGE === '1';
console.log(`[Firebase] 🔍 디버깅: useServerFirestoreStorage = ${useServerFirestoreStorage}`);

// ✅ 에뮬레이터 모드에서 환경 변수 설정 (initializeApp 전에 반드시 설정)
if (isEmulator) {
  
  // 서버 Firestore/Storage를 사용하는 경우 에뮬레이터 환경변수를 설정하지 않음
  if (!useServerFirestoreStorage) {
    // 로컬 에뮬레이터 사용
    // Firestore 에뮬레이터
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    }
    
    // Storage 에뮬레이터
    if (!process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
      process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
    }
    
    // Application Default Credentials 비활성화
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(`[Firebase] ⚠️ GOOGLE_APPLICATION_CREDENTIALS 비활성화`);
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    }
  } else {
    // 서버 Firestore/Storage를 사용하는 경우 에뮬레이터 환경변수 제거
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    
    console.log(`[Firebase] ⚠️ 서버 Firestore/Storage 사용 모드`);
    console.log(`[Firebase] - Functions는 에뮬레이터, Firestore/Storage는 프로덕션 연결`);
    console.log(`[Firebase] - GOOGLE_APPLICATION_CREDENTIALS: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || '기본 credential 사용'}`);
  }
  
  // 프로젝트 ID 설정
  if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = 'atsignal';
  }
  
  console.log(`[Firebase] ✅ 에뮬레이터 모드 설정 완료`);
  console.log(`[Firebase] - FIRESTORE_EMULATOR_HOST: ${process.env.FIRESTORE_EMULATOR_HOST || '프로덕션'}`);
  console.log(`[Firebase] - FIREBASE_STORAGE_EMULATOR_HOST: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST || '프로덕션'}`);
  console.log(`[Firebase] - GCLOUD_PROJECT: ${process.env.GCLOUD_PROJECT}`);
}

// ✅ initializeApp() 호출
if (admin.apps.length === 0) {
  if (isEmulator) {
    const projectId = process.env.GCLOUD_PROJECT || 'atsignal';
    // Firebase의 새로운 Storage bucket 형식: 프로젝트ID.firebasestorage.app
    const storageBucket = process.env.STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
    
    // firebase-admin 초기화
    // 참고: Storage Signed URL은 @google-cloud/storage에서 별도로 ADC를 사용하므로
    // firebase-admin 초기화는 credential 없이도 가능
    try {
      const initOptions: admin.AppOptions = {
        projectId,
        storageBucket,
      };
      
      // 서버 Firestore/Storage를 사용하는 경우 Application Default Credentials 시도
      // (실패해도 에러 없이 진행 - Storage는 @google-cloud/storage에서 처리)
      if (useServerFirestoreStorage) {
        try {
          initOptions.credential = admin.credential.applicationDefault();
          console.log('[Firebase] Application Default Credentials 사용');
        } catch (credError: any) {
          console.warn('[Firebase] ⚠️ Application Default Credentials 설정 실패:', credError.message);
          console.log('[Firebase] ⚠️ credential 없이 초기화합니다 (Storage는 @google-cloud/storage에서 ADC 사용)');
          // credential 없이 초기화 진행
        }
      }
      
      admin.initializeApp(initOptions);
    } catch (error: any) {
      // 이미 초기화된 경우 무시
      if (error?.code !== 'app/already-initialized') {
        console.error('[Firebase] Admin SDK 초기화 실패:', error);
        throw error;
      }
    }
    
    console.log(`[Firebase] Admin SDK 초기화 완료 (에뮬레이터 모드)`);
    console.log(`[Firebase] - 프로젝트: ${projectId}`);
    console.log(`[Firebase] - Storage: ${storageBucket}`);
    console.log(`[Firebase] - Firestore/Storage: ${useServerFirestoreStorage ? '프로덕션' : '에뮬레이터'}`);
  } else {
    admin.initializeApp();
    console.log(`[Firebase] Admin SDK 초기화 완료 (프로덕션 모드)`);
  }
}

export { admin };

// ✅ Firestore 인스턴스 생성 및 명시적으로 에뮬레이터 설정
let firestore: admin.firestore.Firestore;

if (isEmulator && process.env.FIRESTORE_EMULATOR_HOST) {
  // ✅ 로컬 에뮬레이터 사용
  firestore = admin.firestore();
  
  // ✅ 명시적으로 에뮬레이터 설정 확인
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  console.log(`[Firebase] ✅ Firestore 에뮬레이터 연결: ${emulatorHost}`);
  console.log(`[Firebase] ⚠️ 실제 연결 여부를 테스트합니다...`);
  
  // ✅ 실제 연결 테스트 (에뮬레이터에 데이터 쓰기/읽기) - Promise로 처리
  (async () => {
    try {
      const testRef = firestore.collection('_firestore_emulator_test').doc('connection');
      await testRef.set({ 
        timestamp: FieldValue.serverTimestamp(), // ✅ FieldValue 직접 import 사용
        test: true 
      });
      const testSnap = await testRef.get();
      
      if (testSnap.exists) {
        console.log('[Firebase] ✅ 에뮬레이터 연결 테스트 성공 (쓰기/읽기 확인)');
        // 테스트 문서 삭제
        await testRef.delete();
      } else {
        console.error('[Firebase] ❌ 에뮬레이터 연결 테스트 실패: 문서를 읽을 수 없습니다');
        console.error('[Firebase] ⚠️ 프로덕션 Firestore에 연결되었을 가능성이 있습니다!');
      }
    } catch (err: any) {
      console.error('[Firebase] ❌ 에뮬레이터 연결 테스트 실패:', err.message);
      console.error('[Firebase] ⚠️ 프로덕션 Firestore에 연결되었을 가능성이 있습니다!');
      console.error('[Firebase] ⚠️ 에러 상세:', err);
    }
  })(); // ✅ 즉시 실행 함수(IIFE)로 감싸서 비동기 처리
} else if (isEmulator && useServerFirestoreStorage) {
  // ✅ Functions는 에뮬레이터지만 Firestore는 프로덕션
  firestore = admin.firestore();
  console.log(`[Firebase] ✅ Firestore 프로덕션 연결 (Functions는 에뮬레이터)`);
} else {
  // ✅ 프로덕션 모드
  firestore = admin.firestore();
  console.log(`[Firebase] ✅ 프로덕션 Firestore 연결`);
}

export { firestore };
