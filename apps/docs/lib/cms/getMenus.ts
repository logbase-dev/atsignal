import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Site = 'web' | 'docs';
export type Locale = 'ko' | 'en';

export async function getMenusByLocale(site: Site, locale: Locale) {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return [];
  }

  const menusRef = collection(db, "menus");
  // orderBy를 제거하고 클라이언트 사이드에서 정렬 (인덱스 불필요)
  // enabled 필터링도 클라이언트 사이드에서 처리 (객체 구조이므로)
  const q = query(
    menusRef,
    where("site", "==", site)
  );
  
  const querySnapshot = await getDocs(q);
  const menus = querySnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // locale에 맞는 라벨 선택 (없으면 ko 사용)
        label: data.labels?.[locale] || data.labels?.ko || '',
        order: data.order || 0, // order 속성 명시
      } as any; // 타입 안전성을 위해 any 사용 (Firestore 데이터 구조)
    })
    .filter((menu) => {
      // locale에 따라 enabled.ko 또는 enabled.en 체크
      return locale === 'ko' ? menu.enabled.ko : menu.enabled.en;
    });
  
  // 클라이언트 사이드에서 정렬
  return menus.sort((a, b) => (a.order || 0) - (b.order || 0));
}

