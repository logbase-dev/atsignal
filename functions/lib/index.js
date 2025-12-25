"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = exports.subscribeNewsletterApi = exports.api = void 0;
const api_1 = require("./api");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return api_1.api; } });
const stibee_1 = require("./stibee");
Object.defineProperty(exports, "subscribeNewsletterApi", { enumerable: true, get: function () { return stibee_1.subscribeNewsletterApi; } });
// Storage 트리거: 이미지 후처리
var image_processor_1 = require("./storage-triggers/image-processor");
Object.defineProperty(exports, "processImage", { enumerable: true, get: function () { return image_processor_1.processImage; } });
//# sourceMappingURL=index.js.map