# AtSignal 설계문서

| 문서 버전  | 작성일     | 작성자           |
| ---------- | ---------- | ---------------- |
| 0.2 (수정) | 2025-01-XX | Cursor Assistant |

> 본 설계서는 `at signal-요구사항정의서-초안.md`를 기반으로 한 초기 설계안으로, 미정 항목(TBD)은 추후 결정 사항을 반영한다.

---

## 1. 시스템 개요

### 1.1 아키텍처 개요

- **구성요소**
  - `apps/web`: 마케팅/세일즈 중심 메인 사이트(Next.js App Router).
  - `apps/docs`: 기술 문서/가이드 제공 사이트(Next.js App Router).
  - `apps/support`: 고객지원 포털, Jira 연동 기능 포함.
  - `apps/app`: AtSignal 솔루션 체험 사이트(Next.js App Router, 디렉토리 구조 미정).
  - `apps/admin`: CMS 관리 인터페이스(Next.js App Router, 별도 앱이지만 `atsignal.io/admin` 경로로 접근).
  - `functions`: Firebase Functions (API Gateway, Webhook 처리, 프로시 로직).
  - `shared`: 공통 유틸리티, 타입, UI 컴포넌트.
- **호스팅**
  - Firebase Hosting Target `web`, `docs`, `support`, `app`에 각각 배포.
  - Admin 앱은 개발 단계에서 Vercel 배포, `atsignal.io/admin` 경로로 접근 (최종: Firebase Hosting 전환 예정).
  - Functions는 동일 Firebase 프로젝트에서 동작.
- **데이터 소스**
  - Firestore (콘텐츠 CMS, 메뉴 메타, 지원 포털 데이터).
  - 외부 API: InBlog, Jira Cloud, Stibee.

### 1.2 데이터 플로우

```
사용자 요청 → Firebase Hosting (web/docs/support/app) → Next.js → Firestore/External API
                                               ↘ (필요 시) Firebase Functions → External API
```

- Firestore 기반 동적 콘텐츠는 SSG + ISR 조합 적용(TBD).
- Support 포털은 클라이언트에서 Next.js Route Handler → Functions → Jira API 흐름 구성.

### 1.3 배포 파이프라인 요약

- `build:web|docs|support|app|admin|functions` 스크립트.
- GitHub Actions(TBD)로 `deploy:all` 또는 Target별 배포.
- Admin 앱은 Vercel에서 `apps/web`과 함께 빌드하여 같은 도메인에 배포.
- Functions는 `firebase deploy --only functions`로 독립 배포 가능.

---

## 2. 프런트엔드 설계

### 2.1 공통 기술 스택

- Next.js 14 App Router, TypeScript, React Server Components + Client Components 조합.
- 스타일링: Tailwind CSS + 모듈 CSS (확정 필요).
- 상태 관리: React Query/SWR (데이터 fetch 케이스별 적용; TBD).
- 번들: Vercel SWC, Firebase Hosting 배포 시 Static Export + Serverless Functions 조합.

### 2.2 디렉터리 표준

```
apps/<app>/
├── app/
│   ├── (marketing)/
│   ├── (product)/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── sections/
├── lib/
│   ├── api/
│   ├── cms/
│   └── analytics/
└── styles/
```

- `shared/ui`에 공통 디자인 시스템 컴포넌트 배치.
- `shared/lib/firebase.ts` 등 공통 clients 제공.

### 2.3 메뉴 & 라우팅 전략 (FR-001~FR-009)

- 네비게이션 데이터는 Firestore `menus` 컬렉션 또는 JSON Config(TBD)에서 fetch.
- 정적 페이지 vs 동적 페이지 판단:
  - 정적: Home, Pricing 등 고정 콘텐츠.
  - 동적: Product/Solutions/Resources 문서 → Firestore/Markdown 기반.
- 각 앱의 `app/(marketing)/[slug]/page.tsx` 형태로 동적 라우팅 구성.
- `atsignal-menu.txt`의 Depth 정보를 기반으로 BreadCrumb/Sidebar 컴포넌트 구성.

