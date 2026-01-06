"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 10; // bcrypt 비용 10
/**
 * 비밀번호를 해시화합니다.
 * @param password 평문 비밀번호
 * @returns 해시된 비밀번호
 */
async function hashPassword(password) {
    return await bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
/**
 * 평문 비밀번호와 해시된 비밀번호를 비교합니다.
 * @param password 평문 비밀번호
 * @param hash 해시된 비밀번호
 * @returns 일치 여부
 */
async function comparePassword(password, hash) {
    return await bcryptjs_1.default.compare(password, hash);
}
//# sourceMappingURL=password.js.map