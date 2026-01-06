# AtSignal 요구사항정의서 (Draft)

| 문서 버전  | 작성일     | 작성자           |
| ---------- | ---------- | ---------------- |
| 0.1 (초안) | 2025-11-13 | Cursor Assistant |

## 1. 서론

### 1.1 프로젝트 개요

- AtSignal은 행동 데이터 수집·가공·분석을 통합 제공하는 SaaS 제품군.
- 메인 웹사이트, 기술 문서 사이트, 고객지원 포털을 단일 Firebase 프로젝트에서 운영.
- Firestore를 CMS로 활용하여 운영자가 페이지를 동적으로 관리.

### 1.2 문서 목적

- `doc/` 폴더의 설계 자료를 바탕으로 요구사항정의서 초안을 마련.
- 기능/비기능/운영 요구사항을 구조화하여 향후 상세 설계, 개발 계획 수립에 활용.

### 1.3 적용 범위

- 프런트엔드 3개 앱(`web`, `docs`, `support`)과 Firebase Functions를 포함.
- 인블로그, Stibee, Jira 연동과 Firestore 기반 CMS 운영을 포함.
- 외부 시스템 구축, 내부 운영 프로세스, 배포 전략을 요구사항 수준에서 정의.

## 2. 프로젝트 문서 요약

### `atsignal-project-structure.md`

- Firebase 단일 프로젝트 내에서 `web`, `docs`, `support` 앱과 `functions`를 운영하는 모노레포 구조.
- Hosting Target을 `web`, `docs`, `support`로 분리하여 도메인별 배포.
- 공통 모듈은 `shared` 디렉터리에서 재사용하고, 빌드/배포 스크립트가 `package.json`에 정의됨.
- 확장 포인트로 Firestore CMS, 인블로그, Jira, 이메일 연동 등이 제안됨.

### `atsignal-menu.txt`

- Depth 1~4까지 정보 건축을 정의하고 URL, 전체 경로, 페이지 설명, 제작 주체, Markdown 지원 여부를 정리.
- Product, Solutions, Resources, Pricing, Company 등 최상위 메뉴 구성.
- 각 페이지별 체크 포인트로 중복 메뉴 검토, 외부 레퍼런스, 기능 구분 명확화 요구 사항 포함.

### `atsignal-동적페이지구성방식정리.md`

- 운영자는 Firestore에 콘텐츠를 저장하고 Next.js 동적 라우팅으로 렌더링.
- 본문 구성 방식 3가지(HTML 저장형, 블록 형식, Markdown) 비교와 적용 권장 영역 제시.
- 블록 구성형은 Product/Solutions, Markdown형은 Docs/FAQ, HTML형은 Blog/Case에 추천.

### `InBlog-API-연동설계서.md`

- 인블로그 API를 통한 블로그 모듈 구현 목적과 주요 기능 정의.
- 게시글 목록/상세/검색/태그 API 엔드포인트와 인증(Bearer Token) 방식 명시.
- 캐싱 전략(5~10분)과 네이버 블로그 자동 발행 구조 설명.

### `Jira-API-연동.md`

- 고객 지원 이슈를 Jira와 연동하는 두 가지 방식(Webhook, Polling) 비교.
- Webhook 기반 실시간 연동을 추천하며 이벤트 종류, 페이로드 예시 포함.
- 웹사이트에서 가능한 기능(이슈 목록, 상태 표시, 댓글 반영 등) 명시.

### `JSM미시용시대응구조.md`

- JSM 미사용 시 기본 Jira 템플릿으로 문의 대응이 가능한지 검토.
- 문의 등록/상태 관리/알림 구현 가능하지만, 고객 포털, SLA 등은 자체 구현 필요.
- 권장 구성 플로우를 제시하며 장기적으로 JSM 도입 권장.

### `Stibee-API-연동설계서.md`

- Stibee API로 뉴스레터 발송 구조와 템플릿 관리 전략 정리.
- 캠페인 생성, 구독자 관리 엔드포인트와 보안 고려사항 제시.
- 템플릿을 내부 DB로 관리하거나 HTML 템플릿 엔진을 사용하는 옵션 비교.

## 3. 용어 정의