### 2.4 동적 콘텐츠 구현 (FR-101~FR-105)

- Firestore 컬렉션 구조(초안):
  - `pages`: `slug`, `title`, `type`(html|markdown|block), `content`, `blocks[]`, `meta`.
  - `menus`: `depth`, `label`, `path`, `parentId`, `order`, `checkpoints`.
- 렌더링 전략:
  - HTML 저장형: `<div dangerouslySetInnerHTML />` (sanitize 적용: DOMPurify 등).
  - Markdown형: `react-markdown` + `rehype-slug` (TOC 자동 생성) + `rehype-highlight`.
  - Block Schema형: `componentsMap = { hero: HeroSection, ... }`.
- TOC (Table of Contents) 자동 생성:
  - `rehype-slug`로 헤딩에 자동 ID 부여.
  - IntersectionObserver로 스크롤 스파이 구현.
  - Nextra 스타일 우측 고정 사이드바 형태.
- Pre-render 전략:
  - Incremental Static Regeneration(ISR) or On-demand Revalidation (TBD).
  - Support 포털은 Server Side Rendering(SSR) 필요(로그인/연동 데이터).

---

## 2.5 Admin 앱 설계

### 2.5.1 아키텍처

- **구조**: 별도의 Next.js 앱(`apps/admin/`)으로 개발되지만, 사용자는 `atsignal.io/admin` 경로로 접근.
- **배포**: Vercel에서 `apps/web`과 함께 빌드하여 같은 도메인에 배포.
- **장점**:
  - Admin 앱과 메인 웹 앱의 코드 분리로 유지보수 용이.
  - 같은 도메인 사용으로 CORS 문제 없음.
  - 쿠키 기반 인증 공유 가능.

### 2.5.2 주요 기능

- **페이지 관리**: Firestore 기반 CMS로 페이지 생성, 수정, 삭제.
- **드래프트/발행 워크플로우**:
  - 드래프트 저장: `labelsDraft`, `contentDraft` 필드에 저장.
  - 발행: `labelsLive`, `contentLive` 필드에 저장.
  - 미리보기: Next.js Preview Mode로 드래프트 내용을 실제 사이트에서 확인.
- **Nextra 스타일 에디터**: Write/Preview 탭이 있는 마크다운 에디터(`NextraMarkdownField`).
- **메뉴 관리**: 계층 구조 메뉴, 언어별 독립 활성화(`enabled.ko`, `enabled.en`).
- **인증**: 쿠키 기반 인증, 7일간 유효한 `admin-auth` 쿠키 사용.

### 2.5.3 빌드 프로세스

1. `apps/web` 빌드 → `apps/web/out`.
2. `apps/admin` 빌드 → `apps/web/out/admin` (또는 별도 처리).
3. Vercel rewrites로 `/admin/*` 요청을 Admin 앱으로 라우팅.

---

## 3. 백엔드(Firebase Functions) 설계

### 3.1 구조

```
functions/src/
├── index.ts         # entry
├── api/             # HTTPS callable API (REST style)
│   ├── inblog.ts
│   ├── stibee.ts
│   ├── support.ts
├── jira/            # Webhook handlers, Jira client
├── cms/             # Firestore admin helpers
└── utils/
    ├── firebaseAdmin.ts
    ├── logger.ts
    └── http.ts
```

- TypeScript + Firebase Admin SDK 활용.
- Express 앱을 `functions.https.onRequest`로 래핑하여 REST Endpoint 구성.

### 3.2 API 엔드포인트 설계 (초안)

| 기능              | 경로                                | 메서드 | 인증                            | 설명                          |
| ----------------- | ----------------------------------- | ------ | ------------------------------- | ----------------------------- |
| InBlog 리스트     | `/api/inblog/posts`                 | GET    | Bearer (Cloud Functions Secret) | 인블로그 API proxy + 캐시     |
| InBlog 상세       | `/api/inblog/posts/:id`             | GET    | 동일                            |                               |
| Stibee 구독       | `/api/stibee/subscribe`             | POST   | reCAPTCHA/Rate Limit (TBD)      | Functions에서 Stibee API 호출 |
| Support 이슈 생성 | `/api/support/issues`               | POST   | JWT/Session                     | Jira REST API 호출            |
| Support 이슈 목록 | `/api/support/issues`               | GET    | JWT/Session                     |                               |
| Support 댓글      | `/api/support/issues/:key/comments` | POST   | JWT/Session                     |                               |

