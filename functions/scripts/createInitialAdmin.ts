import { config } from 'dotenv';
import { resolve } from 'path';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';

// .env.local (또는 .env) 로드 – 필요 없으면 생략 가능
config({ path: resolve(process.cwd(), '.env.local') });

// ✅ 에뮬레이터로 강제 설정 (포트 8080 기준)
//   - firebase emulators:start --only firestore 로 띄워둔 상태여야 함
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'atsignal',
  });
}

const firestore = admin.firestore();

// 초기 관리자 정보
const INITIAL_ADMIN_USERNAME = process.env.INITIAL_ADMIN_USERNAME || process.argv[2] || 'admin';
const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || process.argv[3] || 'admin1234';
const INITIAL_ADMIN_NAME = process.env.INITIAL_ADMIN_NAME || process.argv[4] || '관리자';

async function createInitialAdmin() {
  try {
    const username = INITIAL_ADMIN_USERNAME.toLowerCase();

    // 아이디 중복 체크
    const adminsRef = firestore.collection('admins');
    const q = adminsRef.where('username', '==', username);
    const snap = await q.get();

    if (!snap.empty) {
      console.error(`❌ 에러: 아이디 '${username}'는 이미 사용 중입니다.`);
      process.exit(1);
    }

    console.log('비밀번호 해시화 중...');
    const hashedPassword = await bcrypt.hash(INITIAL_ADMIN_PASSWORD, 10);

    const now = new Date();
    const adminData = {
      username,
      password: hashedPassword,
      name: INITIAL_ADMIN_NAME,
      enabled: true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: null,
    };

    console.log('관리자 계정 생성 중...');
    const docRef = await adminsRef.add(adminData);

    console.log('\n✅ 초기 관리자 계정이 성공적으로 생성되었습니다!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`관리자 ID: ${docRef.id}`);
    console.log(`아이디: ${username}`);
    console.log(`이름: ${INITIAL_ADMIN_NAME}`);
    console.log(`비밀번호: ${INITIAL_ADMIN_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createInitialAdmin();