| 용어                    | 설명                                                                   | 출처                  |
| ----------------------- | ---------------------------------------------------------------------- | --------------------- |
| Firebase Hosting Target | 하나의 Firebase 프로젝트에서 도메인별 배포를 분리하는 호스팅 구성 요소 | 프로젝트 구조 문서    |
| Firestore CMS           | Firestore 컬렉션을 CMS처럼 활용해 동적 페이지를 생성하는 방식          | 동적 페이지 구성 문서 |
| Block Schema            | 블록 타입과 속성으로 구성된 JSON 기반 콘텐츠 정의 방식                 | 동적 페이지 구성 문서 |
| InBlog API              | 인블로그 콘텐츠를 제공하는 REST API, Bearer Token으로 인증             | InBlog 연동 설계      |
| Jira Webhook            | Jira 이슈 이벤트를 외부 서버로 전달하는 HTTP 콜백 메커니즘             | Jira 연동 문서        |
| Stibee Campaign         | Stibee에서 개별 이메일 발송 단위를 의미하는 엔터티                     | Stibee 연동 설계      |
| Support Portal          | AtSignal 고객이 이슈를 등록하고 상태를 확인하는 웹 인터페이스          | Jira 연동/메뉴 문서   |

## 4. 요구사항정의서 목차

1. 서론
   - 프로젝트 개요
   - 문서 목적 및 범위
   - 참조 문서
2. 시스템 구성 개요
   - 전체 아키텍처
   - 배포/운영 환경
3. 기능 요구사항
   - 메뉴/페이지 요구사항
   - 동적 콘텐츠 관리 요구사항
   - 외부 연동 기능 요구사항 (InBlog, Jira, Stibee 등)
4. 비기능 요구사항
   - 성능 및 가용성
   - 보안 및 인증
   - 확장성 및 유지보수성
5. 운영 및 관리 요구사항
   - CMS/콘텐츠 운영 정책
   - 고객지원 운영 프로세스
   - 배포 및 릴리즈 관리
6. 부록
   - 용어 사전
   - API 레퍼런스 링크
   - 변경 이력

## 5. 기능 요구사항

### 4.1 메뉴 및 페이지 구성

| ID     | 기능 구분                      | 요구사항 요약                                                            | 데이터/콘텐츠 출처    | 우선순위 | 책임              |
| ------ | ------------------------------ | ------------------------------------------------------------------------ | --------------------- | -------- | ----------------- |
| FR-001 | 메인 `Home`                    | 랜딩 페이지에서 가치 제안, CTA(Get Demo, Free trial, Newsletter) 노출    | 정적 + 운영 작성      | 높음     | Design/Dev        |
| FR-002 | `Product > NETHRU's solution`  | AtSignal 플랫폼 아키텍처 소개 페이지 제공, 메뉴명 재검토                 | 운영 작성             | 높음     | Product/Content   |
| FR-003 | `Product@signal` 세부 모듈     | Log Collecting/Ingestion/Analytics 등 모듈별 소개 페이지 제공            | 운영 작성, Block 구성 | 높음     | Product/Dev       |
| FR-004 | `Solutions` 카테고리           | 팀/산업/규모 별 솔루션 페이지 제공, 공통 템플릿 유지                     | 운영 작성, Block 구성 | 중간     | Product/Marketing |
| FR-005 | `Resources > Docs@signal`      | 관리자/온보딩/Integration/API/Benchmark 문서 제공, Markdown 지원         | Markdown (Firestore)  | 높음     | DevRel            |
| FR-006 | `Resources > Support@signal`   | My Page, Issues, FAQ, Shared Knowledge 등 고객지원 메뉴 제공             | Jira 연동 + Firestore | 높음     | Support/Dev       |
| FR-007 | `Resources > Customers@signal` | 고객 사례 페이지 제공, 운영자 입력                                       | 운영 작성             | 중간     | Marketing         |
| FR-008 | `Pricing`                      | 가격 개요/비교/시뮬레이터/Professional Service/Contact Sales 페이지 제공 | 운영 작성 + 계산 모듈 | 높음     | Biz/Dev           |
| FR-009 | `Company > About us`           | 회사 소개 페이지 제공                                                    | 운영 작성             | 중간     | Brand             |

### 4.2 동적 콘텐츠 관리