- 인증/인가 방식은 Support Portal 로그인 전략 확정 필요(TBD).
- 응답 구조: `data`, `error`, `meta` 통일.

### 3.3 Webhook 처리 (FR-205, NFR-004)

- `functions/src/jira/webhook.ts`
  - 수신 URL: `/webhooks/jira`
  - 이벤트: `issue_created`, `issue_updated`, `issue_commented`.
  - 검증: HMAC 서명 또는 Basic Auth(TBD).
  - 처리: Firestore `supportTickets/{issueKey}` 업데이트, 알림 Trigger.
- Stibee Webhook(옵션): `/webhooks/stibee` (발송 결과 수신, TBD).
- 에러 처리: Cloud Logging, Slack/Email 알림 연동(TBD).

---

## 4. 데이터 모델 설계

### 4.1 Firestore 컬렉션 (초안)

| 컬렉션                  | 필드 (예시)                                                                                                         | 설명                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `pages`                 | `site`, `menuId`, `slug`, `labelsLive`, `contentLive`, `labelsDraft`, `contentDraft`, `draftUpdatedAt`, `updatedAt` | CMS 기본 페이지 (드래프트/발행 분리) |
| `menus`                 | `site`, `labels`, `path`, `depth`, `parentId`, `order`, `enabled` (ko/en 독립)                                      | 네비게이션/사이트맵 (언어별 활성화)  |
| `supportTickets`        | `issueKey`, `summary`, `status`, `priority`, `assignee`, `history`, `comments[]`                                    | Jira 연동 캐시                       |
| `newsletterSubscribers` | `email`, `name`, `source`, `status`, `stibeeListId`                                                                 | Stibee 등록 기록                     |
| `settings`              | `key`, `value`, `description`, `updatedAt`                                                                          | 전역 설정 (예: CTA 텍스트)           |

- Index 설계: `pages.slug` unique, `menus.depth+parentId` composite, `supportTickets.status`.
- 보안 규칙: role-based access → Cloud Functions + Custom Claims (TBD).

### 4.2 외부 API 데이터 매핑

- InBlog → Firestore 캐시 구조: `inblogPosts` 컬렉션(선택).
- Jira → Firestore `supportTickets` 배열 형태 vs 하위 컬렉션 `comments`.
- Stibee 구독 결과 → `newsletterSubscribers`에 기록 후 Stibee API 응답 저장.

### 4.3 블록 스키마 (TBD 세부화)

```
type Block =
  | { type: "hero"; props: { title: string; subtitle?: string; cta?: CTA } }
  | { type: "feature-list"; props: { items: FeatureItem[] } }
  | { type: "markdown"; props: { body: string } }
  | { type: "testimonial"; props: { quote: string; author: string } }
  | { type: "html"; props: { html: string } };
```

- 각 블록 컴포넌트는 `shared/blocks/<BlockName>.tsx`에 정의.
- 디자인 시스템과 연결하기 위해 props 인터페이스 확정 필요.

---

## 5. 비기능 설계

### 5.1 성능/가용성

- Next.js ISR 또는 Edge Caching으로 첫 바이트 < 200ms 목표(TBD).
- InBlog API 캐시: Functions Memory Store(Redis) or Firestore Cache → 비용/성능 검토.
- Webhook 처리 3초 이내 응답: 비동기 큐(Firebase Tasks/TBD) 고려.

### 5.2 보안

- Secrets 관리: Firebase Functions에서 Secret Manager 사용.
- Firestore Rules:
  - `pages`, `menus`: 읽기 공개, 쓰기 관리자 role.
  - `supportTickets`: 고객은 본인 이슈만, 내부 직원은 전체 열람.
- Jira/Stibee 통신: HTTPS + IP 제한(가능 시).
- reCAPTCHA v3를 Newsletter/Inquiry 폼에 적용(TBD).

