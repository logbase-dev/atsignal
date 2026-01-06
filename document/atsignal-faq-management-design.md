# FAQ 관리 시스템 설계 문서

| 문서 버전 | 작성일     | 작성자           |
| --------- | ---------- | ---------------- |
| 1.0       | 2025-01-XX | Cursor Assistant |

---

## 1. 개요

### 1.1 목적

관리자 페이지에서 FAQ(자주 묻는 질문)를 효율적으로 관리할 수 있는 시스템을 구축합니다. FAQ는 카테고리별로 분류되며, 우선순위(level)와 상단 고정 기능을 제공합니다.

### 1.2 범위

- FAQ 항목의 CRUD 기능
- 카테고리 관리 기능
- FAQ 목록 조회 및 필터링
- 우선순위 및 상단 고정 관리

---

## 2. Firestore 데이터 구조

### 2.1 FAQ 컬렉션 (`faqs`)

각 FAQ 항목은 다음과 같은 구조를 가집니다:

```typescript
interface FAQ {
  id?: string; // Firestore 자동 생성 ID
  question: LocalizedField; // 질문 (한국어/영어)
  answer: LocalizedField; // 답변 (한국어/영어)
  categoryId: string; // 카테고리 ID (faqCategories 컬렉션 참조)
  level: number; // 우선순위 레벨 (낮을수록 높은 우선순위, 기본값: 999)
  isTop: boolean; // 맨 상위 표시 여부 (기본값: false)
  enabled: {
    // 활성화 상태
    ko: boolean; // 한국어 활성화
    en: boolean; // 영어 활성화
  };
  tags?: string[]; // 해시태그 배열 (선택사항)
  createdAt?: Date; // 생성일시
  updatedAt?: Date; // 수정일시
  order?: number; // 정렬 순서 (같은 level 내에서)
}

interface LocalizedField {
  ko: string; // 한국어
  en?: string; // 영어 (선택사항)
}
```

**Firestore 문서 예시:**

