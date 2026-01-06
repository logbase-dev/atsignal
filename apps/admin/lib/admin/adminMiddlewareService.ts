import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
}

/**
 * Middleware 전용: 관리자 ID로 관리자 존재 여부 및 활성화 상태만 확인
 * bcrypt를 사용하지 않으므로 Edge Runtime에서 실행 가능
 */
export async function checkAdminExistsAndEnabled(adminId: string): Promise<boolean> {
  if (!db) {
    return false;
  }

  try {
    const adminDoc = await getDoc(doc(db, 'admins', adminId));
    
    if (!adminDoc.exists()) {
      return false;
    }
    
    const data = adminDoc.data();
    return data.enabled === true;
  } catch (error: any) {
    console.error('[checkAdminExistsAndEnabled] 에러:', error.message);
    return false;
  }
}