### 5.3 모니터링/로깅

- Cloud Logging + Alerting (에러율, latency).
- Firebase Performance Monitoring for web (TBD).
- 배포 로그: GitHub Actions artifact 저장.

---

## 6. 운영 설계

### 6.1 CMS 운영 프로세스

1. 기획자가 `atsignal-menu.txt` 기준으로 페이지 요구 정의.
2. 디자이너가 블록 기반 레이아웃 가이드 제작.
3. 운영자가 Admin UI(`atsignal.io/admin`)에서 콘텐츠 입력:
   - Nextra 스타일 마크다운 에디터 사용.
   - 드래프트 저장 후 미리보기로 확인.
   - 검수 후 발행 버튼으로 사이트 반영.
4. 메뉴 관리: 계층 구조로 메뉴 생성, 언어별 독립 활성화.
5. On-demand Revalidation API 호출 (필요 시).

### 6.2 고객지원 프로세스

1. 고객 로그인 (SSO 또는 이메일 인증, TBD).
2. 이슈 등록 → Functions → Jira Issue 생성 (`ATS-XXXX`).
3. Jira Webhook → Firestore `supportTickets` 업데이트.
4. 고객 포털에서 상태/댓글 확인, 추가 코멘트 작성 → Jira Comment 작성.
5. SLA 리포트: Cloud Scheduler + Functions로 Jira API polling(주기적).

### 6.3 뉴스레터 운영

- 구독: 웹 폼 → Functions → Stibee List 등록 → Firestore 기록.
- 발송: 관리자 UI에서 템플릿 선택(내부 DB 저장) → Functions 통해 Stibee Campaign 생성.
- 템플릿 관리: Stibee 콘솔 ID 매핑 테이블 유지(TBD-003).

### 6.4 배포 운영

- 사전 체크리스트: lint/test → `build:*`.
- 릴리즈 노트: `docs/CHANGELOG.md` 갱신.
- 긴급 수정: 특정 앱만 `firebase deploy --only hosting:<target>` 실행.

---

## 7. 미정 항목 & 다음 단계

| ID      | 항목               | 설계 고려 사항                                             | 담당               | 상태 |
| ------- | ------------------ | ---------------------------------------------------------- | ------------------ | ---- |
| TBD-001 | 블록 스키마 상세   | 컴포넌트 props, 디자인 시스템 연계                         | Product/Design/Dev | 미정 |
| TBD-002 | Jira Webhook 보안  | HMAC vs Basic Auth, 네트워크 제한                          | Support/DevOps     | 미정 |
| TBD-003 | Stibee UI/예약     | 관리자 UI 범위, 예약 발송 처리                             | Marketing/Dev      | 미정 |
| TBD-004 | Pricing 계산       | 요금 계산 로직, 입력 파라미터                              | Biz/Dev            | 미정 |
| TBD-005 | 인증 전략          | Support 포털 로그인/세션 관리 방안                         | Dev                | 미정 |
| TBD-006 | 캐시 스토리지      | InBlog/Jira 응답 캐시 저장소 선택                          | DevOps             | 미정 |
| TBD-007 | App 앱 구조        | `apps/app` 디렉토리 구조, 기능 범위, 인증/데이터 연동 방식 | Product/Dev        | 미정 |
| TBD-008 | Admin 앱 최종 배포 | Firebase Hosting으로 전환 시점 및 마이그레이션 전략        | DevOps             | 미정 |

---

## 8. 첨부 및 참조

- `doc/atsignal-요구사항정의서-초안.md`
- `doc/atsignal-menu.txt`
- `doc/atsignal-동적페이지구성방식정리.md`
- `doc/atsignal-project-structure_v2.md` - 프로젝트 구조 및 배포 전략 상세
- `doc/Jira-API-연동.md`
- `doc/Stibee-API-연동설계서.md`
- `doc/InBlog-API-연동설계서.md`

> 본 문서는 설계 논의의 출발점으로, 추후 확정 시 버전 업데이트 및 상세 도면/시퀀스 다이어그램을 추가한다.
