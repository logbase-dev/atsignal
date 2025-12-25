import { api } from "./api";
import { subscribeNewsletterApi } from "./stibee";

// 통합 API 엔드포인트
export { api };

// Stibee 뉴스레터 구독 API
export { subscribeNewsletterApi };

// Storage 트리거: 이미지 후처리
export { processImage } from "./storage-triggers/image-processor";

