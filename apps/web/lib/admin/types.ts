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


