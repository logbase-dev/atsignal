export type Site = 'web' | 'docs';
export type Locale = 'ko' | 'en';

export type PageType = 'dynamic' | 'static' | 'notice' | 'links';

export interface LocalizedField {
  ko: string;
  en?: string;
}

export interface Menu {
  id?: string;
  site: Site;
  labels: LocalizedField;
  path: string;
  pageType?: PageType;  // 새 필드 추가 (기본값: 'dynamic')
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
  createdBy?: string; // 생성한 관리자 ID (선택적 - 기존 데이터 대응)
  updatedBy?: string; // 수정한 관리자 ID (선택적)
}

export interface PageDraftPayload {
  menuId: string;
  slug: string;
  labels: LocalizedField;
  content: LocalizedField;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
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
  createdBy?: string; // 생성한 관리자 ID (선택적 - 기존 데이터 대응)
  updatedBy?: string; // 수정한 관리자 ID (선택적)
}

export interface Block {
  type: string;
  data: Record<string, any>;
}

export interface BlogPost {
  id?: string;
  title: LocalizedField;
  slug: string;
  content: LocalizedField;
  excerpt?: LocalizedField;

  // Category
  categoryId?: string;

  // Publish
  publishedAt?: Date;
  published: boolean;

  // Metadata
  tags?: string[];
  thumbnail?: string;
  featuredImage?: string;

  // Author
  authorName?: string; // 저자명
  authorImage?: string; // 저자 이미지 URL

  // Editor
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';

  // Locale enable flags
  enabled: {
    ko: boolean;
    en: boolean;
  };

  // SEO
  metaTitle?: LocalizedField;
  metaDescription?: LocalizedField;
  metaKeywords?: string[];

  // Ordering / featured
  isFeatured?: boolean;
  order?: number;

  // Views (web-side increments later)
  views?: number;

  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
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
  createdBy?: string; // 생성한 관리자 ID (선택적 - 기존 데이터 대응)
  updatedBy?: string; // 수정한 관리자 ID (선택적)
}

export interface FAQ {
  id?: string;
  question: LocalizedField;
  answer: LocalizedField;
  categoryId?: string; // 카테고리 (선택사항)
  level: number; // 우선순위 레벨 (낮을수록 높은 우선순위, 기본값: 999)
  isTop: boolean; // 맨 상위 표시 여부 (기본값: false)
  enabled: {
    ko: boolean;
    en: boolean;
  };
  tags?: string[]; // 해시태그 배열 (선택사항) - 추가
  views?: number; // ✅ 조회수 (web 앱에서만 증가, admin은 표시만)
  editorType?: 'nextra' | 'toast'; // 에디터 타입
  saveFormat?: 'markdown' | 'html'; // 저장 형식
  createdAt?: Date;
  updatedAt?: Date;
  order?: number; // 정렬 순서 (같은 level 내에서)
  createdBy?: string; // 생성한 관리자 ID (선택적 - 기존 데이터 대응)
  updatedBy?: string; // 수정한 관리자 ID (선택적)
}

export interface Admin {
  id?: string; // Firestore 문서 ID
  username: string; // 로그인 아이디 (고유, 소문자)
  password: string; // 해시된 비밀번호 (bcrypt)
  name: string; // 관리자 이름
  enabled: boolean; // 활성화 여부 (기본값: true)
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  lastLoginAt?: Date; // 마지막 로그인 일시
  createdBy?: string; // 생성한 관리자 ID (최초 관리자는 null)
}

export interface AdminLoginLog {
  id?: string; // Firestore 문서 ID
  adminId: string; // 관리자 ID (admins 컬렉션 참조)
  username: string; // 로그인 시도한 아이디 (인덱싱용)
  ipAddress?: string; // 접속 IP 주소
  userAgent?: string; // 브라우저 정보
  success: boolean; // 로그인 성공 여부
  failureReason?: string; // 실패 사유 (success=false일 때)
  createdAt: Date; // 접속 시도 일시
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
  email: string;
  phone?: string;
  company?: string;
  privacyConsent?: boolean;
  createdAt?: Date;
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

export interface RelatedLink {
  url: string; // 문서 URL (예: /docs/ko/getting-started, /faq/123)
  title?: string; // 문서 제목 (자동 추출 또는 수동 입력)
  linkType: 'docs' | 'faq' | 'blog' | 'notice'; // 링크 타입
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
  createdBy?: string; // 생성한 관리자 ID (선택적 - 기존 데이터 대응)
  updatedBy?: string; // 수정한 관리자 ID (선택적)
}

export interface Glossary {
  id?: string;
  term: LocalizedField; // 용어명 (한국어/영어)
  description: LocalizedField; // 설명 (한국어/영어)
  categoryId: string; // 카테고리 ID (glossaryCategories 컬렉션 참조)
  initialLetter: string; // 첫 글자 (A-Z, 정렬용, 대문자)
  relatedLinks?: RelatedLink[]; // 관련 문서 링크 배열 (선택사항)
  enabled: {
    // 활성화 상태
    ko: boolean; // 한국어 활성화
    en: boolean; // 영어 활성화
  };
  views?: number; // 조회수 (기본값: 0)
  editorType?: 'nextra' | 'toast'; // 에디터 타입
  saveFormat?: 'markdown' | 'html'; // 저장 형식
  createdAt?: Date; // 생성일시
  updatedAt?: Date; // 수정일시
  createdBy?: string; // 생성한 관리자 ID
  updatedBy?: string; // 수정한 관리자 ID
}

