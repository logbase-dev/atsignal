"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const firebase_1 = require("../../firebase");
const busboy_1 = __importDefault(require("busboy"));
const sharp_1 = __importDefault(require("sharp"));
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
// 멀티파트 파서
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const busboy = (0, busboy_1.default)({ headers: req.headers, limits: { fileSize: MAX_SIZE, files: 1 } });
        let fileBuffer = [];
        let fileName = "";
        let mimeType = "";
        let maxWidth;
        busboy.on("file", (_fieldname, file, info) => {
            mimeType = info.mimeType;
            fileName = info.filename || "upload.bin";
            file.on("data", (data) => {
                fileBuffer.push(data);
            });
            file.on("limit", () => {
                reject(new Error("파일 크기는 10MB를 초과할 수 없습니다."));
            });
        });
        busboy.on("field", (name, val) => {
            if (name === "maxWidth") {
                const n = parseInt(val, 10);
                if (!Number.isNaN(n))
                    maxWidth = n;
            }
        });
        busboy.on("finish", () => {
            if (!fileBuffer.length) {
                reject(new Error("파일이 제공되지 않았습니다."));
                return;
            }
            resolve({
                file: Buffer.concat(fileBuffer),
                fileName,
                mimeType,
                maxWidth,
            });
        });
        busboy.on("error", reject);
        req.pipe(busboy);
    });
}
async function handle(request, response) {
    if (request.method !== "POST") {
        response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
        return;
    }
    try {
        // ✅ bucket은 핸들러 실행 시점에 생성 (초기화 타이밍/환경변수 문제로 인한 크래시 방지)
        const bucket = firebase_1.admin.storage().bucket();
        const { file, fileName, mimeType, maxWidth } = await parseMultipart(request);
        if (!mimeType.startsWith("image/")) {
            response.status(400).json({ error: "이미지 파일만 업로드할 수 있습니다." });
            return;
        }
        const timestamp = Date.now();
        const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const baseName = `${timestamp}-${safeName}`;
        // 원본 크기 확인 (5MB 미만일 때만 저장)
        const shouldSaveOriginal = file.length < 5 * 1024 * 1024;
        const sizes = [
            { name: "thumbnail", width: 300 },
            { name: "medium", width: 800 },
            { name: "large", width: 1200 },
        ];
        const targetSizes = maxWidth ? sizes.filter((s) => s.width <= maxWidth) : sizes;
        const uploadOne = async (name, width) => {
            const optimized = await (0, sharp_1.default)(file)
                .resize(width, null, { withoutEnlargement: true, fit: "inside" })
                .webp({ quality: 80 })
                .toBuffer();
            const storagePath = `images/${name}/${baseName}`;
            await bucket.file(storagePath).save(optimized, { contentType: "image/webp", resumable: false });
            const [url] = await bucket.file(storagePath).getSignedUrl({
                action: "read",
                expires: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30일
            });
            return { name, url };
        };
        const uploadPromises = targetSizes.map((s) => uploadOne(s.name, s.width));
        const results = await Promise.all(uploadPromises);
        let originalUrl = null;
        if (shouldSaveOriginal) {
            try {
                const storagePath = `images/original/${baseName}`;
                await bucket.file(storagePath).save(file, { contentType: mimeType, resumable: false });
                const [url] = await bucket.file(storagePath).getSignedUrl({
                    action: "read",
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
                });
                originalUrl = url;
            }
            catch (err) {
                console.error("[Image Upload] 원본 업로드 실패:", err);
            }
        }
        const urls = results.reduce((acc, cur) => {
            acc[cur.name] = cur.url;
            return acc;
        }, {});
        const payload = {
            success: true,
            originalUrl,
            urls,
            fileName: baseName,
            originalSaved: shouldSaveOriginal,
        };
        response.json(payload);
    }
    catch (error) {
        console.error("[Image Upload] 에러:", error);
        response.status(500).json({ error: error.message || "이미지 업로드에 실패했습니다." });
    }
}
//# sourceMappingURL=upload.js.map