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
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  published: boolean;
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

