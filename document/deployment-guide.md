# 🚀 AtSignal Firebase App Hosting 배포 가이드

> **목적**  
> Firebase App Hosting을 사용한 `web` 앱과 `docs` 앱 배포 방법 및 문제 해결 가이드
>
> **작성일**: 2025-12-28  
> **작성자**: 이민규

---

## 📋 목차

1. [배포 개요](#1-배포-개요)
2. [독립 앱 구조의 필요성](#2-독립-앱-구조의-필요성)
3. [배포 실패 원인 및 해결 방법](#3-배포-실패-원인-및-해결-방법)
4. [환경 변수 설정](#4-환경-변수-설정)
5. [배포 스크립트 사용법](#5-배포-스크립트-사용법)
6. [수동 배포 방법](#6-수동-배포-방법)
7. [주의사항](#7-주의사항)

---

## 1️⃣ 배포 개요

### 배포 대상

- **web 앱** (`apps/web`): 메인 웹사이트 → `web-ssr` 백엔드
- **docs 앱** (`apps/docs`): 문서 사이트 → `docs-ssr` 백엔드
- **functions** (`functions`): Firebase Cloud Functions

### 배포 방식

- **App Hosting 앱** (web, docs): GitHub 푸시 후 수동 배포(Firebase Console에서 자동 배포 설정 가능)
  - App Hosting 메뉴에서 보기 > 설정 > 배포 > 상단에 자동배포 토글로 설정 가능
- **Functions**: Firebase CLI로 수동 배포

### 배포 URL

- web 앱: `https://web-ssr--atsignal.asia-east1.hosted.app`
- docs 앱: `https://docs-ssr--atsignal.asia-east1.hosted.app`

---

## 2️⃣ 독립 앱 구조의 필요성

### 문제 상황

Firebase App Hosting은 **각 앱을 독립적인 프로젝트로 인식**합니다.  
모노레포 구조에서 공유 `node_modules`와 루트 `pnpm-lock.yaml`을 사용하면 배포가 실패합니다.

### 해결 방법: 독립 앱 구조

각 앱(`apps/web`, `apps/docs`)을 완전히 독립적인 프로젝트로 구성해야 합니다.

#### web 앱 독립화 설정

1. **`apps/web/.npmrc` 생성**

```npmrc
# Firebase App Hosting을 위해 독립 프로젝트로 설정
link-workspace-packages=false
shared-workspace-lockfile=false
```

2. **독립적인 의존성 설치**

```bash
cd apps/web
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

3. **`apphosting.yaml` 설정**

```yaml
# pnpm을 사용하여 빌드
buildCommand: pnpm install && pnpm run build
runCommand: pnpm start
```

#### docs 앱 독립화 설정

1. **`package-lock.json` 생성** (npm 사용)

```bash
cd apps/docs
npm install --no-workspaces
```

2. **`apphosting.yaml` 설정**

```yaml
buildCommand: npm install && npm run build
runCommand: npm start
```

---

## 3️⃣ 배포 실패 원인 및 해결 방법

### ❌ 문제 1: `package.json not found`

**에러 메시지:**

```
ERROR: No buildpack groups passed detection.
package.json not found
```

**원인:**

- Firebase App Hosting이 "App root directory"를 올바르게 인식하지 못함
- 모노레포 루트에서 `package.json`을 찾으려고 시도

**해결:**

1. Firebase Console에서 "App root directory"를 `/apps/web` 또는 `/apps/docs`로 설정
2. 각 앱 디렉토리에 독립적인 `package.json`과 `pnpm-lock.yaml` (또는 `package-lock.json`) 존재 확인

---

### ❌ 문제 2: `Module not found` 에러

**에러 메시지:**

```
Module not found: Can't resolve 'remark-gfm'
Module not found: Can't resolve '@toast-ui/react-editor'
Module not found: Can't resolve 'bcryptjs'
...
```

**원인:**

- 모노레포의 공유 `node_modules`에 의존
- 독립 앱 구조로 전환 후 필요한 패키지가 `apps/web/package.json`에 없음

**해결:**

1. `apps/web/package.json`에 누락된 의존성 추가:

```json
{
  "dependencies": {
    "remark-gfm": "^4.0.0",
    "@toast-ui/react-editor": "^3.2.3",
    "bcryptjs": "^2.4.3",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "browser-image-compression": "^2.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

2. `apps/web`에서 재설치:

```bash
cd apps/web
pnpm install
```

---

### ❌ 문제 3: TypeScript 타입 에러

**에러 메시지:**

```
Type error: Module '"@/lib/admin/types"' has no exported member 'EventParticipant'.
Type error: Module '"@/lib/admin/types"' has no exported member 'Glossary'.
Property 'views' does not exist on type 'Glossary'.
```

**원인:**

- `apps/web/lib/admin/types.ts`에 타입 정의 누락

**해결:**

- 필요한 인터페이스와 속성을 `types.ts`에 추가:

```typescript
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

export interface Glossary {
  id?: string;
  term: LocalizedField;
  description: LocalizedField;
  // ... 기타 필드
  views?: number; // 추가
  // ...
}
```

---

### ❌ 문제 4: Firebase 인증 에러 (빌드 시점)

**에러 메시지:**

```
[FirebaseError]: Firebase: Error (auth/invalid-api-key).
Error: Failed to collect page data for /admin-api/admin/auth/me
```

**원인:**

- `apphosting.yaml`에 `NEXT_PUBLIC_FIREBASE_*` 환경 변수 누락
- 빌드 시점에 Firebase 초기화 실패

**해결:**

- `apphosting.yaml`에 Firebase 환경 변수 추가:

```yaml
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSyB_y1IIZ9-vjqkmhnb3Y4wnXB6ycaKJ93A
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: atsignal.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: atsignal
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: atsignal.firebasestorage.app
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "188493461836"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: 1:188493461836:web:8c80b5912194bdf9e537e9 # web 앱
    # 또는
    # value: 1:188493461836:web:16a173bb9512aad4e537e9  # docs 앱
```

**Firebase App ID 확인 방법:**

1. Firebase Console → 프로젝트 설정 → 일반 탭
2. "내 앱" 섹션에서 웹 앱 선택
3. "앱 ID" 또는 "App ID 확인

---

### ❌ 문제 5: Path Alias 해결 실패

**에러 메시지:**

```
Module not found: Can't resolve '@/components/cms/PageRenderer'
```

**원인:**

- Next.js 빌드 시 `@` 경로 별칭 해결 실패

**해결:**

1. **`tsconfig.json`에 `baseUrl` 추가:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. **`next.config.js`에 webpack alias 추가:**

```javascript
const path = require("path");

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "."),
    };
    return config;
  },
};

module.exports = nextConfig;
```

---

## 4️⃣ 환경 변수 설정

### Firebase App Hosting 환경 변수

각 앱의 `apphosting.yaml` 파일에 환경 변수를 정의합니다.

#### web 앱 (`apps/web/apphosting.yaml`)

```yaml
runtime: nodejs20
buildCommand: pnpm install && pnpm run build
runCommand: pnpm start

env:
  - variable: NODE_ENV
    value: production
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSyB_y1IIZ9-vjqkmhnb3Y4wnXB6ycaKJ93A
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: atsignal.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: atsignal
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: atsignal.firebasestorage.app
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "188493461836"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: 1:188493461836:web:8c80b5912194bdf9e537e9
  - variable: NEXT_PUBLIC_ADMIN_USE_FUNCTIONS
    value: "true"
  - variable: NEXT_PUBLIC_PREVIEW_SECRET
    value: "atsignal-preview"
  - variable: NEXT_PUBLIC_WEB_PREVIEW_ORIGIN
    value: "https://web-ssr--atsignal.asia-east1.hosted.app"
  - variable: NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN
    value: "https://docs-ssr--atsignal.asia-east1.hosted.app"
```

#### docs 앱 (`apps/docs/apphosting.yaml`)

```yaml
runtime: nodejs20
buildCommand: npm install && npm run build
runCommand: npm start

env:
  - variable: NODE_ENV
    value: production
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSyB_y1IIZ9-vjqkmhnb3Y4wnXB6ycaKJ93A
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: atsignal.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: atsignal
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: atsignal.firebasestorage.app
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "188493461836"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: 1:188493461836:web:16a173bb9512aad4e537e9
```

---

## 5️⃣ 배포 스크립트 사용법

### 스크립트 위치

```
atsignal/
└── scripts/
    ├── deploy-web.sh      # web 앱 배포
    ├── deploy-docs.sh      # docs 앱 배포
    └── deploy-functions.sh # functions 배포
```

### 실행 권한 부여 (최초 1회)

```bash
chmod +x scripts/deploy-web.sh
chmod +x scripts/deploy-docs.sh
chmod +x scripts/deploy-functions.sh
```

### (선택사항) package.json 에 스크립트 추가

루트 package.json에 편의 스크립트를 추가할 수 있습니다

```bash
{
  "scripts": {
    "deploy:web": "./scripts/deploy-web.sh",
    "deploy:docs": "./scripts/deploy-docs.sh",
    "deploy:functions": "./scripts/deploy-functions.sh"
  }
}
```

이렇게 하면 npm run deploy:web으로 실행할 수 있습니다.

### 사용 방법

#### 1. web 앱 배포

```bash
./scripts/deploy-web.sh
```

**동작 과정:**

1. 현재 브랜치 확인
2. 변경사항 확인 및 표시
3. 커밋 메시지 입력 요청
4. `git add .` → `git commit` → `git push`
5. GitHub 푸시 후 Firebase App Hosting 자동 배포 시작

**주의:**

- 변경사항이 없으면 스크립트가 종료됩니다
- 커밋 메시지는 필수입니다

#### 2. docs 앱 배포

```bash
./scripts/deploy-docs.sh
```

**동작 과정:** web 앱과 동일

#### 3. functions 배포

```bash
./scripts/deploy-functions.sh
```

**동작 과정:**

1. `functions` 디렉토리로 이동
2. `npm run build` 실행
3. Firebase 로그인 확인 (필요 시)
4. `firebase deploy --only functions` 실행

---

## 6️⃣ 수동 배포 방법

### App Hosting 앱 (web, docs)

Firebase App Hosting은 **GitHub 연동 자동 배포**만 지원합니다.  
CLI로 직접 배포할 수 없습니다.

**수동 배포 절차:**

1. 변경사항 커밋 및 푸시:

```bash
git add .
git commit -m "feat: 배포 내용 설명"
git push origin main
```

2. Firebase Console에서 배포 상태 확인:
   - https://console.firebase.google.com/project/atsignal/apphosting
   - 배포가 자동으로 시작됩니다

### Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 7️⃣ 주의사항

### ⚠️ 모노레포 구조 주의사항

1. **각 앱은 독립적인 프로젝트로 관리**

   - `apps/web`과 `apps/docs`는 서로 다른 `node_modules`와 lockfile을 가져야 함
   - `.npmrc`에서 workspace linking 비활성화 필수

2. **의존성 관리**

   - 새 패키지 추가 시 해당 앱의 `package.json`에 직접 추가
   - 루트 `package.json`에 추가하지 않음

3. **환경 변수**
   - `.env.local`은 Git 추적에서 제외 (`.gitignore`에 추가)
   - `apphosting.yaml`에 필요한 환경 변수 모두 정의

### ⚠️ 배포 전 확인사항

1. **로컬 빌드 테스트**

```bash
# web 앱
cd apps/web
pnpm build

# docs 앱
cd apps/docs
npm run build
```

2. **타입 체크**

```bash
cd apps/web
pnpm build  # TypeScript 타입 체크 포함
```

3. **환경 변수 확인**
   - `apphosting.yaml`에 모든 `NEXT_PUBLIC_*` 변수 정의 확인
   - Firebase App ID가 올바른지 확인

### ⚠️ 배포 실패 시 확인사항

1. **Firebase Console 로그 확인**

   - Firebase Console → App Hosting → 배포 로그 확인
   - 에러 메시지 확인

2. **로컬 빌드 재확인**

   - 로컬에서 빌드가 성공하는지 확인
   - 로컬 빌드 실패 시 서버 배포도 실패

3. **GitHub 연동 확인**
   - Firebase Console → App Hosting → 설정 → GitHub 연결 확인
   - 올바른 레포지토리와 브랜치 연결 확인

---

## 📚 참고 자료

- [Firebase App Hosting 문서](https://firebase.google.com/docs/app-hosting)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [pnpm Workspace 문서](https://pnpm.io/workspaces)

---

---

## 8️⃣ 성공한 배포 구성 (2025-12-31)

### 🎉 최종 성공 구성

2025년 12월 31일, Firebase App Hosting에서 pnpm 모노레포 배포에 **완전히 성공**했습니다!

#### 핵심 성공 요소

1. **완전 독립 프로젝트 구조**
2. **pnpm 빌드팩 사용**
3. **모든 필수 의존성 포함**
4. **올바른 .npmrc 설정**

### 📁 필수 파일 구조

```
atsignal/
├── apps/web/
│   ├── package.json          # 모든 의존성 포함
│   ├── pnpm-lock.yaml        # 독립적인 lockfile
│   ├── .npmrc                # workspace 비활성화
│   ├── apphosting.yaml       # pnpm 빌드 설정
│   ├── next.config.js
│   ├── tsconfig.json
│   └── node_modules/         # 독립적인 node_modules
└── apps/docs/
    ├── package.json
    ├── package-lock.json     # npm 사용
    ├── apphosting.yaml       # npm 빌드 설정
    └── node_modules/
```

### 🔧 핵심 설정 파일들

#### 1. `apps/web/.npmrc` (필수!)

```npmrc
# Firebase App Hosting을 위한 완전 독립 프로젝트
# workspace 완전 비활성화
link-workspace-packages=false
shared-workspace-lockfile=false
save-workspace-protocol=false
enable-pre-post-scripts=true
```

**중요 포인트:**

- `link-workspace-packages=false`: workspace 패키지 링크 비활성화
- `shared-workspace-lockfile=false`: 공유 lockfile 사용 안함
- `save-workspace-protocol=false`: workspace 프로토콜 저장 안함
- `enable-pre-post-scripts=true`: pre/post 스크립트 활성화

#### 2. `apps/web/apphosting.yaml` (pnpm 사용)

```yaml
# Firebase App Hosting configuration for web app
runtime: nodejs20

# pnpm을 사용하여 빌드 (Firebase App Hosting)
buildCommand: pnpm install && pnpm run build
runCommand: pnpm start

# Firebase 환경 변수
env:
  - variable: NODE_ENV
    value: production
  # Firebase 설정 (빌드 시점에 필요)
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSyB_y1IIZ9-vjqkmhnb3Y4wnXB6ycaKJ93A
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: atsignal.firebaseapp.com
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: atsignal
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: atsignal.firebasestorage.app
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: "188493461836"
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: 1:188493461836:web:8c80b5912194bdf9e537e9
  # App Hosting에서는 `/api/*` 경로가 403으로 막힐 수 있으므로
  # 관리자 API는 `/admin-api/*` 프록시 경로를 사용한다.
  - variable: NEXT_PUBLIC_ADMIN_USE_FUNCTIONS
    value: "true"
  # 미리보기 관련 환경 변수
  - variable: NEXT_PUBLIC_PREVIEW_SECRET
    value: "atsignal-preview"
  - variable: NEXT_PUBLIC_WEB_PREVIEW_ORIGIN
    value: "https://web-ssr--atsignal.asia-east1.hosted.app"
  - variable: NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN
    value: "https://docs-ssr--atsignal.asia-east1.hosted.app"
```

#### 3. `apps/web/package.json` (모든 의존성 포함)

```json
{
  "name": "@atsignal/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@toast-ui/react-editor": "^3.2.3",
    "bcryptjs": "^2.4.3",
    "browser-image-compression": "^2.0.2",
    "firebase": "^10.7.0",
    "firebase-admin": "^12.0.0",
    "geist": "^1.3.0",
    "next": "14.2.32",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-mark": "^0.0.4",
    "react-markdown": "^9.0.1",
    "rehype-slug": "^6.0.0",
    "remark-gfm": "^4.0.0",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

**중요 의존성:**

- `firebase-admin`: 서버사이드 Firebase 기능 (필수!)
- `@toast-ui/react-editor`: 에디터 컴포넌트
- `@dnd-kit/*`: 드래그 앤 드롭 기능
- `bcryptjs`: 비밀번호 해싱
- `browser-image-compression`: 이미지 압축
- `react-markdown`, `remark-gfm`: 마크다운 렌더링

### 🚀 성공적인 배포 과정

#### 1단계: 독립 프로젝트 변환

```bash
# apps/web을 완전 독립 프로젝트로 변환
cd apps/web

# 기존 workspace 연결 제거
rm -rf node_modules pnpm-lock.yaml

# .npmrc 생성 (workspace 비활성화)
cat > .npmrc << 'EOF'
link-workspace-packages=false
shared-workspace-lockfile=false
save-workspace-protocol=false
enable-pre-post-scripts=true
EOF

# 독립적인 의존성 설치
pnpm install --ignore-workspace
```

#### 2단계: 빌드팩 선택 확인

Firebase App Hosting 빌드 로그에서 확인:

```
4 of 6 buildpacks participating
google.nodejs.runtime        1.0.0
google.nodejs.firebasenextjs 0.0.1
google.nodejs.pnpm           0.1.1  ← pnpm 빌드팩 선택됨!
google.nodejs.firebasebundle 0.0.1
```

#### 3단계: 의존성 설치 성공

```
Installing application dependencies.
Running "pnpm install (NODE_ENV=production)"
Packages: +373
Progress: resolved 399, reused 373, downloaded 0, added 373, done
```

#### 4단계: 빌드 성공

```
=== Node.js - Firebasenextjs (google.nodejs.firebasenextjs@0.0.1) ===
Installing nextjs adaptor 14.0.21
=== Node.js - Pnpm (google.nodejs.pnpm@0.1.1) ===
Installing application dependencies.
```

### ⚠️ 해결된 주요 문제들

#### 문제 1: Missing Lock File

**이전 에러:**

```
{"reason":"Missing Lock File","code":"fah/missing-lock-file"}
```

**해결:**

- `apps/web/pnpm-lock.yaml` 생성
- `.npmrc`에서 `shared-workspace-lockfile=false` 설정

#### 문제 2: npm/pnpm 빌드팩 혼동

**이전 에러:**

```
google.nodejs.npm            1.1.1  ← 잘못된 빌드팩 선택
```

**해결:**

- `apps/web/pnpm-lock.yaml` 존재 확인
- `apphosting.yaml`에서 `pnpm` 명령어 사용

#### 문제 3: React 버전 충돌

**이전 에러:**

```
npm error ERESOLVE unable to resolve dependency tree
peer react@"^17.0.1" from @toast-ui/react-editor@3.2.3
```

**해결:**

- pnpm 사용으로 peer dependency 경고만 표시 (빌드 성공)
- npm과 달리 pnpm은 peer dependency 충돌을 경고로만 처리

#### 문제 4: firebase-admin 모듈 누락

**이전 에러:**

```
Module not found: Can't resolve 'firebase-admin'
```

**해결:**

- `apps/web/package.json`에 `firebase-admin@^12.0.0` 추가
- `pnpm install` 실행하여 의존성 설치

### 📊 성공 지표

#### 빌드 성공 로그

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (52/52)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ƒ /                                    164 B          87.9 kB
├ ƒ /_not-found                          164 B          87.9 kB
├ ● /[locale]                            6.1 kB          116 kB
...
ƒ  (Dynamic)  server-rendered on demand
●  (SSG)      prerendered as static HTML
```

#### 배포 성공 확인

- **URL**: https://web-ssr--atsignal.asia-east1.hosted.app
- **상태**: 정상 동작
- **빌드 시간**: 약 3-5분
- **메모리 사용량**: 512MB
- **타임아웃**: 300초

### 🎯 핵심 성공 요소 요약

1. **완전 독립 프로젝트**: workspace 연결 완전 차단
2. **올바른 .npmrc**: workspace 기능 모두 비활성화
3. **독립적인 lockfile**: `apps/web/pnpm-lock.yaml` 존재
4. **모든 의존성 포함**: `firebase-admin` 등 누락 없음
5. **pnpm 빌드팩**: Firebase가 올바른 빌드팩 선택

### 🔄 향후 배포 시 주의사항

1. **새 의존성 추가 시**:

   ```bash
   cd apps/web
   pnpm add [package-name]
   # 절대 루트에서 추가하지 말 것!
   ```

2. **lockfile 동기화**:

   - `apps/web/pnpm-lock.yaml`만 관리
   - 루트 `pnpm-lock.yaml`과 독립적

3. **빌드 테스트**:
   ```bash
   cd apps/web
   pnpm build  # 로컬에서 먼저 테스트
   ```

---

---

## 9️⃣ Firebase Functions 배포 성공 (2025-01-01)

### 🎉 Functions 배포 완전 성공!

2025년 1월 1일, Firebase Functions 배포에서 발생했던 `@google-cloud/functions-framework` 의존성 문제를 **완전히 해결**하고 성공적으로 배포했습니다!

### 🚨 발생했던 문제

#### 문제 1: `@google-cloud/functions-framework` 의존성 누락

**에러 메시지:**

```
Build failed: This project is using pnpm but you have not included the Functions Framework in your dependencies. Please add it by running: 'pnpm add @google-cloud/functions-framework'
```

**원인:**

- Firebase Functions가 pnpm 사용 시 `@google-cloud/functions-framework`를 명시적으로 요구하도록 변경됨
- 이전에는 Firebase가 자동으로 처리했지만, 현재는 명시적 의존성 필요

#### 문제 2: 잘못된 위치에 package-lock.json 생성

**문제 상황:**

```bash
# functions 디렉토리에서 npm install 실행했는데
cd atsignal/functions
npm install @google-cloud/functions-framework

# 루트에 package-lock.json이 생성됨 (잘못됨)
atsignal/package-lock.json  ← 잘못된 위치
```

**원인:**

- npm이 workspace 설정을 따라서 루트에서 설치
- functions는 독립적인 프로젝트로 관리되어야 함

#### 문제 3: pnpm-lock.yaml과 package.json 불일치

**에러 메시지:**

```
ERR_PNPM_OUTDATED_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with package.json
Failure reason:
specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were added: @google-cloud/functions-framework@^5.0.0
```

**원인:**

- functions 디렉토리에 `pnpm-lock.yaml`과 `package-lock.json`이 동시 존재
- Firebase가 pnpm을 우선 선택했지만 lockfile이 동기화되지 않음

### ✅ 해결 과정

#### 1단계: 잘못 생성된 파일 정리

```bash
# 루트의 잘못된 package-lock.json 삭제
rm atsignal/package-lock.json

# functions의 pnpm-lock.yaml 삭제 (npm 사용으로 통일)
rm atsignal/functions/pnpm-lock.yaml
```

#### 2단계: 올바른 의존성 설치

```bash
# functions 디렉토리에서 올바르게 설치
cd atsignal/functions
npm install --no-workspaces @google-cloud/functions-framework
```

**결과:**

- `functions/package-lock.json` 올바르게 생성 ✅
- `functions/package.json`에 의존성 추가 ✅

#### 3단계: 배포 실행

```bash
# 배포 스크립트 실행
./scripts/deploy-functions.sh
```

### 🎯 성공한 최종 구성

#### Functions 디렉토리 구조

```
atsignal/functions/
├── package.json              # @google-cloud/functions-framework 포함
├── package-lock.json         # npm lockfile (pnpm-lock.yaml 제거됨)
├── node_modules/             # 독립적인 node_modules
├── src/                      # 소스 코드
├── lib/                      # 빌드된 JavaScript
└── tsconfig.json
```

#### 업데이트된 package.json

```json
{
  "name": "functions",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "dependencies": {
    "@google-cloud/functions-framework": "^5.0.0", // ← 새로 추가됨
    "@google-cloud/storage": "^7.0.0",
    "@opentelemetry/api": "^1.9.0",
    "bcryptjs": "^2.4.3",
    "busboy": "^1.6.0",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.1.1",
    "sharp": "^0.33.5"
  }
}
```

### 🚀 배포 성공 로그

```bash
🚀 Firebase Functions 배포 시작...
🔨 Functions 빌드 중...
> functions@0.1.0 build
> tsc

📤 Firebase Functions 배포 중...
=== Deploying to 'atsignal'...

i  deploying functions
i  functions: preparing codebase default for deployment
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
i  artifactregistry: ensuring required API artifactregistry.googleapis.com is enabled...

i  functions: preparing functions directory for uploading...
i  functions: packaged /Users/leemingyu/Project/NEXTJS/atsignal/functions (439.55 KB) for uploading
✔  functions: functions source uploaded successfully

i  functions: updating Node.js 20 (1st Gen) function api(asia-northeast3)...
i  functions: updating Node.js 20 (1st Gen) function subscribeNewsletterApi(asia-northeast3)...
i  functions: updating Node.js 20 (1st Gen) function processImage(us-central1)...

✔  functions[api(asia-northeast3)] Successful update operation.
✔  functions[subscribeNewsletterApi(asia-northeast3)] Successful update operation.
✔  functions[processImage(us-central1)] Successful update operation.

Function URL (api(asia-northeast3)): https://asia-northeast3-atsignal.cloudfunctions.net/api
Function URL (subscribeNewsletterApi(asia-northeast3)): https://asia-northeast3-atsignal.cloudfunctions.net/subscribeNewsletterApi

✔  Deploy complete!
✅ Functions 배포 완료!
```

### 📊 배포된 Functions

| Function Name            | Region          | URL                                                                          | 용도                                                 |
| ------------------------ | --------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `api`                    | asia-northeast3 | `https://asia-northeast3-atsignal.cloudfunctions.net/api`                    | 메인 API 엔드포인트 (블로그, FAQ, 용어집, 이벤트 등) |
| `subscribeNewsletterApi` | asia-northeast3 | `https://asia-northeast3-atsignal.cloudfunctions.net/subscribeNewsletterApi` | 뉴스레터 구독 API                                    |
| `processImage`           | us-central1     | N/A                                                                          | 이미지 처리 Function                                 |

### 🔧 Functions API 엔드포인트

배포된 `api` Function은 다음 엔드포인트들을 제공합니다:

#### 블로그 API

- `GET /api/resources/blogs` - 블로그 목록 조회
- `GET /api/resources/blogs/:id` - 블로그 상세 조회
- `GET /api/resources/blog-categories` - 블로그 카테고리 목록

#### 기존 API들

- `GET /api/resources/faq-categories` - FAQ 카테고리
- `GET /api/resources/faqs` - FAQ 목록
- `GET /api/resources/glossaries` - 용어집 목록
- `GET /api/resources/glossary-categories` - 용어집 카테고리
- `GET /api/resources/events` - 이벤트 목록
- `GET /api/product/whatsnews` - 새소식 목록
- `POST /api/events/participate` - 이벤트 참가 신청

### 🎯 핵심 해결 포인트

1. **의존성 명시적 추가**: `@google-cloud/functions-framework@^5.0.0`
2. **올바른 설치 위치**: `functions` 디렉토리에서 `--no-workspaces` 옵션 사용
3. **lockfile 통일**: `pnpm-lock.yaml` 제거하고 `package-lock.json`만 사용
4. **독립 프로젝트 관리**: functions를 완전히 독립적인 npm 프로젝트로 관리

### ⚠️ Functions 배포 시 주의사항

#### 1. 의존성 추가 방법

```bash
# ✅ 올바른 방법
cd atsignal/functions
npm install --no-workspaces [package-name]

# ❌ 잘못된 방법
cd atsignal
npm install [package-name]  # 루트에 설치됨
```

#### 2. lockfile 관리

- `functions/package-lock.json`만 사용
- `functions/pnpm-lock.yaml`은 삭제
- 루트의 `pnpm-lock.yaml`과 독립적으로 관리

#### 3. 빌드 확인

```bash
cd atsignal/functions
npm run build  # TypeScript 컴파일 확인
```

#### 4. 배포 스크립트 사용

```bash
# 루트에서 실행
./scripts/deploy-functions.sh
```

### 🔮 향후 Functions 개발 시 가이드라인

1. **새 API 엔드포인트 추가**:

   - `functions/src/api/index.ts`에 라우트 추가
   - 로컬 테스트: `npm run serve`
   - 배포: `./scripts/deploy-functions.sh`

2. **새 의존성 추가**:

   ```bash
   cd functions
   npm install --no-workspaces [package-name]
   ```

3. **환경 변수 관리**:

   - `functions/.env.local` (로컬 개발용)
   - Firebase Console에서 프로덕션 환경 변수 설정

4. **로그 확인**:
   ```bash
   firebase functions:log
   ```

---

## 🔄 업데이트 이력

- **2025-01-01**: Firebase Functions 배포 성공 가이드 추가 ✅

  - `@google-cloud/functions-framework` 의존성 문제 해결
  - 올바른 package-lock.json 생성 방법
  - pnpm/npm lockfile 충돌 해결
  - 성공적인 Functions 배포 과정 상세 문서화
  - Functions API 엔드포인트 목록 정리
  - 향후 Functions 개발 가이드라인 추가

- **2025-12-31**: 성공한 배포 구성 추가 ✅

  - pnpm 모노레포 배포 완전 성공
  - 핵심 설정 파일들 상세 문서화
  - 해결된 주요 문제들 정리
  - 성공 지표 및 향후 주의사항 추가

- **2025-12-28**: 초기 문서 작성
  - 독립 앱 구조 설정 방법 추가
  - 배포 실패 원인 및 해결 방법 정리
  - 배포 스크립트 사용법 추가
