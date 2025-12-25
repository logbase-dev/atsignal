"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImagesForFileName = deleteImagesForFileName;
const firebase_1 = require("../../firebase");
async function deleteImagesForFileName(fileName, opts = {}) {
    const logPrefix = opts.logPrefix || "Storage";
    const bucket = firebase_1.admin.storage().bucket();
    const sizes = ["thumbnail", "medium", "large", "original"];
    await Promise.all(sizes.map((size) => bucket
        .file(`images/${size}/${fileName}`)
        .delete({ ignoreNotFound: true })
        .catch((err) => {
        if (err?.code !== 404) {
            console.warn(`[${logPrefix}] 이미지 삭제 실패: images/${size}/${fileName}`, err);
        }
    })));
}
//# sourceMappingURL=storageImageUtils.js.map