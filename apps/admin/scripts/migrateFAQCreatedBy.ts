// apps/admin/scripts/migrateFAQCreatedBy.ts

import { config } from 'dotenv';
import { resolve } from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

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

// 기본 관리자 ID (환경 변수 또는 명령줄 인자로 받기)
// createdBy가 없을 때 사용할 기본 관리자 ID
const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID || process.argv[2] || null;

async function migrateFAQCreatedBy() {
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
    console.log('[Firebase] Firestore 초기화 완료\n');

    // 기본 관리자 ID 확인
    if (!DEFAULT_ADMIN_ID) {
      console.error('❌ 에러: 기본 관리자 ID가 필요합니다.');
      console.error('   사용법: tsx scripts/migrateFAQCreatedBy.ts <관리자ID>');
      console.error('   또는 환경 변수: DEFAULT_ADMIN_ID=<관리자ID>');
      console.error('\n   관리자 ID는 /api/admins에서 확인할 수 있습니다.');
      process.exit(1);
    }

    console.log(`📋 기본 관리자 ID: ${DEFAULT_ADMIN_ID}\n`);

    // 모든 FAQ 조회
    console.log('FAQ 데이터 조회 중...');
    const faqsRef = collection(db, 'faqs');
    const querySnapshot = await getDocs(faqsRef);

    if (querySnapshot.empty) {
      console.log('✅ FAQ가 없습니다. 마이그레이션이 필요하지 않습니다.');
      process.exit(0);
    }

    console.log(`총 ${querySnapshot.size}개의 FAQ를 찾았습니다.\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 각 FAQ 확인 및 업데이트
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const faqId = docSnap.id;
      const needsUpdate: any = {};

      // createdBy가 없으면 기본 관리자 ID로 설정
      if (!data.createdBy) {
        needsUpdate.createdBy = DEFAULT_ADMIN_ID;
      }

      // updatedBy가 없으면 createdBy와 동일하게 설정
      if (!data.updatedBy) {
        needsUpdate.updatedBy = data.createdBy || DEFAULT_ADMIN_ID;
      }

      // 업데이트가 필요한 경우
      if (Object.keys(needsUpdate).length > 0) {
        try {
          const faqRef = doc(db, 'faqs', faqId);
          await updateDoc(faqRef, needsUpdate);
          
          updatedCount++;
          const question = data.question?.ko || data.question?.en || '제목 없음';
          console.log(`✅ [${updatedCount}] FAQ 업데이트: ${question.substring(0, 50)}...`);
          console.log(`   ID: ${faqId}`);
          console.log(`   업데이트 필드: ${Object.keys(needsUpdate).join(', ')}`);
          console.log('');
        } catch (error: any) {
          errorCount++;
          console.error(`❌ [${errorCount}] FAQ 업데이트 실패: ${faqId}`);
          console.error(`   에러: ${error.message}\n`);
        }
      } else {
        skippedCount++;
        // 이미 필드가 있는 경우 조용히 스킵 (너무 많은 로그 방지)
        if (skippedCount <= 5 || skippedCount % 10 === 0) {
          console.log(`⏭️  [${skippedCount}] 이미 업데이트된 FAQ: ${faqId}`);
        }
      }
    }

    // 결과 출력
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 마이그레이션 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 업데이트된 FAQ: ${updatedCount}개`);
    console.log(`⏭️  스킵된 FAQ: ${skippedCount}개`);
    console.log(`❌ 실패한 FAQ: ${errorCount}개`);
    console.log(`📋 전체 FAQ: ${querySnapshot.size}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (errorCount > 0) {
      console.error('⚠️  일부 FAQ 업데이트에 실패했습니다. 위의 에러를 확인하세요.\n');
      process.exit(1);
    }

    console.log('✅ 모든 FAQ가 성공적으로 마이그레이션되었습니다!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
migrateFAQCreatedBy();