| ID     | 요구사항                   | 상세 설명                                                                   | 데이터 모델         | 우선순위 | 책임       |
| ------ | -------------------------- | --------------------------------------------------------------------------- | ------------------- | -------- | ---------- |
| FR-101 | Firestore 기반 동적 라우팅 | `/app/[slug]/page.tsx` 구조로 Firestore `pages` 컬렉션을 읽어 렌더링        | HTML/Block/Markdown | 높음     | Dev        |
| FR-102 | Block Schema CMS           | Product/Solutions 영역은 `blocks[].type` 기반 컴포넌트 매핑                 | JSON Schema         | 높음     | Dev/Design |
| FR-103 | Markdown Renderer          | Docs/FAQ/Tips 등은 Markdown 저장 및 `react-markdown` 렌더링                 | Markdown 텍스트     | 높음     | DevRel     |
| FR-104 | 콘텐츠 검증                | 운영자 입력 시 레이아웃 파괴 방지를 위한 Validation/프리뷰 기능             | Admin UI 필요       | 중간     | Dev        |
| FR-105 | 메뉴 메타데이터            | `atsignal-menu.txt` 항목을 Firestore/Config로 이관하여 네비게이션 자동 생성 | Firestore `menus`   | 중간     | Dev        |

### 4.3 외부 연동 기능

| ID     | 연동 대상         | 요구사항                              | 상세 설명                                             | 우선순위 | 책임          |
| ------ | ----------------- | ------------------------------------- | ----------------------------------------------------- | -------- | ------------- |
| FR-201 | InBlog API        | 블로그 목록/상세 페이지 제공          | `/api/posts`, `/api/posts/{id}` 호출, 5~10분 캐시     | 중간     | Dev           |
| FR-202 | InBlog 검색/필터  | 태그/카테고리 필터 UI 제공            | `/api/posts?tag=`, `/api/tags` 활용                   | 중간     | Dev           |
| FR-203 | Stibee 구독       | 뉴스레터 구독 폼 및 구독자 등록 API   | `POST /lists/{listId}/subscribers`, env 기반          | 높음     | Marketing/Dev |
| FR-204 | Stibee 발송       | 캠페인 생성 및 발송 요청 관리         | `POST /campaigns`, 템플릿 메타데이터 저장             | 중간     | Dev/Marketing |
| FR-205 | Jira Webhook      | 고객지원 이슈 실시간 동기화           | `issue_created/updated` Webhook 수신 → Firestore 반영 | 높음     | Support/Dev   |
| FR-206 | Jira Polling 백업 | Webhook 실패 대비 주기적 Polling 도입 | `GET /rest/api/3/search` 기반                         | 낮음     | DevOps        |
| FR-207 | 고객 포털 양방향  | 고객 문의 등록/조회/댓글 작성 UI      | Jira REST API로 이슈 생성/코멘트 작성                 | 높음     | Support/Dev   |

## 6. 비기능 요구사항

### 5.1 성능 및 가용성

| ID      | 항목           | 요구사항                                                                                 | 근거                 |
| ------- | -------------- | ---------------------------------------------------------------------------------------- | -------------------- |
| NFR-001 | 빌드/배포 시간 | `npm run build:*` 기준 각 앱 빌드 시간 10분 이내, `deploy:all` 파이프라인 30분 이내 완료 | Firebase 배포 전략   |
| NFR-002 | 가용성         | Hosting 대상(웹/문서/지원) 99.5% 이상 가용성 유지                                        | Firebase Hosting SLA |
| NFR-003 | 캐시 정책      | InBlog API 캐시 TTL 5~10분, 실패 시 이전 캐시 제공                                       | InBlog 설계서        |
| NFR-004 | Webhook 처리   | Jira/Stibee Webhook 수신 API 3초 이내 응답, 실패 시 재시도 로직                          | Jira/Stibee 문서     |

### 5.2 보안 및 인증

| ID      | 항목          | 요구사항                                                                               | 근거               |
| ------- | ------------- | -------------------------------------------------------------------------------------- | ------------------ |
| NFR-101 | 비밀 관리     | `STIBEE_API_KEY`, `INBLOG_TOKEN`, Jira credentials 등은 `.env`와 Secret Manager로 관리 | Stibee/InBlog 문서 |
| NFR-102 | 데이터 접근   | Firestore Rules로 CMS 컬렉션 읽기/쓰기를 권한 기반 제어                                | 동적 페이지 문서   |
| NFR-103 | Webhook 인증  | Jira Webhook 서명 검증 또는 Basic Auth 적용, IP 화이트리스트 구성                      | Jira 문서          |
| NFR-104 | 개인정보 보호 | 구독자 이메일 암호화 저장, 로그에 이메일 마스킹                                        | Stibee 문서        |

### 5.3 확장성 및 유지보수성

