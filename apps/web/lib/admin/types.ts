export type Site = 'web' | 'docs';
export type Locale = 'ko' | 'en';

export type PageType = 'dynamic' | 'static' | 'notice' | 'links';

// Firestore 컬렉션 이름 상수
export const COLLECTIONS = {
  ADMINS: 'admins',
  ADMIN_LOGIN_LOGS: 'adminLoginLogs',
  EVENTS: 'events',
  EVENT_PARTICIPANTS: 'eventParticipants',
  DEMO_REQUESTS: 'demoRequests',
  SALES_INQUIRIES: 'salesInquiries',
  NOTICES: 'notices',
  BLOGS: 'blogs',
  BLOG_CATEGORIES: 'blogCategories',
  FAQS: 'faqs',
  FAQ_CATEGORIES: 'faqCategories',
  GLOSSARIES: 'glossaries',
  GLOSSARY_CATEGORIES: 'glossaryCategories',
  WHATSNEW: 'whatsnew',
  PAGES: 'pages',
  MENUS: 'menus',
} as const;

export interface LocalizedField {
  ko: string;
  en?: string;
}

export interface Menu {
  id?: string;
  site: Site;
  labels: LocalizedField;
  path: string;
  pageType?: PageType;
  depth: number;
  parentId: string;
  order: number;
  enabled: {
    ko: boolean;
    en: boolean;
  };
  description?: LocalizedField;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Page {
  id?: string;
  site: Site;
  menuId: string;
  slug: string;
  labelsLive: LocalizedField;
  labelsDraft?: LocalizedField;
  contentLive: LocalizedField;
  contentDraft?: LocalizedField;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
  createdAt?: Date;
  updatedAt?: Date;
  draftUpdatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface PageDraftPayload {
  menuId: string;
  slug: string;
  labels: LocalizedField;
  content: LocalizedField;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
}

export interface FAQCategory {
  id?: string;
  name: LocalizedField;
  description?: LocalizedField;
  order: number;
  enabled: {
    ko: boolean;
    en: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface FAQ {
  id?: string;
  question: LocalizedField;
  answer: LocalizedField;
  categoryId?: string;
  level: number;
  isTop: boolean;
  enabled: {
    ko: boolean;
    en: boolean;
  };
  tags?: string[];
  views?: number;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
  createdAt?: Date;
  updatedAt?: Date;
  order?: number;
  createdBy?: string;
  updatedBy?: string;
}

export interface Admin {
  id?: string;
  username: string;
  password: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  createdBy?: string;
}

export interface AdminLoginLog {
  id?: string;
  adminId: string;
  username: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
  createdAt: Date;
}

export interface BlogPost {
  id?: string;
  title: LocalizedField;
  slug: string;
  content: LocalizedField;
  excerpt?: LocalizedField;

  categoryId?: string;

  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  published: boolean;

  tags?: string[];
  thumbnail?: string;
  featuredImage?: string;

  // Author
  authorName?: string; // 저자명
  authorImage?: string; // 저자 이미지 URL

  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';

  enabled: {
    ko: boolean;
    en: boolean;
  };

  metaTitle?: LocalizedField;
  metaDescription?: LocalizedField;
  metaKeywords?: string[];

  isFeatured?: boolean;
  order?: number;
  views?: number;
  likes?: number; // 좋아요 총 개수

  createdBy?: string;
  updatedBy?: string;
}

// 블로그 좋아요 기록
export interface BlogLike {
  id?: string;
  blogId: string;          // 블로그 포스트 ID
  userId?: string;         // 사용자 ID (로그인한 경우)
  sessionId?: string;      // 세션 ID (비로그인 사용자)
  ipAddress?: string;      // IP 주소 (중복 방지용)
  userAgent?: string;      // User Agent (추가 보안)
  createdAt?: Date;
}

export interface BlogCategory {
  id?: string;
  name: LocalizedField;
  description?: LocalizedField;
  slug: string;
  order: number;
  enabled: {
    ko: boolean;
    en: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Notice {
  id?: string; // Firestore 문서 ID
  title: LocalizedField; // 제목 (ko: 필수, en: 선택)
  oneLiner: LocalizedField; // 롤링 배너용 한 줄 문구 (50글자 미만, ko: 필수, en: 선택)
  content: LocalizedField; // 상세 내용 (ko: 필수, en: 선택)

  // 롤링 배너 노출 제어
  showInBanner: boolean; // 홈 상단 롤링 배너 노출 여부
  bannerPriority: number; // 배너 노출 우선순위 (낮을수록 우선, 기본값: 999)

  // 노출 기간 (선택사항)
  displayStartAt?: Date; // 노출 시작일시
  displayEndAt?: Date; // 노출 종료일시

  // 발행 관련
  published: boolean; // 발행 여부
  publishedAt?: Date; // 발행일시 (published=true일 때 자동 설정)

  // 에디터 설정
  editorType?: 'nextra' | 'toast'; // 에디터 타입
  saveFormat?: 'markdown' | 'html'; // 저장 형식

  // 활성화 상태
  enabled: {
    ko: boolean; // 한국어 활성화
    en: boolean; // 영어 활성화
  };

  // 목록 상단 고정
  isTop: boolean; // 목록 상단에 고정 표시 여부 (기본값: false)

  // 조회수
  views?: number; // 조회수 (기본값: 0)

  // 타임스탬프
  createdAt?: Date;
  updatedAt?: Date;

  // 작성자 정보
  createdBy?: string; // 생성한 관리자 ID
  updatedBy?: string; // 수정한 관리자 ID
  authorName?: string; // 작성자 이름 (조회 시 추가되는 필드)
}

export interface Event {
  id?: string;
  title: LocalizedField;
  description?: LocalizedField;
  content?: LocalizedField;
  oneLiner?: LocalizedField;
  startDate?: Date;
  endDate?: Date;
  eventStartAt?: Date;
  eventEndAt?: Date;
  displayStartAt?: Date;
  displayEndAt?: Date;
  location?: LocalizedField;
  imageUrl?: string;
  featuredImage?: string;
  thumbnailImage?: string;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
  enabled: {
    ko: boolean;
    en: boolean;
  };
  published: boolean;
  publishedAt?: Date;
  showInBanner?: boolean;
  bannerPriority?: number;
  isMainEvent?: boolean;
  subEventOrder?: number;
  hasCtaButton?: boolean;
  ctaButtonText?: LocalizedField;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface EventParticipant {
  id?: string;
  eventId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  privacyConsent: boolean;
  createdAt?: Date;
}

export interface DemoRequest {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiry: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
  contactedAt?: Date;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SalesInquiry {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  inquiry: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
  contactedAt?: Date;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface WhatsNew {
  id?: string;
  title: LocalizedField;
  content: LocalizedField;
  oneLiner?: LocalizedField;
  imageUrl?: string;
  linkUrl?: string;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
  enabled: {
    ko: boolean;
    en: boolean;
  };
  published: boolean;
  publishedAt?: Date;
  showInBanner?: boolean;
  bannerPriority?: number;
  isTop?: boolean;
  displayStartAt?: Date;
  displayEndAt?: Date;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

// ... 기존 코드 (EventParticipant, WhatsNew 등) ...

export interface RelatedLink {
  url: string;
  title?: string;
  linkType: 'docs' | 'faq' | 'blog' | 'notice';
}

export interface GlossaryCategory {
  id?: string;
  name: LocalizedField;
  description?: LocalizedField;
  order: number;
  enabled: {
    ko: boolean;
    en: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface Glossary {
  id?: string;
  term: LocalizedField;
  description: LocalizedField;
  categoryId?: string;
  enabled: {
    ko: boolean;
    en: boolean;
  };
  relatedLinks?: RelatedLink[];
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
  initialLetter?: string;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

