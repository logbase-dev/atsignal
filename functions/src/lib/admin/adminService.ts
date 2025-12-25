import * as admin from "firebase-admin";
import { firestore } from "../../firebase";
import type { Admin } from "./types";
import { hashPassword } from "../utils/password";
import { Timestamp } from "firebase-admin/firestore"; // ✅ 추가

// 타임아웃 헬퍼 함수
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

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

// undefined 값을 제거하는 헬퍼 함수 (Firestore는 undefined 값을 허용하지 않음)
function removeUndefinedFields(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Firestore 데이터를 Admin 객체로 변환
function mapAdminData(docSnapshot: admin.firestore.DocumentSnapshot): Admin {
  const data = docSnapshot.data();
  if (!data) {
    throw new Error('Document data is missing');
  }
  return {
    id: docSnapshot.id,
    username: data.username || '',
    password: data.password || '', // 해시된 비밀번호
    name: data.name || '',
    enabled: data.enabled !== undefined ? data.enabled : true,
    createdAt: convertTimestamp(data.createdAt) || new Date(),
    updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    lastLoginAt: convertTimestamp(data.lastLoginAt),
    createdBy: data.createdBy || undefined,
  };
}

export interface CreateAdminData {
  username: string;
  password: string;
  name: string;
  enabled?: boolean;
  createdBy?: string;
}

export interface UpdateAdminData {
  password?: string;
  name?: string;
  enabled?: boolean;
}

/**
 * 모든 관리자 목록을 조회합니다.
 */
export async function getAdmins(): Promise<Admin[]> {
  try {
    const adminsRef = firestore.collection('admins');
    const q = adminsRef.orderBy('createdAt', 'desc');
    
    const querySnapshot = await withTimeout(q.get(), 5000);
    
    return querySnapshot.docs.map(mapAdminData);
  } catch (error: any) {
    console.error('[getAdmins] 에러:', error.message);
    return [];
  }
}

/**
 * ID로 관리자를 조회합니다.
 */
export async function getAdminById(id: string): Promise<Admin | null> {
  try {
    const adminDoc = await firestore.collection('admins').doc(id).get();
    
    if (!adminDoc.exists) {
      return null;
    }
    
    return mapAdminData(adminDoc);
  } catch (error: any) {
    console.error('[getAdminById] 에러:', error.message);
    throw error;
  }
}

/**
 * 아이디로 관리자를 조회합니다.
 */
export async function getAdminByUsername(username: string): Promise<Admin | null> {
  try {
    const adminsRef = firestore.collection('admins');
    const q = adminsRef.where('username', '==', username.toLowerCase());
    
    const querySnapshot = await withTimeout(q.get(), 5000);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return mapAdminData(querySnapshot.docs[0]);
  } catch (error: any) {
    console.error('[getAdminByUsername] 에러:', error.message);
    throw error;
  }
}

/**
 * 아이디 중복 여부를 확인합니다.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const admin = await getAdminByUsername(username);
  return admin !== null;
}

/**
 * 새 관리자를 생성합니다.
 */
export async function createAdmin(data: CreateAdminData): Promise<string> {
  try {
    // 아이디 중복 체크
    const exists = await checkUsernameExists(data.username);
    if (exists) {
      throw new Error('이미 사용 중인 아이디입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(data.password);

    const now = new Date();
    const adminData = removeUndefinedFields({
      username: data.username.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      enabled: data.enabled !== undefined ? data.enabled : true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      createdBy: data.createdBy,
    });

    const docRef = await firestore.collection('admins').add(adminData);
    return docRef.id;
  } catch (error: any) {
    console.error('[createAdmin] 에러:', error.message);
    throw error;
  }
}

/**
 * 관리자 정보를 수정합니다.
 */
export async function updateAdmin(id: string, data: UpdateAdminData): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // 비밀번호가 제공된 경우에만 해시화하여 업데이트
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    // 다른 필드 업데이트
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.enabled !== undefined) {
      updateData.enabled = data.enabled;
    }

    await firestore.collection('admins').doc(id).update(removeUndefinedFields(updateData));
  } catch (error: any) {
    console.error('[updateAdmin] 에러:', error.message);
    throw error;
  }
}

/**
 * 관리자의 마지막 로그인 시간을 업데이트합니다.
 */
export async function updateLastLoginAt(id: string): Promise<void> {
  try {
    await firestore.collection('admins').doc(id).update({
      lastLoginAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error: any) {
    console.error('[updateLastLoginAt] 에러:', error.message);
    throw error;
  }
}

/**
 * 관리자를 비활성화합니다 (물리적 삭제 대신 enabled: false로 설정).
 */
export async function deleteAdmin(id: string): Promise<void> {
  try {
    await firestore.collection('admins').doc(id).update({
      enabled: false,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  } catch (error: any) {
    console.error('[deleteAdmin] 에러:', error.message);
    throw error;
  }
}