| ID      | 항목            | 요구사항                                                       | 근거             |
| ------- | --------------- | -------------------------------------------------------------- | ---------------- |
| NFR-201 | 코드 공유       | `shared/` 디렉터리로 공통 유틸/타입 관리, 모듈간 의존 최소화   | 프로젝트 구조    |
| NFR-202 | 컴포넌트 재사용 | 블록 컴포넌트는 UI 라이브러리화하여 신규 페이지 추가 시 재사용 | 동적 페이지 문서 |
| NFR-203 | 버전 관리       | Firebase Functions/앱 별로 CI 파이프라인에서 버전 태깅         | 배포 전략        |
| NFR-204 | 장애 대응       | Jira Polling 백업 및 상태 모니터링 대시보드 구성               | Jira 문서        |

## 7. 운영 및 관리 요구사항

### 6.1 CMS/콘텐츠 운영

| ID      | 항목            | 요구사항                                                                       | 근거             |
| ------- | --------------- | ------------------------------------------------------------------------------ | ---------------- |
| OPR-001 | 역할 분리       | 운영자/마케터/지원 담당자별 Firestore 권한 및 관리 UI 분리                     | 메뉴 문서        |
| OPR-002 | 콘텐츠 프로세스 | Product/Solutions 페이지는 기획 → 디자인 템플릿 확정 → 운영자 입력 순으로 진행 | 동적 페이지 문서 |
| OPR-003 | 메뉴 검증       | 메뉴 중복/명칭 검토 사항을 체크리스트로 관리하여 주기적 점검                   | 메뉴 문서        |
| OPR-004 | Markdown 가이드 | Docs@signal 문서는 Markdown 템플릿과 샘플 제공, 이미지 업로드 규칙 제정        | Docs 메뉴        |

### 6.2 고객지원 운영

| ID      | 항목        | 요구사항                                                                 | 근거          |
| ------- | ----------- | ------------------------------------------------------------------------ | ------------- |
| OPR-101 | 이슈 생성   | 고객 포털에서 Jira 이슈 생성 시 필수 필드(우선순위, 카테고리, 설명) 검증 | Jira 문서     |
| OPR-102 | 상태 동기화 | Jira 상태 → Support 포털 상태 매핑 표 정의(신규/검토중/답변완료 등)      | Jira 문서     |
| OPR-103 | 알림 채널   | 상태 변경 시 이메일/포털 알림 제공, 향후 Slack/웹훅 확장 고려            | Jira/JSM 문서 |
| OPR-104 | SLA 리포트  | 기본 Jira 사용 시 SLA 통계는 내부 스케줄러로 수집 및 대시보드 제공       | JSM 대응 문서 |

### 6.3 배포 및 릴리즈

| ID      | 항목           | 요구사항                                                              | 근거          |
| ------- | -------------- | --------------------------------------------------------------------- | ------------- |
| OPR-201 | Hosting Target | `firebase target:apply hosting` 명령으로 `web/docs/support` 타깃 유지 | 프로젝트 구조 |
| OPR-202 | Functions 배포 | `deploy:support` 실행 시 Functions 함께 배포, 사전 빌드 필수          | 프로젝트 구조 |
| OPR-203 | Git Workflow   | Conventional Commits 적용, 주요 변경 시 README/docs 업데이트          | 사용자 규칙   |
| OPR-204 | 모니터링       | Firebase Hosting/Functions 모니터링 대시보드 설정 및 알림 연결        | 프로젝트 구조 |

## 8. 부록

### 8.1 참조 문서

- `doc/atsignal-project-structure.md`
- `doc/atsignal-menu.txt`
- `doc/atsignal-동적페이지구성방식정리.md`
- `doc/InBlog-API-연동설계서.md`
- `doc/Jira-API-연동.md`
- `doc/JSM미시용시대응구조.md`
- `doc/Stibee-API-연동설계서.md`

### 8.2 향후 보완 메모

| 항목    | 내용                                                       | 상태 |
| ------- | ---------------------------------------------------------- | ---- |
| TBD-001 | 블록 스키마 상세 필드 정의 (컴포넌트별 prop 스펙)          | 미정 |
| TBD-002 | Jira Webhook 인증/보안 방식 (Basic Auth, Secret Header 등) | 미정 |
| TBD-003 | Stibee 템플릿 관리 UI 범위 및 예약 발송 요구               | 미정 |
| TBD-004 | Pricing 시뮬레이터 입력 파라미터 및 계산 로직              | 미정 |
