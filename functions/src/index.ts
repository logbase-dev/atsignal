import { api } from "./api";
import { subscribeNewsletterApi } from "./stibee";
import { blogLikeApi, getBlogLikeStatus } from "./blog";

// 통합 API 엔드포인트
export { api };

// Stibee 뉴스레터 구독 API
export { subscribeNewsletterApi };

// 블로그 좋아요 API
export { blogLikeApi, getBlogLikeStatus };

// Storage 트리거: 이미지 후처리
export { processImage } from "./storage-triggers/image-processor";

