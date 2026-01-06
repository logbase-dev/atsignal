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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sharp_1 = __importDefault(require("sharp"));
/**
 * Storage 트리거: 이미지 업로드 완료 시 후처리
 * - images/editor/* → thumbnail, medium, large 생성
 * - images/original/* → 필요 시 최적화 (선택)
 */
exports.processImage = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath) {
        console.log("[Image Processor] 파일 경로가 없습니다.");
        return;
    }
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);
    // 이미 처리된 파일은 건너뛰기 (thumbnail, medium, large 등)
    if (filePath.includes("/thumbnail/") ||
        filePath.includes("/medium/") ||
        filePath.includes("/large/")) {
        console.log("[Image Processor] 이미 처리된 파일입니다:", filePath);
        return;
    }
    try {
        // 원본 이미지 다운로드
        const [fileBuffer] = await file.download();
        console.log("[Image Processor] 원본 이미지 다운로드 완료:", filePath, "크기:", fileBuffer.length);
        // 이미지 타입 확인
        if (!object.contentType?.startsWith("image/")) {
            console.log("[Image Processor] 이미지 파일이 아닙니다:", object.contentType);
            return;
        }
        // 경로에 따라 처리
        if (filePath.startsWith("images/editor/")) {
            // 에디터 이미지: thumbnail, medium, large 생성
            await processEditorImage(bucket, filePath, fileBuffer);
        }
        else if (filePath.startsWith("images/original/")) {
            // 원본 이미지: 필요 시 최적화 (현재는 스킵, 나중에 추가 가능)
            console.log("[Image Processor] 원본 이미지는 현재 후처리를 하지 않습니다:", filePath);
            // 필요 시 여기에 최적화 로직 추가
        }
    }
    catch (error) {
        console.error("[Image Processor] 에러:", error);
        // 에러가 발생해도 원본 파일은 유지
    }
});
/**
 * 에디터 이미지 후처리: 여러 크기 버전 생성
 */
async function processEditorImage(bucket, originalPath, fileBuffer) {
    const sizes = [
        { name: "thumbnail", width: 300 },
        { name: "medium", width: 800 },
        { name: "large", width: 1200 },
    ];
    // 파일명 추출 (images/editor/{filename})
    const fileName = originalPath.replace("images/editor/", "");
    // 병렬 처리로 여러 크기 생성
    const processPromises = sizes.map(async ({ name, width }) => {
        try {
            const optimized = await (0, sharp_1.default)(fileBuffer)
                .resize(width, null, { withoutEnlargement: true, fit: "inside" })
                .webp({ quality: 80 })
                .toBuffer();
            const optimizedPath = `images/editor/${name}/${fileName}`;
            await bucket.file(optimizedPath).save(optimized, {
                contentType: "image/webp",
                resumable: false,
            });
            console.log(`[Image Processor] ${name} 생성 완료:`, optimizedPath, "크기:", optimized.length);
        }
        catch (error) {
            console.error(`[Image Processor] ${name} 생성 실패:`, error);
        }
    });
    await Promise.all(processPromises);
    console.log("[Image Processor] 에디터 이미지 후처리 완료:", originalPath);
}
//# sourceMappingURL=image-processor.js.map