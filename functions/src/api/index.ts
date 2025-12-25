import * as functions from "firebase-functions";
import express, { Request, Response, NextFunction } from "express";
import { subscribeNewsletter } from "../stibee";
import { router as adminApiRouter } from "../admin-api";
import { URL } from "url";

const app = express();

/**
 * 멀티파트 데이터를 Buffer로 변환하는 커스텀 미들웨어
 * multipart/form-data인 경우에만 Buffer로 변환
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  
  // multipart/form-data인 경우에만 Buffer로 변환
  if (contentType.includes('multipart/form-data')) {
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      req.body = Buffer.concat(chunks);
      console.log('[API] multipart/form-data를 Buffer로 변환, 크기:', req.body.length, 'bytes');
      next();
    });
    
    req.on('error', (err: Error) => {
      console.error('[API] req 스트림 읽기 에러:', err);
      res.status(500).json({ error: '요청 body를 읽을 수 없습니다.' });
    });
  } else {
    // 다른 Content-Type은 JSON 파싱
    express.json({ limit: '10mb' })(req, res, next);
  }
});

/**
 * CORS 미들웨어
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const originHeader = req.headers.origin;
  const origin = typeof originHeader === "string" ? originHeader : undefined;

  const allowedOrigins = [
    // local dev
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    // prod domains
    "https://atsignal.io",
    "https://docs.atsignal.io",
    "https://atsignal.com",
    // app hosting preview domains
    "https://web-ssr--atsignal.asia-east1.hosted.app",
    "https://docs-ssr--atsignal.asia-east1.hosted.app",
  ];

  const allowedOrigin = origin ? allowedOrigins.find((o) => o === origin) : undefined;

  if (origin && !allowedOrigin) {
    // NOTE: 서버 사이드 Route Handler에서 호출하는 경우 Origin이 없을 수 있음
    // 이 경우 CORS 체크를 통과시키고, 쿠키는 여전히 설정되어야 함
    console.log('[API] CORS check failed, but allowing server-side request:', { origin, hasOrigin: !!origin });
    // 서버 사이드 요청은 CORS 체크를 통과시킴 (쿠키 설정을 위해)
  }

  // 서버 사이드 요청(Origin 없음) 또는 허용된 Origin인 경우 CORS 헤더 설정
  if (allowedOrigin || !origin) {
    if (allowedOrigin) {
      res.set("Access-Control-Allow-Origin", allowedOrigin);
      res.set("Vary", "Origin");
    }
    // 서버 사이드 요청도 credentials를 허용해야 쿠키가 설정됨
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  }

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  next();
});

/**
 * 라우팅 미들웨어
 */
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // ✅ request.url이 상대 경로일 수 있으므로 base URL 제공
  const baseUrl = `http://${req.headers.host || 'atsignal.io'}`;
  const url = new URL(req.url, baseUrl);
  let path = url.pathname;
  
  console.log('[API] 원본 경로:', {
    originalUrl: req.url,
    pathname: url.pathname,
    method: req.method,
  });
  
  // NOTE:
  // - Firebase Hosting rewrite to function `api` can produce "/api/api/..." (function name + original path)
  // - Emulator requests can include "/<project>/<region>/api/..."
  // Normalize by repeatedly stripping the first "/api" segment we see.
  const apiIndex = path.indexOf("/api/");
  if (apiIndex >= 0) {
    path = path.slice(apiIndex); // ensure path starts with "/api/..."
  }
  while (path.startsWith("/api/")) {
    path = path.slice(4); // drop "/api"
  }
  
  console.log('[API] 정규화된 경로:', {
    afterNormalization: path,
  });
  
  // 여기까지 오면 path는 항상 "/admin/..." 또는 "/stibee/..." 형태여야 함

  // Admin API 라우팅
  if (path.startsWith("/admin")) {
    // "/admin" 또는 "/admin/"로 시작하는 경우 처리
    const adminPath = path.startsWith("/admin/") 
      ? path.slice(7) // "/admin/" 제거
      : path.slice(6); // "/admin" 제거
    
    console.log('[API] Admin API로 라우팅:', {
      originalPath: path,
      adminPath,
    });
    
    await adminApiRouter(req, res, adminPath);
    return;
  }

  // Stibee 구독 API
  if (path.startsWith("/stibee/subscribe")) {
    // CORS 헤더 설정 (CORS 미들웨어에서 이미 처리되었지만, Stibee는 별도 처리)
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === "string" ? originHeader : undefined;
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://atsignal.io",
      "https://docs.atsignal.io",
      "https://atsignal.com",
    ];
    const stibeeAllowedOrigin = origin ? allowedOrigins.find((o) => o === origin) : undefined;
    
    if (stibeeAllowedOrigin || !origin) {
      if (stibeeAllowedOrigin) {
        res.set("Access-Control-Allow-Origin", stibeeAllowedOrigin);
        res.set("Vary", "Origin");
      }
      res.set("Access-Control-Allow-Credentials", "true");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    
    await subscribeNewsletter(req, res);
    return;
  }

  // 기본 응답
  res.json({
    message: "API endpoint",
    availableEndpoints: ["/admin/*", "/stibee/subscribe"],
  });
});

/**
 * 통합 API 라우터
 * 모든 API 엔드포인트를 여기서 라우팅합니다.
 */
export const api = functions
  .region("asia-northeast3")
  .runWith({
    timeoutSeconds: 60,
    memory: "256MB", // 기본 메모리 (이미지 업로드는 Next.js API Route에서 처리)
  })
  .https.onRequest(app);