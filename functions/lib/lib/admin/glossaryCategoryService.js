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
exports.getGlossaryCategories = getGlossaryCategories;
exports.getGlossaryCategoryById = getGlossaryCategoryById;
exports.createGlossaryCategory = createGlossaryCategory;
exports.updateGlossaryCategory = updateGlossaryCategory;
exports.deleteGlossaryCategory = deleteGlossaryCategory;
exports.isCategoryInUse = isCategoryInUse;
const admin = __importStar(require("firebase-admin"));
const firebase_1 = require("../../firebase");
// 타임아웃 헬퍼 함수
function withTimeout(promise, timeoutMs = 5000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
    ]);
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
// LocalizedField 정규화 함수
function normalizeLocalizedField(field) {
    if (!field) {
        return { ko: "" };
    }
    return {
        ko: field.ko ?? "",
        ...(field.en ? { en: field.en } : {}),
    };
}
// 카테고리 목록 조회
async function getGlossaryCategories() {
    try {
        const categoriesRef = firebase_1.firestore.collection("glossaryCategories");
        // order 기준으로 정렬 (인덱스 문제 대비)
        let q = categoriesRef.orderBy("order", "asc");
        try {
            // no-op
        }
        catch (error) {
            console.warn("orderBy failed, fetching without order:", error);
            q = categoriesRef;
        }
        const querySnapshot = await withTimeout(q.get(), 5000);
        return querySnapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                name: normalizeLocalizedField(data.name),
                description: data.description ? normalizeLocalizedField(data.description) : undefined,
                order: Number(data.order ?? 0),
                enabled: {
                    ko: Boolean(data.enabled?.ko ?? true),
                    en: Boolean(data.enabled?.en ?? true),
                },
                createdAt: convertTimestamp(data.createdAt),
                updatedAt: convertTimestamp(data.updatedAt),
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
            };
        });
    }
    catch (error) {
        console.error("Error fetching Glossary categories:", error);
        if (error.message?.includes("timed out")) {
            console.error("Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.");
        }
        return [];
    }
}
// 카테고리 단건 조회
async function getGlossaryCategoryById(id) {
    try {
        const categoryRef = firebase_1.firestore.collection("glossaryCategories").doc(id);
        const categorySnap = await withTimeout(categoryRef.get(), 5000);
        if (!categorySnap.exists) {
            return null;
        }
        const data = categorySnap.data();
        if (!data)
            return null;
        return {
            id: categorySnap.id,
            name: normalizeLocalizedField(data.name),
            description: data.description ? normalizeLocalizedField(data.description) : undefined,
            order: Number(data.order ?? 0),
            enabled: {
                ko: Boolean(data.enabled?.ko ?? true),
                en: Boolean(data.enabled?.en ?? true),
            },
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            createdBy: data.createdBy,
            updatedBy: data.updatedBy,
        };
    }
    catch (error) {
        console.error("Error fetching Glossary category:", error);
        return null;
    }
}
/**
 * @deprecated API Route로 대체됨. /api/admin/glossary-categories (POST) 사용
 */
async function createGlossaryCategory(category) {
    throw new Error("createGlossaryCategory는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}
/**
 * @deprecated API Route로 대체됨. /api/admin/glossary-categories/[id] (PUT) 사용
 */
async function updateGlossaryCategory(id, category) {
    throw new Error("updateGlossaryCategory는 더 이상 사용되지 않습니다. API Route를 사용하세요.");
}
// 카테고리 삭제
async function deleteGlossaryCategory(id) {
    const categoryRef = firebase_1.firestore.collection("glossaryCategories").doc(id);
    await withTimeout(categoryRef.delete(), 5000);
}
// 카테고리 사용 여부 확인 (Glossary에서 사용 중인지)
async function isCategoryInUse(categoryId) {
    try {
        const glossariesRef = firebase_1.firestore.collection("glossaries");
        const q = glossariesRef.where("categoryId", "==", categoryId);
        const querySnapshot = await withTimeout(q.get(), 5000);
        return querySnapshot.size > 0;
    }
    catch (error) {
        console.error("Error checking if category is in use:", error);
        return false;
    }
}
//# sourceMappingURL=glossaryCategoryService.js.map