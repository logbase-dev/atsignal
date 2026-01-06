# 🧱 AtSignal 프로젝트 구조 & Firebase 배포 전략 (v1)

> **목표**  
> 단일 Firebase 프로젝트(`atsignal`) 안에서  
> 메인(`atsignal.io`), 문서(`docs.atsignal.io`), 고객지원(`support.atsignal.io`), 솔루션 체험(`app.atsignal.io`)을  
> 효율적으로 운영하는 **혼합형 구조 설계**
>
> **v1 변경사항:** 다국어 지원(`[locale]`) + 동적 메뉴 생성(`[...slug]`) 구조 적용

---

## 📂 1️⃣ 디렉토리 구조

```
/atsignal
├── apps/
│   ├── web/                  # 메인 웹사이트 (atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── [...slug]/
│   │   │   │   │   └── page.tsx          # 동적 페이지 (Product, Solutions 등)
│   │   │   │   ├── layout.tsx            # Locale별 레이아웃
│   │   │   │   └── page.tsx              # 홈페이지 (/ko, /en)
│   │   │   └── layout.tsx                # 글로벌 레이아웃
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   └── Menu.tsx              # 동적 메뉴 컴포넌트
│   │   │   └── cms/
│   │   │       └── PageRenderer.tsx     # CMS 페이지 렌더러
│   │   ├── lib/
│   │   │   ├── cms/
│   │   │   │   ├── getPage.ts            # Firestore 페이지 조회
│   │   │   │   └── getMenus.ts           # Firestore 메뉴 조회
│   │   │   └── i18n/
│   │   │       └── getLocale.ts          # Locale 유틸리티
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
│   │   │   │   ├── [...slug]/
│   │   │   │   │   └── page.tsx          # 동적 문서 페이지
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   │   └── cms/
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── support/              # 고객지원 사이트 (support.atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── [...slug]/
│   │   │   │   │   └── page.tsx          # 동적 지원 페이지
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── app/                  # 솔루션 체험 사이트 (app.atsignal.io)
│       ├── app/
│       │   ├── [locale]/
│       │   │   ├── [...slug]/
│       │   │   │   └── page.tsx
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   └── layout.tsx
│       ├── components/
│       ├── lib/
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

## 🌐 2️⃣ 다국어 + 동적 라우팅 구조

### URL 구조 예시

| URL                             | 설명               | 페이지 타입                              |
| ------------------------------- | ------------------ | ---------------------------------------- |
| `/ko`                           | 한국어 홈페이지    | 정적 (`app/[locale]/page.tsx`)           |
| `/en`                           | 영어 홈페이지      | 정적 (`app/[locale]/page.tsx`)           |
| `/ko/product/log-collecting`    | 한국어 동적 페이지 | 동적 (`app/[locale]/[...slug]/page.tsx`) |
| `/en/solutions/by-team/product` | 영어 동적 페이지   | 동적 (`app/[locale]/[...slug]/page.tsx`) |
| `/ko/resources/docs@signal/api` | 한국어 문서 페이지 | 동적 (`app/[locale]/[...slug]/page.tsx`) |

### 라우팅 우선순위

1. **정적 라우트** (예: `/ko/about`, `/en/pricing`) - 직접 `page.tsx` 파일 존재 시
2. **동적 라우트** (`[...slug]`) - Firestore에서 페이지 데이터 조회
3. **404 처리** - 페이지가 없을 경우

---

## 🔧 3️⃣ 구현 가이드

### 3.1 Locale 검증 및 처리

```tsx
// app/[locale]/layout.tsx
import { notFound } from "next/navigation";

const validLocales = ["ko", "en"] as const;
type Locale = (typeof validLocales)[number];

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!validLocales.includes(params.locale as Locale)) {
    notFound();
  }

  return (
    <html lang={params.locale}>
      <body>{children}</body>
    </html>
  );
}
```

### 3.2 동적 페이지 구현

```tsx
// app/[locale]/[...slug]/page.tsx
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/cms/getPage";
import { PageRenderer } from "@/components/cms/PageRenderer";

export default async function DynamicPage({
  params,
}: {
  params: { locale: string; slug: string[] };
}) {
  const slug = Array.isArray(params.slug)
    ? params.slug.join("/")
    : params.slug || "";

  // Firestore에서 페이지 데이터 조회
  const pageData = await getPageBySlug(slug, params.locale);

  if (!pageData) {
    notFound();
  }

  return <PageRenderer data={pageData} locale={params.locale} />;
}

