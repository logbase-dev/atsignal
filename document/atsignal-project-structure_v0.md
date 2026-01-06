# 🧱 AtSignal 프로젝트 구조 & Firebase 배포 전략

> **목표**  
> 단일 Firebase 프로젝트(`atsignal`) 안에서  
> 메인(`atsignal.io`), 문서(`docs.atsignal.io`), 고객지원(`support.atsignal.io`), 솔루션 체험(`app.atsignal.io`)을  
> 효율적으로 운영하는 **혼합형 구조 설계**

---

## 📂 1️⃣ 디렉토리 구조

```
/atsignal
├── apps/
│   ├── web/                  # 메인 웹사이트 (atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx   # 글로벌 레이아웃
│   │   ├── components/
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── docs/                 # 문서 사이트 (docs.atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── support/              # 고객지원 사이트 (support.atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── components/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── app/   # 솔루션 데모 사이트는 미정이라 동일 패턴만 제안
│       ├── app/
│       │   ├── [locale]/
│       │   └── layout.tsx
│       ├── locales/
│       │   ├── ko.json
│       │   └── en.json
│       └── next.config.js
│
├── functions/                # Firebase Functions (백엔드 API)
│   ├── src/
│   │   ├── index.ts
│   │   ├── api/
│   │   ├── cms/
│   │   ├── jira/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                   # 프론트/백엔드 공통 모듈
│   ├── utils/
│   ├── types/
│   └── constants/
│
├── firebase.json
├── firestore.rules
├── storage.rules
├── package.json
└── README.md
```

---

## 🚀 2️⃣ 배포 전략

| 서비스             | 도메인                | 배포 대상             | 빌드 명령어               | Firebase Hosting Target |
| ------------------ | --------------------- | --------------------- | ------------------------- | ----------------------- |
| 메인 사이트        | `atsignal.io`         | `/apps/web/.next`     | `npm run build:web`       | `web`                   |
| 문서 사이트        | `docs.atsignal.io`    | `/apps/docs/.next`    | `npm run build:docs`      | `docs`                  |
| 고객지원 사이트    | `support.atsignal.io` | `/apps/support/.next` | `npm run build:support`   | `support`               |
| 솔루션 체험 사이트 | `app.atsignal.io`     | `/apps/app/.next`     | `npm run build:app`       | `app`                   |
| 백엔드 API         | Cloud Functions       | `/functions`          | `npm run build:functions` | `functions`             |

> 💡 **한 Firebase 프로젝트**에 여러 Hosting Target을 등록해서  
> 도메인별로 각각 배포 가능

---

## ⚙️ 3️⃣ Firebase 설정 예시 (firebase.json)

```json
{
  "functions": {
    "source": "functions"
  },
  "hosting": [
    {
      "target": "web",
      "site": "atsignal-main",
      "public": "apps/web/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "docs",
      "site": "atsignal-docs",
      "public": "apps/docs/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "target": "support",
      "site": "atsignal-support",
      "public": "apps/support/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        { "source": "/api/**", "function": "api" },
        { "source": "**", "destination": "/index.html" }
      ]
    },
    {
      "target": "app",
      "site": "atsignal-app",
      "public": "apps/app/out",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        { "source": "/api/**", "function": "api" },
        { "source": "**", "destination": "/index.html" }
      ]
    }
  ]
}
```

---

## 🪄 4️⃣ 빌드 & 배포 명령어 (package.json)

```json
{
  "scripts": {
    "build:web": "cd apps/web && npm run build",
    "build:docs": "cd apps/docs && npm run build",
    "build:support": "cd apps/support && npm run build",
    "build:app": "cd apps/app && npm run build",
    "build:functions": "cd functions && npm run build",
    "deploy:web": "firebase deploy --only hosting:web",
    "deploy:docs": "firebase deploy --only hosting:docs",
    "deploy:support": "firebase deploy --only hosting:support,functions",
    "deploy:app": "firebase deploy --only hosting:app",
    "deploy:all": "npm run build:web && npm run build:docs && npm run build:support && npm run build:app && firebase deploy"
  }
}
```

---

## 🔐 5️⃣ Firebase Hosting Target 등록 명령어

```bash
firebase target:apply hosting web atsignal-main
firebase target:apply hosting docs atsignal-docs
firebase target:apply hosting support atsignal-support
firebase target:apply hosting app atsignal-app
```

---

## 🔄 6️⃣ 배포 프로세스

### 1️⃣ 로컬 빌드

```bash
npm run build:web
npm run build:docs
npm run build:support
npm run build:app
```

### 2️⃣ Firebase Functions 배포

```bash
npm run build:functions
firebase deploy --only functions
```

### 3️⃣ Hosting 배포

```bash
firebase deploy --only hosting:web
firebase deploy --only hosting:docs
firebase deploy --only hosting:support
firebase deploy --only hosting:app
```

> 💡 GitHub Actions로 push 시 자동 배포 파이프라인 구성 가능

---

## 🧩 7️⃣ 확장 포인트

| 기능            | 기술                              | 설명                     |
| --------------- | --------------------------------- | ------------------------ |
| CMS 페이지 관리 | Firestore + Next.js Dynamic Route | `/pages/[slug]/page.tsx` |
| 블로그/뉴스     | 인블로그 API 연동                 | Firestore 캐싱 가능      |
| 고객지원        | Jira API + Functions Proxy        | REST API 호출 방식       |
| 이메일/알림     | Firebase Functions + SendGrid     | 고객 메일 알림 처리      |

---

## ✅ 정리

- 🔹 **Firebase Hosting 중심 혼합형 구조**
- 🔹 **하나의 Firebase 프로젝트**에서 **다중 도메인 운영**
- 🔹 배포/유지보수가 간단하고, Monorepo 확장도 용이
- 🔹 CMS, 블로그, 고객지원 등 확장 기능도 유연하게 통합 가능

---
