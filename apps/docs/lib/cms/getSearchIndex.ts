import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Site = 'web' | 'docs';

export interface SearchIndexItem {
  id: string;
  slug: string;
  titleKo: string;
  titleEn?: string;
  contentTextKo: string; // Markdown을 plain text로 변환한 것
  contentTextEn?: string;
  locale: 'ko' | 'en';
}

// Markdown을 plain text로 변환하는 간단한 함수
function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // 헤더 제거 (# ## ### 등)
    .replace(/^#{1,6}\s+/gm, '')
    // 코드 블록 제거
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    // 링크 텍스트만 남기기 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // 이미지 제거
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
    // 강조 제거
    .replace(/\*\*([^\*]+)\*\*/g, '$1')
    .replace(/\*([^\*]+)\*/g, '$1')
    // 리스트 마커 제거
    .replace(/^[\*\-\+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 여러 공백을 하나로
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getSearchIndex(site: Site): Promise<SearchIndexItem[]> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return [];
  }

  const pagesRef = collection(db, 'pages');
  const q = query(pagesRef, where('site', '==', site));
  
  const querySnapshot = await getDocs(q);
  const items: SearchIndexItem[] = [];

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // 한국어 인덱스
    const titleKo = data.labelsLive?.ko || data.labels?.ko || '';
    const contentKo = data.contentLive?.ko || data.content?.ko || '';
    
    if (titleKo || contentKo) {
      items.push({
        id: doc.id,
        slug: data.slug || '',
        titleKo,
        titleEn: data.labelsLive?.en || data.labels?.en,
        contentTextKo: markdownToPlainText(contentKo),
        contentTextEn: data.contentLive?.en || data.content?.en 
          ? markdownToPlainText(data.contentLive.en || data.content.en)
          : undefined,
        locale: 'ko',
      });
    }

    // 영어 인덱스 (영어 제목이나 내용이 있는 경우)
    const titleEn = data.labelsLive?.en || data.labels?.en;
    const contentEn = data.contentLive?.en || data.content?.en;
    
    if (titleEn || contentEn) {
      items.push({
        id: doc.id,
        slug: data.slug || '',
        titleKo: titleKo || titleEn || '', // fallback
        titleEn,
        contentTextKo: markdownToPlainText(contentKo || contentEn || ''),
        contentTextEn: markdownToPlainText(contentEn || ''),
        locale: 'en',
      });
    }
  });

  return items;
}

