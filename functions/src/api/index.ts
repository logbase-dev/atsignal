import * as functions from "firebase-functions";
import express, { Request, Response, NextFunction } from "express";
import { subscribeNewsletter } from "../stibee";
import { router as adminApiRouter } from "../admin-api";
import { getEvents, getEventById } from "../lib/admin/eventService";
import { getWhatsNews, getWhatsNewById } from "../lib/admin/whatsnewService";
import { getFAQs, getFAQById } from "../lib/admin/faqService";
import { getFAQCategories } from "../lib/admin/faqCategoryService";
import { getGlossaries, getGlossaryById } from "../lib/admin/glossaryService";
import { getGlossaryCategories } from "../lib/admin/glossaryCategoryService";
import { getBlogPosts, getBlogPostById, incrementBlogPostViews } from "../lib/admin/blogService";
import { getBlogCategories } from "../lib/admin/blogCategoryService";
import { getNotices, getNoticeById, incrementNoticeViews } from "../lib/admin/noticeService";
import { URL } from "url";

const app = express();

// ❌ Firebase Functions에서는 body parsing 미들웨어 사용하면 안됨!
// Firebase 내부에서 이미 request body를 처리하므로 중복 파싱 시 충돌 발생
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true }));

/**
 * Query parameter parsing 미들웨어
 * Express는 GET 요청의 쿼리 파라미터를 자동으로 파싱하지 않으므로 수동으로 파싱
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  // Express가 자동으로 파싱하지 않은 경우에만 수동 파싱
  if (!req.query || Object.keys(req.query).length === 0) {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      req.query = Object.fromEntries(url.searchParams.entries());
    } catch (error) {
      console.error('[API] Query parsing error:', error);
      req.query = {};
    }
  }
  next();
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

  // Events API - 이벤트 참가 신청
  if (path === "/events/participate") {
    if (req.method === "POST") {
      try {
        const { eventId, name, company, email, phone, privacyConsent } = req.body;

        // 필수 필드 검증
        if (!eventId || !name || !company || !email || !phone || !privacyConsent) {
          res.status(400).json({ error: 'Missing required fields' });
          return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.status(400).json({ error: 'Invalid email format' });
          return;
        }

        // 전화번호 형식 검증 (010-1234-5678)
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
          res.status(400).json({ error: 'Invalid phone format' });
          return;
        }

        console.log('[Functions API] Event participate request:', { 
          eventId, name, company, email, phone 
        });

        // 이벤트 존재 확인
        const admin = require('firebase-admin');
        const db = admin.firestore();
        
        const eventDoc = await db.collection('events').doc(eventId).get();
        if (!eventDoc.exists) {
          res.status(404).json({ error: 'Event not found' });
          return;
        }

        // 중복 참가 신청 확인
        const existingParticipant = await db
          .collection('eventParticipants')
          .where('eventId', '==', eventId)
          .where('email', '==', email.toLowerCase().trim())
          .get();

        if (!existingParticipant.empty) {
          res.status(409).json({ 
            error: 'Already registered for this event', 
            message: '이미 해당 이벤트에 참가신청 했습니다.' 
          });
          return;
        }

        // EventParticipant 데이터 생성
        const participantData = {
          eventId,
          name: name.trim(),
          company: company.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          privacyConsent,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Firestore에 저장
        const docRef = await db.collection('eventParticipants').add(participantData);

        console.log('[Functions API] Successfully created participant:', docRef.id);

        res.json({
          success: true,
          participantId: docRef.id,
          message: '이벤트 참가 신청이 완료되었습니다.',
        });

      } catch (error) {
        console.error('[Functions API] Event participate error:', error);
        
        // Firestore 에러 구분
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            res.status(403).json({ 
              error: 'Permission denied', 
              message: '권한이 없습니다.' 
            });
            return;
          } else if (error.message.includes('not-found')) {
            res.status(404).json({ 
              error: 'Event not found', 
              message: '이벤트를 찾을 수 없습니다.' 
            });
            return;
          }
        }
        
        res.status(500).json({ 
          error: 'Internal server error', 
          message: '참가 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' 
        });
      }
      return;
    }
    
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Resources API - 이벤트
  if (path.startsWith("/resources/events")) {
    if (req.method === "GET") {
      const eventIdMatch = path.match(/^\/resources\/events\/([^\/]+)$/);
      
      if (eventIdMatch) {
        // 개별 이벤트 조회
        const eventId = eventIdMatch[1];
        try {
          const event = await getEventById(eventId);
          if (!event) {
            res.status(404).json({ error: "Event not found" });
            return;
          }
          
          // 공개된 이벤트만 반환
          if (!event.published) {
            res.status(404).json({ error: "Event not found" });
            return;
          }
          
          res.json({ event });
        } catch (error) {
          console.error('[API] Error fetching event:', error);
          res.status(500).json({ error: "Failed to fetch event" });
        }
        return;
      } else if (path === "/resources/events") {
        // 이벤트 목록 조회
        try {
          const query = url.searchParams;
          const options = {
            search: query.get('search') || undefined,
            page: query.get('page') ? parseInt(query.get('page')!) : 1,
            limit: query.get('limit') ? parseInt(query.get('limit')!) : 20,
            published: true, // 공개 API는 항상 published=true
            enabledKo: query.get('enabledKo') ? query.get('enabledKo') === 'true' : undefined,
            enabledEn: query.get('enabledEn') ? query.get('enabledEn') === 'true' : undefined,
          };
          
          const result = await getEvents(options);
          res.json(result);
        } catch (error) {
          console.error('[API] Error fetching events:', error);
          res.status(500).json({ error: "Failed to fetch events" });
        }
        return;
      }
    }
    
    res.status(404).json({ error: "Event endpoint not found" });
    return;
  }

  // Product API - WhatsNew
  if (path.startsWith("/product/whatsnews")) {
    if (req.method === "GET") {
      const whatsNewIdMatch = path.match(/^\/product\/whatsnews\/([^\/]+)$/);
      
      if (whatsNewIdMatch) {
        // 개별 WhatsNew 조회
        const whatsNewId = whatsNewIdMatch[1];
        try {
          const whatsNew = await getWhatsNewById(whatsNewId);
          if (!whatsNew) {
            res.status(404).json({ error: "WhatsNew not found" });
            return;
          }
          
          // 공개된 항목만 반환
          if (!whatsNew.published) {
            res.status(404).json({ error: "WhatsNew not found" });
            return;
          }
          
          res.json({ whatsNew });
        } catch (error) {
          console.error('[API] Error fetching whatsNew:', error);
          res.status(500).json({ error: "Failed to fetch whatsNew" });
        }
        return;
      } else if (path === "/product/whatsnews") {
        // WhatsNew 목록 조회
        try {
          const query = url.searchParams;
          const options = {
            search: query.get('search') || undefined,
            page: query.get('page') ? parseInt(query.get('page')!) : 1,
            limit: query.get('limit') ? parseInt(query.get('limit')!) : 20,
            published: true, // 공개 API는 항상 published=true
          };
          
          const result = await getWhatsNews(options);
          res.json(result);
        } catch (error) {
          console.error('[API] Error fetching whatsnews:', error);
          res.status(500).json({ error: "Failed to fetch whatsnews" });
        }
        return;
      }
    }
    
    res.status(404).json({ error: "WhatsNew endpoint not found" });
    return;
  }

  // Resources API - FAQ
  if (path.startsWith("/resources/faqs")) {
    if (req.method === "GET") {
      const faqIdMatch = path.match(/^\/resources\/faqs\/([^\/]+)$/);
      
      if (faqIdMatch) {
        // 개별 FAQ 조회
        const faqId = faqIdMatch[1];
        try {
          const faq = await getFAQById(faqId);
          if (!faq) {
            res.status(404).json({ error: "FAQ not found" });
            return;
          }
          
          res.json({ faq });
        } catch (error) {
          console.error('[API] Error fetching FAQ:', error);
          res.status(500).json({ error: "Failed to fetch FAQ" });
        }
        return;
      } else if (path === "/resources/faqs") {
        // FAQ 목록 조회
        try {
          const query = url.searchParams;
          const options = {
            search: query.get('search') || undefined,
            categoryId: query.get('categoryId') || undefined,
            page: query.get('page') ? parseInt(query.get('page')!) : 1,
            limit: query.get('limit') ? parseInt(query.get('limit')!) : 20,
            enabledKo: query.get('enabledKo') ? query.get('enabledKo') === 'true' : undefined,
            enabledEn: query.get('enabledEn') ? query.get('enabledEn') === 'true' : undefined,
          };
          
          const result = await getFAQs(options);
          res.json(result);
        } catch (error) {
          console.error('[API] Error fetching FAQs:', error);
          res.status(500).json({ error: "Failed to fetch FAQs" });
        }
        return;
      }
    }
    
    res.status(404).json({ error: "FAQ endpoint not found" });
    return;
  }

  // Resources API - FAQ Categories
  if (path === "/resources/faq-categories") {
    if (req.method === "GET") {
      try {
        const categories = await getFAQCategories();
        res.json({ categories });
      } catch (error) {
        console.error('[API] Error fetching FAQ categories:', error);
        res.status(500).json({ error: "Failed to fetch FAQ categories" });
      }
      return;
    }
    
    res.status(404).json({ error: "FAQ categories endpoint not found" });
    return;
  }

  // Resources API - Glossaries
  if (path.startsWith("/resources/glossaries")) {
    if (req.method === "GET") {
      const glossaryIdMatch = path.match(/^\/resources\/glossaries\/([^\/]+)$/);
      
      if (glossaryIdMatch) {
        // 개별 Glossary 조회
        const glossaryId = glossaryIdMatch[1];
        try {
          const glossary = await getGlossaryById(glossaryId);
          if (!glossary) {
            res.status(404).json({ error: "Glossary not found" });
            return;
          }
          
          res.json({ glossary });
        } catch (error) {
          console.error('[API] Error fetching glossary:', error);
          res.status(500).json({ error: "Failed to fetch glossary" });
        }
        return;
      } else if (path === "/resources/glossaries") {
        // Glossary 목록 조회
        try {
          const query = url.searchParams;
          const options = {
            search: query.get('search') || undefined,
            categoryId: query.get('categoryId') || undefined,
            initialLetter: query.get('initialLetter') || undefined,
            page: query.get('page') ? parseInt(query.get('page')!) : 1,
            limit: query.get('limit') ? parseInt(query.get('limit')!) : 20,
            enabledKo: query.get('enabledKo') ? query.get('enabledKo') === 'true' : undefined,
            enabledEn: query.get('enabledEn') ? query.get('enabledEn') === 'true' : undefined,
          };
          
          const result = await getGlossaries(options);
          res.json(result);
        } catch (error) {
          console.error('[API] Error fetching glossaries:', error);
          res.status(500).json({ error: "Failed to fetch glossaries" });
        }
        return;
      }
    }
    
    res.status(404).json({ error: "Glossary endpoint not found" });
    return;
  }

  // Resources API - Glossary Categories
  if (path === "/resources/glossary-categories") {
    if (req.method === "GET") {
      try {
        const categories = await getGlossaryCategories();
        res.json({ categories });
      } catch (error) {
        console.error('[API] Error fetching glossary categories:', error);
        res.status(500).json({ error: "Failed to fetch glossary categories" });
      }
      return;
    }
    
    res.status(404).json({ error: "Glossary categories endpoint not found" });
    return;
  }

  // Resources API - Blogs
  if (path.startsWith("/resources/blogs")) {
    if (req.method === "GET") {
      const blogIdMatch = path.match(/^\/resources\/blogs\/([^\/]+)$/);
      
      if (blogIdMatch) {
        // 개별 블로그 조회
        const blogId = blogIdMatch[1];
        try {
          const blog = await getBlogPostById(blogId);
          if (!blog) {
            res.status(404).json({ error: "Blog not found" });
            return;
          }
          
          // 공개된 블로그만 반환
          if (!blog.published) {
            res.status(404).json({ error: "Blog not found" });
            return;
          }
          
          // 조회수 증가
          try {
            await incrementBlogPostViews(blogId);
          } catch (viewError) {
            console.error('[API] Error incrementing blog views:', viewError);
            // 조회수 증가 실패는 무시하고 계속 진행
          }
          
          res.json({ blog });
        } catch (error) {
          console.error('[API] Error fetching blog:', error);
          res.status(500).json({ error: "Failed to fetch blog" });
        }
        return;
      } else if (path === "/resources/blogs") {
        // 블로그 목록 조회
        try {
          const query = url.searchParams;
          const options = {
            search: query.get('search') || undefined,
            categoryId: query.get('categoryId') || undefined,
            page: query.get('page') ? parseInt(query.get('page')!) : 1,
            limit: query.get('limit') ? parseInt(query.get('limit')!) : 20,
            published: true, // 공개 API는 항상 published=true
          };
          
          const result = await getBlogPosts(options);
          res.json(result);
        } catch (error) {
          console.error('[API] Error fetching blogs:', error);
          res.status(500).json({ error: "Failed to fetch blogs" });
        }
        return;
      }
    }
    
    res.status(404).json({ error: "Blog endpoint not found" });
    return;
  }

  // Resources API - Blog Categories
  if (path === "/resources/blog-categories") {
    if (req.method === "GET") {
      try {
        const categories = await getBlogCategories();
        res.json({ categories });
      } catch (error) {
        console.error('[API] Error fetching blog categories:', error);
        res.status(500).json({ error: "Failed to fetch blog categories" });
      }
      return;
    }
    
    res.status(404).json({ error: "Blog categories endpoint not found" });
    return;
  }

  // Resources API - Notices
  if (path.startsWith("/resources/notices")) {
    if (req.method === "GET") {
      const noticeIdMatch = path.match(/^\/resources\/notices\/([^\/]+)$/);
      
      if (noticeIdMatch) {
        // 개별 공지사항 조회
        const noticeId = noticeIdMatch[1];
        try {
          const notice = await getNoticeById(noticeId);
          if (!notice) {
            res.status(404).json({ error: "Notice not found" });
            return;
          }
          
          // 공개된 공지사항만 반환
          if (!notice.published) {
            res.status(404).json({ error: "Notice not found" });
            return;
          }
          
          // 조회수 증가
          try {
            await incrementNoticeViews(noticeId);
          } catch (viewError) {
            console.error('[API] Error incrementing notice views:', viewError);
            // 조회수 증가 실패는 무시하고 계속 진행
          }
          
          res.json({ notice });
        } catch (error) {
          console.error('[API] Error fetching notice:', error);
          res.status(500).json({ error: "Failed to fetch notice" });
        }
        return;
      } else if (path === "/resources/notices") {
        // 공지사항 목록 조회
        try {
          const query = url.searchParams;
          const options = {
            search: query.get('search') || undefined,
            page: query.get('page') ? parseInt(query.get('page')!) : 1,
            limit: query.get('limit') ? parseInt(query.get('limit')!) : 20,
            published: true, // 공개 API는 항상 published=true
          };
          
          const result = await getNotices(options);
          res.json(result);
        } catch (error) {
          console.error('[API] Error fetching notices:', error);
          res.status(500).json({ error: "Failed to fetch notices" });
        }
        return;
      }
    }
    
    res.status(404).json({ error: "Notice endpoint not found" });
    return;
  }

  // 기본 응답
  res.json({
    message: "API endpoint",
    availableEndpoints: [
      "/admin/*", 
      "/stibee/subscribe", 
      "/events/participate",
      "/resources/events", 
      "/product/whatsnews",
      "/resources/faqs",
      "/resources/faq-categories",
      "/resources/glossaries",
      "/resources/glossary-categories",
      "/resources/blogs",
      "/resources/blog-categories",
      "/resources/notices"
    ],
  });
});

/**
 * 통합 API 라우터
 * 모든 API 엔드포인트를 여기서 라우팅합니다.
 */
export const api = functions
  .region("asia-northeast3")
  .runWith({
    timeoutSeconds: 300, // 5분으로 증가 (이미지 업로드용)
    memory: "512MB", // 메모리 증가 (이미지 처리용)
  })
  .https.onRequest(app);