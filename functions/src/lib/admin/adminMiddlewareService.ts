import { firestore } from "../../firebase";

/**
 * Middleware 전용: 관리자 ID로 관리자 존재 여부 및 활성화 상태만 확인
 * bcrypt를 사용하지 않으므로 Edge Runtime에서 실행 가능
 */
export async function checkAdminExistsAndEnabled(adminId: string): Promise<boolean> {
  try {
    const adminDoc = await firestore.collection("admins").doc(adminId).get();

    if (!adminDoc.exists) {
      return false;
    }

    const data = adminDoc.data();
    if (!data) return false;
    return data.enabled === true;
  } catch (error: any) {
    console.error("[checkAdminExistsAndEnabled] 에러:", error.message);
    return false;
  }
}