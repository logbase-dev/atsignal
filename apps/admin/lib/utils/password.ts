import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // bcrypt 비용 10

/**
 * 비밀번호를 해시화합니다.
 * @param password 평문 비밀번호
 * @returns 해시된 비밀번호
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 평문 비밀번호와 해시된 비밀번호를 비교합니다.
 * @param password 평문 비밀번호
 * @param hash 해시된 비밀번호
 * @returns 일치 여부
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