```json
{
  "question": {
    "ko": "AtSignal은 무엇인가요?",
    "en": "What is AtSignal?"
  },
  "answer": {
    "ko": "AtSignal은 실시간 통신 솔루션입니다...",
    "en": "AtSignal is a real-time communication solution..."
  },
  "categoryId": "cat_001",
  "level": 1,
  "isTop": true,
  "enabled": {
    "ko": true,
    "en": true
  },
  "tags": ["시작하기", "기본", "설치"],
  "order": 0,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### 2.2 FAQ 카테고리 컬렉션 (`faqCategories`)

카테고리는 별도 컬렉션으로 관리되며, FAQ 항목 생성 시 선택할 수 있습니다:

```typescript
interface FAQCategory {
  id?: string; // Firestore 자동 생성 ID
  name: LocalizedField; // 카테고리명 (한국어/영어)
  description?: LocalizedField; // 카테고리 설명 (선택사항)
  order: number; // 정렬 순서
  enabled: {
    // 활성화 상태
    ko: boolean;
    en: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Firestore 문서 예시:**

```json
{
  "name": {
    "ko": "일반",
    "en": "General"
  },
  "description": {
    "ko": "일반적인 질문과 답변",
    "en": "General questions and answers"
  },
  "order": 1,
  "enabled": {
    "ko": true,
    "en": true
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## 3. 파일 구조

### 3.1 관리자 페이지 구조

```
apps/admin/
├── app/
│   └── faq/
│       ├── page.tsx                    # FAQ 목록 페이지
│       ├── new/
│       │   └── page.tsx                # FAQ 추가 페이지
│       └── [id]/
│           └── page.tsx                # FAQ 수정 페이지
├── components/
│   └── faq/
│       ├── FAQList.tsx                 # FAQ 목록 컴포넌트
│       ├── FAQForm.tsx                 # FAQ 추가/수정 폼 컴포넌트
│       ├── FAQCategoryModal.tsx        # 카테고리 관리 모달
│       └── FAQCategoryList.tsx         # 카테고리 목록 컴포넌트
└── lib/
    └── admin/
        ├── faqService.ts               # FAQ CRUD 서비스
        ├── faqCategoryService.ts       # 카테고리 CRUD 서비스
        └── types.ts                    # 타입 정의 추가
```

---

## 4. 기능 상세 설계

### 4.1 FAQ 목록 페이지 (`/faq`)

**기능:**

- FAQ 목록 조회 (카테고리별 필터링 가능)
- 검색 기능 (질문/답변 내용 검색)
- 해시태그 필터링 기능
- 정렬 기능 (level, isTop, createdAt 기준)
- FAQ 추가 버튼
- FAQ 수정/삭제 버튼
- 카테고리 관리 버튼

**UI 구성:**

```
┌─────────────────────────────────────────────────────────┐
│ FAQ 관리                                    [FAQ 추가]  │
├─────────────────────────────────────────────────────────┤
│ [카테고리 필터] [해시태그 필터] [검색] [정렬] [카테고리 관리] │
├─────────────────────────────────────────────────────────┤
│ ⭐ 질문: AtSignal은 무엇인가요?        [수정] [삭제]  │
│    답변: AtSignal은 실시간 통신 솔루션...              │
│    카테고리: 일반 | Level: 1 | #시작하기 #기본 #설치   │
├─────────────────────────────────────────────────────────┤
│ 질문: 어떻게 시작하나요?              [수정] [삭제]   │
│ 답변: 시작하려면...                                    │
│ 카테고리: 시작하기 | Level: 2                          │
└─────────────────────────────────────────────────────────┘
```

### 4.2 FAQ 추가/수정 페이지 (`/faq/new`, `/faq/[id]`)

**기능:**

- 질문 입력 (한국어/영어)
- 답변 입력 (한국어/영어) - Toast UI Editor 또는 Nextra Markdown 사용
- 카테고리 선택 (드롭다운)
- Level 설정 (숫자 입력, 낮을수록 높은 우선순위)
- 해시태그 입력 (자동완성 기능 포함, 쉼표 또는 엔터로 구분)
- 맨 상위 표시 체크박스
- 활성화 상태 설정 (한국어/영어 각각)

**UI 구성:**

```
┌─────────────────────────────────────────────────────────┐
│ FAQ 추가/수정                                            │
├─────────────────────────────────────────────────────────┤
│ [기본 설정] ────────────────────────────────────────────│
│ 카테고리 * [드롭다운 ▼]                                  │
│ Level [___] (낮을수록 높은 우선순위)                    │
│ 해시태그 [입력창] (자동완성 제안)                        │
│   기존 태그: #시작하기 #기본 #설치 #결제 ...            │
│ ☑ 맨 상위 표시                                           │
│ ☑ 한국어 활성화  ☑ 영어 활성화                          │
├─────────────────────────────────────────────────────────┤
│ [콘텐츠] ───────────────────────────────────────────────│
│ 질문 (한국어) *                                          │
│ [________________________________________________]      │
│                                                          │
│ 질문 (영어)                                              │
│ [________________________________________________]      │
│                                                          │
│ 답변 (한국어) *                                          │
│ [에디터 영역]                                            │
│                                                          │
│ 답변 (영어)                                              │
│ [에디터 영역]                                            │
│                                                          │
│ [취소] [저장]                                            │
└─────────────────────────────────────────────────────────┘
```

### 4.3 카테고리 관리 모달

**기능:**

- 카테고리 목록 조회
- 카테고리 추가
- 카테고리 수정
- 카테고리 삭제 (해당 카테고리를 사용하는 FAQ가 있으면 경고)
- 카테고리 정렬 순서 변경

**UI 구성:**

```
┌─────────────────────────────────────────────────────────┐
│ 카테고리 관리                                [닫기]     │
├─────────────────────────────────────────────────────────┤
│ [카테고리 추가]                                          │
├─────────────────────────────────────────────────────────┤
│ 일반 (General)                    [수정] [삭제]        │
│ 시작하기 (Getting Started)         [수정] [삭제]        │
│ 결제 (Payment)                    [수정] [삭제]        │
└─────────────────────────────────────────────────────────┘
```

---

## 5. API/서비스 함수 설계

### 5.1 FAQ 서비스 (`faqService.ts`)

```typescript
// FAQ 목록 조회
export async function getFAQs(options?: {
  categoryId?: string;
  tags?: string[]; // 해시태그 배열로 필터링
  search?: string;
  orderBy?: "level" | "isTop" | "createdAt";
  orderDirection?: "asc" | "desc";
}): Promise<FAQ[]>;

// 모든 해시태그 목록 조회 (자동완성용)
export async function getAllTags(): Promise<string[]>;

// FAQ 단건 조회
export async function getFAQById(id: string): Promise<FAQ | null>;

// FAQ 생성
export async function createFAQ(faq: Omit<FAQ, "id">): Promise<string>;

// FAQ 수정
export async function updateFAQ(id: string, faq: Partial<FAQ>): Promise<void>;

// FAQ 삭제
export async function deleteFAQ(id: string): Promise<void>;

// FAQ 순서 변경
export async function updateFAQOrder(id: string, order: number): Promise<void>;
```

### 5.2 카테고리 서비스 (`faqCategoryService.ts`)

```typescript
// 카테고리 목록 조회
export async function getFAQCategories(): Promise<FAQCategory[]>;

// 카테고리 단건 조회
export async function getFAQCategoryById(
  id: string
): Promise<FAQCategory | null>;

// 카테고리 생성
export async function createFAQCategory(
  category: Omit<FAQCategory, "id">
): Promise<string>;

// 카테고리 수정
export async function updateFAQCategory(
  id: string,
  category: Partial<FAQCategory>
): Promise<void>;

// 카테고리 삭제
export async function deleteFAQCategory(id: string): Promise<void>;

// 카테고리 사용 여부 확인 (FAQ에서 사용 중인지)
export async function isCategoryInUse(categoryId: string): Promise<boolean>;
```

---

## 6. 정렬 및 필터링 로직

### 6.1 기본 정렬 규칙

1. **맨 상위 표시 항목 우선**: `isTop === true`인 항목이 먼저 표시
2. **Level 기준 정렬**: 같은 `isTop` 값 내에서 `level`이 낮은 순서대로
3. **Order 기준 정렬**: 같은 `level` 내에서 `order`가 낮은 순서대로
4. **생성일 기준**: 위 조건이 모두 같으면 `createdAt` 최신순

**Firestore 쿼리 예시:**

```typescript
// 1. isTop이 true인 항목 (level 오름차순, order 오름차순)
const topFAQs = query(
  faqsRef,
  where("isTop", "==", true),
  orderBy("level", "asc"),
  orderBy("order", "asc")
);

// 2. isTop이 false인 항목 (level 오름차순, order 오름차순)
const normalFAQs = query(
  faqsRef,
  where("isTop", "==", false),
  orderBy("level", "asc"),
  orderBy("order", "asc")
);
```

### 6.2 필터링 옵션

- **카테고리별 필터**: `categoryId`로 필터링
- **해시태그 필터**: `tags` 배열에 특정 태그가 포함된 FAQ만 필터링 (하나 이상의 태그가 일치하면 표시)
- **검색**: `question.ko`, `question.en`, `answer.ko`, `answer.en`에서 텍스트 검색
- **활성화 상태**: `enabled.ko` 또는 `enabled.en` 기준 필터링

**해시태그 필터링 로직:**

- 사용자가 선택한 태그 중 하나라도 FAQ의 `tags` 배열에 포함되어 있으면 표시
- 예: 필터에 `["시작하기", "기본"]` 선택 시, `tags: ["시작하기"]` 또는 `tags: ["기본", "설치"]`인 FAQ 모두 표시

---

## 7. 구현 단계

### Phase 1: 기본 구조 및 타입 정의

1. `types.ts`에 FAQ, FAQCategory 타입 추가
2. Firestore 컬렉션 구조 설계 및 문서화

### Phase 2: 카테고리 관리 기능

1. `faqCategoryService.ts` 구현
2. 카테고리 관리 모달 컴포넌트 구현
3. 카테고리 CRUD 기능 테스트

### Phase 3: FAQ 기본 CRUD 기능

1. `faqService.ts` 구현
2. FAQ 목록 페이지 구현
3. FAQ 추가/수정 페이지 구현
4. FAQ 삭제 기능 구현

### Phase 4: 고급 기능

1. 검색 기능 구현
2. 필터링 기능 구현 (카테고리, 해시태그 포함)
3. 해시태그 자동완성 기능 구현
4. 정렬 기능 구현
5. 드래그 앤 드롭으로 순서 변경 기능 (선택사항)

### Phase 5: 프론트엔드 연동

1. Web/Docs 앱에서 FAQ 표시 페이지 구현
2. API 엔드포인트 구현 (필요 시)

---

## 8. Firestore 인덱스 요구사항

다음과 같은 복합 인덱스가 필요할 수 있습니다:

1. `isTop` + `level` + `order` (기본 정렬)
2. `categoryId` + `isTop` + `level` (카테고리별 정렬)
3. `enabled.ko` + `isTop` + `level` (한국어 활성화 항목만)
4. `enabled.en` + `isTop` + `level` (영어 활성화 항목만)

**참고:** 해시태그 필터링은 클라이언트 측에서 배열 필드(`array-contains-any`)를 사용하여 구현할 수 있습니다. Firestore는 `array-contains-any` 쿼리를 지원하지만, 복합 쿼리와 함께 사용할 경우 추가 인덱스가 필요할 수 있습니다.

---

## 9. 보안 규칙 (Firestore Rules)

```javascript
match /faqs/{faqId} {
  allow read: if request.auth != null;  // 인증된 사용자만 읽기
  allow write: if request.auth != null; // 인증된 사용자만 쓰기 (추후 역할 기반 접근 제어 추가)
}

match /faqCategories/{categoryId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 10. 향후 개선 사항

1. **FAQ 조회수 통계**: 자주 조회되는 FAQ 파악
2. **FAQ 평가 기능**: 도움이 되었는지 평가 (좋아요/싫어요)
3. **FAQ 관련 문서 링크**: 관련 페이지나 문서로 연결
4. **FAQ 검색 최적화**: Algolia 등 외부 검색 서비스 연동
5. **FAQ 버전 관리**: 답변 변경 이력 추적
6. **FAQ 자동 번역**: AI를 활용한 자동 번역 기능

---

## 11. 참고 사항

- FAQ 답변은 Toast UI Editor 또는 Nextra Markdown을 사용하여 작성 가능
- 카테고리는 FAQ 항목 생성 전에 먼저 생성해야 함
- 카테고리 삭제 시 해당 카테고리를 사용하는 FAQ가 있으면 삭제 불가 (또는 기본 카테고리로 이동)
- Level은 숫자로 관리하며, 낮을수록 높은 우선순위를 의미
- `isTop`이 true인 항목은 최대 5개 정도로 제한하는 것을 권장 (UI 고려)
- **해시태그 기능:**
  - 해시태그는 FAQ 항목에 선택적으로 추가 가능
  - 태그는 문자열 배열로 저장되며, 쉼표 또는 엔터로 구분하여 입력
  - 입력 시 기존에 사용된 태그를 자동완성으로 제안하여 일관성 유지
  - 중복 태그는 자동으로 제거됨
  - 태그는 대소문자를 구분하지 않으며, 공백은 제거됨
  - FAQ 목록에서 해시태그로 필터링 가능
