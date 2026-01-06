import { config } from 'dotenv';
import { resolve } from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

// .env.local 파일 로드
config({ path: resolve(process.cwd(), '.env.local') });

// 환경 변수에서 Firebase 설정 읽기
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 초기 관리자 정보 (환경 변수 또는 명령줄 인자로 받기)
const INITIAL_ADMIN_USERNAME = process.env.INITIAL_ADMIN_USERNAME || process.argv[2] || 'admin';
const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3] || 'admin1234';
const INITIAL_ADMIN_NAME = process.env.INITIAL_ADMIN_NAME || process.argv[4] || '관리자';

async function createInitialAdmin() {
  try {
    // Firebase 초기화
    let app;
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] 앱 초기화 완료');
    } else {
      app = getApps()[0];
      console.log('[Firebase] 기존 앱 사용');
    }

    const db = getFirestore(app);
    console.log('[Firebase] Firestore 초기화 완료');

    // 아이디 중복 체크
    const username = INITIAL_ADMIN_USERNAME.toLowerCase();
    const adminsRef = collection(db, 'admins');
    const q = query(adminsRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.error(`❌ 에러: 아이디 '${username}'는 이미 사용 중입니다.`);
      process.exit(1);
    }

    // 비밀번호 해시화
    console.log('비밀번호 해시화 중...');
    const hashedPassword = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);

    // 관리자 데이터 생성
    const now = new Date();
    const adminData = {
      username: username,
      password: hashedPassword,
      name: INITIAL_ADMIN_NAME,
      enabled: true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: null, // 최초 관리자는 null
    };

    // Firestore에 추가
    console.log('관리자 계정 생성 중...');
    const docRef = await addDoc(collection(db, 'admins'), adminData);

    console.log('\n✅ 초기 관리자 계정이 성공적으로 생성되었습니다!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`관리자 ID: ${docRef.id}`);
    console.log(`아이디: ${username}`);
    console.log(`이름: ${INITIAL_ADMIN_NAME}`);
    console.log(`비밀번호: ${INITIAL_ADMIN_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  보안을 위해 비밀번호를 안전한 곳에 보관하세요.');
    console.log('   환경 변수나 명령줄에서 제공한 경우 즉시 변경하는 것을 권장합니다.\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
createInitialAdmin();

