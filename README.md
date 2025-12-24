# atsignal - 통합 행동데이터 플랫폼

Nethru가 보유한 데이터 분석 기술력과 경험을 집약한 통합 행동데이터 플랫폼

단일 Firebase 프로젝트에서 운영하는 멀티 도메인 웹사이트 모노레포입니다.

## 프로젝트 구조

Monorepo 구조로 다음 앱들을 포함합니다:

- **web**: 메인 웹사이트 (atsignal.io)
- **docs**: 문서 사이트 (docs.atsignal.io)
- **support**: 고객지원 사이트 (support.atsignal.io)
- **app**: 솔루션 체험 사이트 (app.atsignal.io)
- **functions**: Firebase Functions (백엔드 API)

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Hosting**: Firebase Hosting
- **Backend**: Firebase Functions
- **Database**: Firestore
- **Deployment**: Firebase Hosting (다중 Target)

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수 (Firebase Functions)

뉴스레터 구독 API(`subscribeNewsletter`)를 사용하려면 다음 환경 변수를 설정합니다.

| 변수명                            | 설명                                   |
| --------------------------------- | -------------------------------------- |
| `STIBEE_API_KEY`                  | Stibee에서 발급한 API 키               |
| `STIBEE_LIST_ID`                  | 기본 주소록(리스트) ID                 |
| `STIBEE_API_BASE_URL` _(선택)_    | 기본값 `https://api.stibee.com/v2`     |
| `SUBSCRIBERS_COLLECTION` _(선택)_ | Firestore 컬렉션명, 기본 `subscribers` |

Firebase CLI 사용 예시:

```bash
firebase functions:config:set stibee.api_key="..." stibee.list_id="..."
```

### 개발 서버 실행

각 앱별로 개발 서버를 실행할 수 있습니다:

```bash
# web 앱
cd apps/web && npm run dev

# docs 앱
cd apps/docs && npm run dev

# support 앱
cd apps/support && npm run dev

# app 앱
cd apps/app && npm run dev
```

### 빌드

```bash
# 개별 빌드
npm run build:web
npm run build:docs
npm run build:support
npm run build:app
npm run build:functions

# 전체 빌드
npm run build:all
```

### 배포

```bash
# 개별 배포
npm run deploy:web
npm run deploy:docs
npm run deploy:support
npm run deploy:app

# 전체 배포
npm run deploy:all
```

## 디렉토리 구조

자세한 디렉토리 구조는 `document/atsignal-project-structure_v2.md`를 참조하세요.

### Firebase Functions 구조

```
functions/src/
├── api/              # 통합 API 라우팅
├── stibee/          # Stibee API 연동 (뉴스레터 구독)
│   ├── index.ts     # 엔드포인트
│   ├── client.ts    # API 클라이언트
│   └── types.ts     # 타입 정의
├── inblog/          # InBlog API 연동 (블로그/뉴스)
├── cms/             # CMS 관련 함수
├── jira/            # Jira 연동 함수
├── config/          # 설정 파일
├── services/        # 공통 서비스
├── types/           # 공통 타입
└── utils/           # 유틸리티 함수
```

각 서비스(`stibee`, `inblog`, `cms`, `jira`)는 독립적인 폴더로 관리되며, `api/index.ts`에서 통합 라우팅을 담당합니다.

## 참고 문서

- [요구사항 정의서](./documentoc/atsignal-요구사항정의서-초안.md)
- [설계 문서](./document/atsignal-설계문서-초안.md)
- [프로젝트 구조 v2](./document/atsignal-project-structure_v2.md)
- [요구사항 정의서](./document/atsignal-요구사항정의서-초안.md)
- [설계 문서](./document/atsignal-설계문서-초안.md)
- [동적 페이지 구성 방식 정리](./document/AtSignal-동적페이지구성방식정리.md)
- [InBlog API 연동 설계서](./document/InBlog-API-연동설계서.md)
- [Jira API 연동](./document/Jira-API-연동.md)
- [Stibee API 연동 설계서](./document/Stibee-API-연동설계서_v1.md)

## Firebase Functions: Newsletter Subscription API

- **엔드포인트**: `https://<region>-<project>.cloudfunctions.net/subscribeNewsletterApi`
- **메서드**: `POST`
- **요청 본문**

```json
{
  "name": "홍길동",
  "company": "Nethru",
  "email": "user@example.com",
  "phone": "010-1234-5678",
  "privacyConsent": true
}
```

- **성공 응답**

```json
{
  "id": "firestore-doc-id",
  "status": "subscribed"
}
```

에러 시 `error`, `statusCode`, `detail` 필드를 포함한 JSON이 반환됩니다. 보다 상세한 동기화 흐름은 [Stibee API 연동 설계서](./document/Stibee-API-연동설계서_v1.md)를 참조하세요.
