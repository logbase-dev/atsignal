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

// 기본 관리자 ID (환경 변수 또는 명령줄 인자)
const DEFAULT_ADMIN_ID = process.env.DEFAULT_ADMIN_ID || process.argv[2] || null;

async function migrateCollection(collectionName: string, displayName: string) {
  try {
    console.log(`\n📋 ${displayName} 마이그레이션 시작...`);
    
    const db = getFirestore();
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      const docId = docSnap.id;
      const needsUpdate: Record<string, any> = {};
      
      // createdBy가 없으면 기본 관리자 ID 설정
      if (!data.createdBy) {
        needsUpdate.createdBy = DEFAULT_ADMIN_ID;
      }
      
      // updatedBy가 없으면 createdBy 값으로 설정 (또는 기본 관리자 ID)
      if (!data.updatedBy) {
        needsUpdate.updatedBy = data.createdBy || DEFAULT_ADMIN_ID;
      }
      
      // 업데이트할 필드가 있으면 업데이트
      if (Object.keys(needsUpdate).length > 0) {
        try {
          const docRef = doc(db, collectionName, docId);
          await updateDoc(docRef, needsUpdate);
          
          // 문서 식별자를 위한 정보 출력 (페이지는 slug, 메뉴는 path, 카테고리는 name)
          let identifier = docId;
          if (data.slug) identifier = `slug: ${data.slug}`;
          else if (data.path) identifier = `path: ${data.path}`;
          else if (data.name?.ko) identifier = `name: ${data.name.ko}`;
          
          console.log(`  ✅ [${updatedCount + 1}] ${displayName} 업데이트: ${identifier}... ID: ${docId}`);
          console.log(`     업데이트 필드: ${Object.keys(needsUpdate).join(', ')}`);
          
          updatedCount++;
        } catch (error: any) {
          console.error(`  ❌ [${errorCount + 1}] ${displayName} 업데이트 실패 (ID: ${docId}):`, error.message);
          errorCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n📊 ${displayName} 마이그레이션 완료`);
    console.log(`   ✅ 업데이트된 항목: ${updatedCount}개`);
    console.log(`   ⏭️  스킵된 항목: ${skippedCount}개`);
    console.log(`   ❌ 실패한 항목: ${errorCount}개`);
    console.log(`   📋 전체 항목: ${querySnapshot.size}개`);
    
    return { updated: updatedCount, skipped: skippedCount, errors: errorCount, total: querySnapshot.size };
  } catch (error: any) {
    console.error(`\n❌ ${displayName} 마이그레이션 중 오류 발생:`, error.message);
    throw error;
  }
}

async function migrateAll() {
  try {
    if (!DEFAULT_ADMIN_ID) {
      console.error('❌ 에러: 기본 관리자 ID가 필요합니다.');
      console.error('   사용법: tsx scripts/migrateCreatedBy.ts <관리자ID>');
      console.error('   또는 환경 변수: DEFAULT_ADMIN_ID=<관리자ID>');
      console.error('\n   관리자 ID는 /api/admins에서 확인할 수 있습니다.');
      process.exit(1);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Firestore 마이그레이션 시작');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`기본 관리자 ID: ${DEFAULT_ADMIN_ID}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

    // 각 컬렉션 마이그레이션
    const pagesResult = await migrateCollection('pages', '페이지');
    const menusResult = await migrateCollection('menus', '메뉴');
    const categoriesResult = await migrateCollection('faqCategories', 'FAQ 카테고리');

    // 전체 결과 요약
    const totalUpdated = pagesResult.updated + menusResult.updated + categoriesResult.updated;
    const totalSkipped = pagesResult.skipped + menusResult.skipped + categoriesResult.skipped;
    const totalErrors = pagesResult.errors + menusResult.errors + categoriesResult.errors;
    const totalItems = pagesResult.total + menusResult.total + categoriesResult.total;

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 전체 마이그레이션 완료');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 업데이트된 항목: ${totalUpdated}개`);
    console.log(`⏭️  스킵된 항목: ${totalSkipped}개`);
    console.log(`❌ 실패한 항목: ${totalErrors}개`);
    console.log(`📋 전체 항목: ${totalItems}개`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (totalErrors === 0) {
      console.log('\n✅ 모든 마이그레이션이 성공적으로 완료되었습니다!');
    } else {
      console.log(`\n⚠️  ${totalErrors}개의 항목이 실패했습니다. 로그를 확인해주세요.`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
migrateAll();

