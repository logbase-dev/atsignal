"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenus = getMenus;
exports.createMenu = createMenu;
exports.updateMenu = updateMenu;
exports.deleteMenu = deleteMenu;
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("../../firebase");
// 타임아웃 헬퍼 함수
function withTimeout(promise, timeoutMs = 15000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
}
// 재시도 헬퍼 함수
async function withRetry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            // 타임아웃이나 네트워크 에러인 경우에만 재시도
            if (i < maxRetries - 1 &&
                (error.message?.includes("timed out") ||
                    error.message?.includes("QUIC") ||
                    error.message?.includes("network") ||
                    error.message?.includes("ERR_QUIC"))) {
                const isDev = process.env.NODE_ENV === "development";
                if (isDev) {
                    console.log(`[getMenus] 재시도 ${i + 1}/${maxRetries}...`);
                }
                await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}
// Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestamp(value) {
    if (!value)
        return undefined;
    if (value instanceof admin.firestore.Timestamp) {
        return value.toDate();
    }
    if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
        return value.toDate();
    }
    if (value instanceof Date) {
        return value;
    }
    return undefined;
}
// Admin용: 모든 메뉴 조회 (enabled 무관)
async function getMenus(site) {
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
        console.log("[getMenus] 시작 - site:", site);
    }
    return withRetry(async () => {
        try {
            const menusRef = firebase_1.firestore.collection("menus");
            // orderBy를 제거하고 클라이언트 사이드에서 정렬 (인덱스 불필요)
            const q = menusRef.where("site", "==", site);
            const startTime = isDev ? Date.now() : 0;
            const querySnapshot = await withTimeout(q.get(), 15000); // 타임아웃 15초로 증가
            const endTime = isDev ? Date.now() : 0;
            if (isDev) {
                console.log(`[getMenus] 쿼리 완료 (${endTime - startTime}ms)`);
            }
            const menus = querySnapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    ...data,
                    pageType: data.pageType || "dynamic", // 기본값만 설정
                    // Firestore Timestamp를 Date로 변환
                    createdAt: convertTimestamp(data.createdAt),
                    updatedAt: convertTimestamp(data.updatedAt),
                };
            });
            if (isDev) {
                console.log(`[getMenus] ${menus.length}개의 메뉴 로드됨`);
            }
            return menus.sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        catch (error) {
            console.error("[getMenus] 에러:", error.message);
            if (error.message?.includes("timed out")) {
                console.error("Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.");
            }
            throw error; // 재시도를 위해 에러를 다시 throw
        }
    }).catch((error) => {
        // 모든 재시도 실패 시 빈 배열 반환
        console.error("[getMenus] 모든 재시도 실패:", error.message);
        return [];
    });
}
/**
 * @deprecated API Route로 대체됨. /api/menus (POST) 사용
 */
async function createMenu(menu) {
    throw new Error("createMenu는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}
/**
 * @deprecated API Route로 대체됨. /api/menus/[id] (PUT) 사용
 */
async function updateMenu(id, menu) {
    throw new Error("updateMenu는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}
async function deleteMenu(id) {
    try {
        // 연결된 페이지 확인 및 삭제
        const pagesRef = firebase_1.firestore.collection("pages");
        const pagesQuery = pagesRef.where("menuId", "==", id);
        const pagesSnapshot = await withTimeout(pagesQuery.get(), 3000);
        // 연결된 모든 페이지 삭제
        const deletePagePromises = pagesSnapshot.docs.map((pageDoc) => {
            return withTimeout(pageDoc.ref.delete(), 3000);
        });
        await Promise.all(deletePagePromises);
        // 메뉴 삭제
        const menuRef = firebase_1.firestore.collection("menus").doc(id);
        await withTimeout(menuRef.delete(), 3000);
    }
    catch (error) {
        console.error("Error deleting menu:", error);
        if (error.message?.includes("timed out")) {
            throw new Error("메뉴 삭제가 타임아웃되었습니다. 네트워크 연결을 확인하세요.");
        }
        throw error;
    }
}
//# sourceMappingURL=menuService.js.map