// 정적 생성 가능한 경로 생성 (ISR)
export async function generateStaticParams() {
  // Firestore에서 모든 페이지 slug 조회
  const pages = await getAllPageSlugs();
  return pages.flatMap((page) =>
    ["ko", "en"].map((locale) => ({
      locale,
      slug: page.slug.split("/"),
    }))
  );
}
```

### 3.3 Firestore 데이터 조회

```tsx
// lib/cms/getPage.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getPageBySlug(slug: string, locale: string) {
  const pageRef = doc(db, "pages", `${locale}/${slug}`);
  const pageSnap = await getDoc(pageRef);

  if (!pageSnap.exists()) {
    return null;
  }

  return {
    id: pageSnap.id,
    ...pageSnap.data(),
  };
}
```

### 3.4 동적 메뉴 생성

```tsx
// lib/cms/getMenus.ts
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getMenusByLocale(locale: string) {
  const menusRef = collection(db, "menus");
  const q = query(
    menusRef,
    where("locale", "==", locale),
    orderBy("order", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}
```

```tsx
// components/navigation/Menu.tsx
import { getMenusByLocale } from "@/lib/cms/getMenus";
import Link from "next/link";

export async function Navigation({ locale }: { locale: string }) {
  const menus = await getMenusByLocale(locale);

  return (
    <nav>
      {menus.map((menu) => (
        <Link key={menu.id} href={`/${locale}/${menu.path}`}>
          {menu.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## 🚀 4️⃣ 배포 전략

| 서비스             | 도메인                | 배포 대상           | 빌드 명령어               | Firebase Hosting Target |
| ------------------ | --------------------- | ------------------- | ------------------------- | ----------------------- |
| 메인 사이트        | `atsignal.io`         | `/apps/web/out`     | `npm run build:web`       | `web`                   |
| 문서 사이트        | `docs.atsignal.io`    | `/apps/docs/out`    | `npm run build:docs`      | `docs`                  |
| 고객지원 사이트    | `support.atsignal.io` | `/apps/support/out` | `npm run build:support`   | `support`               |
| 솔루션 체험 사이트 | `app.atsignal.io`     | `/apps/app/out`     | `npm run build:app`       | `app`                   |
| 백엔드 API         | Cloud Functions       | `/functions`        | `npm run build:functions` | `functions`             |

> 💡 **한 Firebase 프로젝트**에 여러 Hosting Target을 등록해서  
> 도메인별로 각각 배포 가능

---

## ⚙️ 5️⃣ Firebase 설정 예시 (firebase.json)

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

## 🪄 6️⃣ 빌드 & 배포 명령어 (package.json)

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

## 🔐 7️⃣ Firebase Hosting Target 등록 명령어

```bash
firebase target:apply hosting web atsignal-main
firebase target:apply hosting docs atsignal-docs
firebase target:apply hosting support atsignal-support
firebase target:apply hosting app atsignal-app
```

---

## 🔄 8️⃣ 배포 프로세스

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

## 📊 9️⃣ Firestore 데이터 구조

### pages 컬렉션

```
pages/
  {locale}/{slug}/
    - title: string
    - type: 'html' | 'markdown' | 'block'
    - content?: string
    - blocks?: Block[]
    - meta?: {
        description?: string
        keywords?: string[]
      }
    - createdAt: Timestamp
    - updatedAt: Timestamp
```

**예시:**

```
pages/
  ko/
    product/
      log-collecting/
        title: "로그 수집"
        type: "block"
        blocks: [...]
  en/
    product/
      log-collecting/
        title: "Log Collecting"
        type: "block"
        blocks: [...]
```

### menus 컬렉션

```
menus/
  {id}/
    - label: string
    - path: string
    - locale: 'ko' | 'en'
    - depth: number
    - parentId?: string
    - order: number
    - category?: string
```

---

## 🧩 🔟 확장 포인트

| 기능            | 기술                              | 설명                              |
| --------------- | --------------------------------- | --------------------------------- |
| CMS 페이지 관리 | Firestore + Next.js Dynamic Route | `app/[locale]/[...slug]/page.tsx` |
| 블로그/뉴스     | 인블로그 API 연동                 | Firestore 캐싱 가능               |
| 고객지원        | Jira API + Functions Proxy        | REST API 호출 방식                |
| 이메일/알림     | Firebase Functions + SendGrid     | 고객 메일 알림 처리               |
| 다국어 지원     | `[locale]` 라우팅                 | URL 기반 언어 전환                |
| 동적 메뉴       | Firestore `menus` 컬렉션          | 운영자 관리 가능                  |

---

## ✅ 정리

- 🔹 **Firebase Hosting 중심 혼합형 구조**
- 🔹 **하나의 Firebase 프로젝트**에서 **다중 도메인 운영**
- 🔹 **다국어 지원**: `[locale]` 라우팅으로 SEO 최적화
- 🔹 **동적 메뉴 생성**: `[...slug]` 라우팅으로 Firestore 기반 CMS 페이지 지원
- 🔹 배포/유지보수가 간단하고, Monorepo 확장도 용이
- 🔹 CMS, 블로그, 고객지원 등 확장 기능도 유연하게 통합 가능

---

## 📝 참고사항

### 장점

1. **SEO 최적화**: 언어가 URL에 포함되어 검색 엔진 최적화에 유리
2. **사용자 경험**: 언어 전환 시 URL이 변경되어 공유 시 언어 정보 유지
3. **구현 단순성**: Next.js App Router 표준 패턴 사용
4. **확장성**: Firestore 기반으로 무제한 페이지 추가 가능

### 고려사항

1. **정적 생성**: `generateStaticParams`로 빌드 시 주요 페이지 미리 생성 권장
2. **ISR (Incremental Static Regeneration)**: 동적 페이지는 ISR로 주기적 업데이트
3. **캐싱 전략**: Firestore 조회 결과를 적절히 캐싱하여 성능 최적화
4. **404 처리**: 존재하지 않는 페이지는 `notFound()`로 처리

---
