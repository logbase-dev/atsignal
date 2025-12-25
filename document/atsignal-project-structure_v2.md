# 🧱 AtSignal 프로젝트 구조 & Firebase 배포 전략 (v2)

> **목표**  
> 단일 Firebase 프로젝트(`atsignal`) 안에서  
> 메인(`atsignal.io`), 문서(`docs.atsignal.io`), 고객지원(`support.atsignal.io`), 솔루션 체험(`app.atsignal.io`)을  
> 효율적으로 운영하는 **혼합형 구조 설계**
>
> **v2 변경사항:**
>
> - 다국어 지원(`[locale]`) + 동적 메뉴 생성(`[...slug]`) 구조 적용
> - 정적/동적 페이지 분리: `(static)` 폴더로 정적 페이지, `(dynamic)/[...slug]`로 동적 CMS 페이지 관리
> - 라우팅 우선순위: 정적 라우트가 동적 라우트보다 우선
> - 별도 Admin 앱 추가 (`apps/admin/`) - CMS 관리 인터페이스
> - Firestore 데이터 구조에 `site` 필드 추가 (`web`, `docs`, `support`, `app` 구분)
> - CMS 함수에 `site` 파라미터 추가하여 사이트별 데이터 필터링
> - **TOC 자동 생성**: Nextra 스타일의 목차 자동 생성 및 스크롤 스파이 기능 추가

---

## 📂 1️⃣ 디렉토리 구조

```
/atsignal
├── apps/
│   ├── web/                  # 메인 웹사이트 (atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │    ├── (static)/
│   │   │   │    │    ├── Company/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── Pricing/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── Product/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── Resources/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── Solutions/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    └── page.tsx
│   │   |   |    |
│   │   │   │    ├── (dynamic)/
│   │   │   │    │    └── [...slug]/
│   │   │   │    │         └── page.tsx          # 동적 페이지 (Product, Solutions 등)
│   │   │   │    ├── layout.tsx                  # Locale별 레이아웃
│   │   │   │    └── page.tsx                    # 홈페이지 (/ko, /en)
│   │   │   └── layout.tsx                       # 글로벌 레이아웃
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   └── Menu.tsx                     # 동적 메뉴 컴포넌트
│   │   │   └── cms/
│   │   │       ├── PageRenderer.tsx             # CMS 페이지 렌더러
│   │   │       └── TOC.tsx                       # TOC (Table of Contents) 자동 생성 컴포넌트
│   │   ├── lib/
│   │   │   ├── cms/
│   │   │   │   ├── getPage.ts                   # Firestore 페이지 조회
│   │   │   │   └── getMenus.ts                  # Firestore 메뉴 조회
│   │   │   └── i18n/
│   │   │       └── getLocale.ts                 # Locale 유틸리티
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
│   │   │   │    ├── (static)/
│   │   │   │    │    ├── admin/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── doc/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    └── page.tsx
│   │   |   |    |
│   │   │   │    ├── (dynamic)/
│   │   │   │    │    └── [...slug]/
│   │   │   │    │         └── page.tsx          # 동적 페이지 (Product, Solutions 등)
│   │   │   │    ├── layout.tsx                  # Locale별 레이아웃
│   │   │   │    └── page.tsx                    # 홈페이지 (/ko, /en)
│   │   │   └── layout.tsx                       # 글로벌 레이아웃
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   └── Menu.tsx                     # 동적 메뉴 컴포넌트
│   │   │   └── cms/
│   │   │       ├── PageRenderer.tsx             # CMS 페이지 렌더러
│   │   │       └── TOC.tsx                       # TOC (Table of Contents) 자동 생성 컴포넌트
│   │   ├── lib/
│   │   │   ├── cms/
│   │   │   │   ├── getPage.ts                   # Firestore 페이지 조회
│   │   │   │   └── getMenus.ts                  # Firestore 메뉴 조회
│   │   │   └── i18n/
│   │   │       └── getLocale.ts                 # Locale 유틸리티
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── support/              # 고객지원 사이트 (support.atsignal.io)
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │    ├── (static)/
│   │   │   │    │    ├── Product/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── Solutions/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    └── page.tsx
│   │   |   |    |
│   │   │   │    ├── (dynamic)/
│   │   │   │    │    └── [...slug]/
│   │   │   │    │         └── page.tsx          # 동적 페이지 (Product, Solutions 등)
│   │   │   │    ├── layout.tsx                  # Locale별 레이아웃
│   │   │   │    └── page.tsx                    # 홈페이지 (/ko, /en)
│   │   │   └── layout.tsx                       # 글로벌 레이아웃
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   └── Menu.tsx                     # 동적 메뉴 컴포넌트
│   │   │   └── cms/
│   │   │       ├── PageRenderer.tsx             # CMS 페이지 렌더러
│   │   │       └── TOC.tsx                       # TOC (Table of Contents) 자동 생성 컴포넌트
│   │   ├── lib/
│   │   │   ├── cms/
│   │   │   │   ├── getPage.ts                   # Firestore 페이지 조회
│   │   │   │   └── getMenus.ts                  # Firestore 메뉴 조회
│   │   │   └── i18n/
│   │   │       └── getLocale.ts                 # Locale 유틸리티
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── app/                  # 솔루션 체험 사이트 (app.atsignal.io)
│       ├── app/
│   │   │   ├── [locale]/
│   │   │   │    ├── (static)/
│   │   │   │    │    ├── Product/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    ├── Solutions/
│   │   │   │    │    │    └── page.tsx
│   │   │   │    │    └── page.tsx
│   │   |   |    |
│   │   │   │    ├── (dynamic)/
│   │   │   │    │    └── [...slug]/
│   │   │   │    │         └── page.tsx          # 동적 페이지 (Product, Solutions 등)
│   │   │   │    ├── layout.tsx                  # Locale별 레이아웃
│   │   │   │    └── page.tsx                    # 홈페이지 (/ko, /en)
│   │   │   └── layout.tsx                       # 글로벌 레이아웃
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   └── Menu.tsx                     # 동적 메뉴 컴포넌트
│   │   │   └── cms/
│   │   │       ├── PageRenderer.tsx             # CMS 페이지 렌더러
│   │   │       └── TOC.tsx                       # TOC (Table of Contents) 자동 생성 컴포넌트
│   │   ├── lib/
│   │   │   ├── cms/
│   │   │   │   ├── getPage.ts                   # Firestore 페이지 조회
│   │   │   │   └── getMenus.ts                  # Firestore 메뉴 조회
│   │   │   └── i18n/
│   │   │       └── getLocale.ts                 # Locale 유틸리티
│   │   ├── locales/
│   │   │   ├── ko.json
│   │   │   └── en.json
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── admin/                # 관리자 앱 (atsignal.io/admin)
│       ├── app/
│       │   ├── layout.tsx                       # Admin 레이아웃
│       │   ├── page.tsx                         # 대시보드 (/admin)
│       │   ├── login/
│       │   │   ├── layout.tsx                   # 로그인 레이아웃
│       │   │   └── page.tsx                     # 로그인 페이지 (/admin/login)
│       │   ├── menus/
│       │   │   ├── page.tsx                     # 메뉴 관리 목록
│       │   │   ├── web/
│       │   │   │   └── page.tsx                 # Web 사이트 메뉴 관리
│       │   │   └── docs/
│       │   │       └── page.tsx                 # Docs 사이트 메뉴 관리
│       │   ├── pages/
│       │   │   ├── page.tsx                     # 페이지 관리 목록
│       │   │   ├── web/
│       │   │   │   └── page.tsx                 # Web 사이트 페이지 관리
│       │   │   ├── docs/
│       │   │   │   └── page.tsx                 # Docs 사이트 페이지 관리
│       │   │   ├── [site]/
│       │   │   │   ├── [id]/
│       │   │   │   │   └── page.tsx             # 페이지 편집 페이지
│       │   │   │   └── new/
│       │   │   │       └── page.tsx             # 새 페이지 생성 페이지
│       │   ├── blog/
│       │   │   └── page.tsx                     # 블로그 관리
│       │   └── api/
│       │       ├── login/
│       │       │   └── route.ts                 # 로그인 API
│       │       └── logout/
│       │           └── route.ts                  # 로그아웃 API
│       ├── components/
│       │   ├── Header.tsx                        # Admin 헤더
│       │   ├── Sidebar.tsx                       # Admin 사이드바
│       │   ├── Footer.tsx                        # Admin 푸터
│       │   ├── ConditionalLayout.tsx             # 조건부 레이아웃
│       │   ├── LogoutButton.tsx                  # 로그아웃 버튼
│       │   ├── editor/
│       │   │   └── NextraMarkdownField.tsx      # Nextra 스타일 마크다운 에디터
│       │   ├── menus/
│       │   │   ├── MenuManagement.tsx            # 메뉴 관리 컴포넌트
│       │   │   ├── MenuModal.tsx                 # 메뉴 모달
│       │   │   └── MenuTree.tsx                  # 메뉴 트리 컴포넌트
│       │   └── pages/
│       │       ├── PageEditor.tsx                # 페이지 편집기
│       │       ├── PageEditorForm.tsx             # 페이지 편집 폼
│       │       ├── PageEditorLayout.tsx          # 페이지 편집 레이아웃
│       │       └── PageManagement.tsx             # 페이지 관리 컴포넌트
│       ├── lib/
│       │   ├── admin/
│       │   │   ├── menuService.ts                # 메뉴 CRUD 서비스
│       │   │   ├── pageService.ts                # 페이지 CRUD 서비스
│       │   │   ├── blogService.ts                # 블로그 CRUD 서비스
│       │   │   ├── preview.ts                    # 미리보기 URL 생성
│       │   │   └── types.ts                      # Admin 타입 정의
│       │   └── firebase.ts                      # Firebase 초기화
│       ├── src/
│       │   └── features/
│       │       └── pages/
│       │           ├── components/
│       │           │   ├── PageForm.tsx          # 페이지 폼 컴포넌트
│       │           │   └── PageList.tsx          # 페이지 목록 컴포넌트
│       │           ├── hooks/
│       │           │   ├── usePageEditor.ts      # 페이지 편집 훅
│       │           │   └── usePages.ts           # 페이지 목록 훅
│       │           └── types.ts                  # 페이지 관련 타입
│       ├── utils/
│       │   └── menuTree.ts                       # 메뉴 트리 유틸리티
│       ├── middleware.ts                         # 쿠키 기반 인증 미들웨어
│       ├── public/
│       │   └── assets/                           # Admin 템플릿 정적 파일
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── functions/                # Firebase Functions (백엔드 API)
│   ├── src/
│   │   ├── index.ts          # Functions 진입점
│   │   ├── api/              # 통합 API 라우팅
│   │   │   └── index.ts
│   │   ├── stibee/           # Stibee API 연동
│   │   │   ├── index.ts      # 엔드포인트 (subscribeNewsletterApi)
│   │   │   ├── client.ts     # Stibee API 클라이언트
│   │   │   └── types.ts      # Stibee 관련 타입 정의
│   │   ├── inblog/           # InBlog API 연동
│   │   │   ├── index.ts      # 엔드포인트
│   │   │   ├── client.ts     # InBlog API 클라이언트
│   │   │   └── types.ts      # InBlog 관련 타입 정의
│   │   ├── cms/              # CMS 관련 함수
│   │   │   └── index.ts
│   │   ├── jira/             # Jira 연동 함수
│   │   │   └── index.ts
│   │   ├── config/            # 설정 파일
│   │   │   └── stibee.ts     # Stibee 설정
│   │   ├── services/         # 공통 서비스
│   │   │   └── subscriptionStore.ts
│   │   ├── types/            # 공통 타입
│   │   │   └── subscriber.ts
│   │   ├── utils/            # 유틸리티 함수
│   │   │   └── index.ts
│   │   └── firebase.ts       # Firebase 초기화
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

| URL                             | 설명               | 페이지 타입                                        |
| ------------------------------- | ------------------ | -------------------------------------------------- |
| `/ko`                           | 한국어 홈페이지    | 정적 (`app/[locale]/page.tsx`)                     |
| `/en`                           | 영어 홈페이지      | 정적 (`app/[locale]/page.tsx`)                     |
| `/ko/Company`                   | 한국어 정적 페이지 | 정적 (`app/[locale]/(static)/Company/page.tsx`)    |
| `/ko/Pricing`                   | 한국어 정적 페이지 | 정적 (`app/[locale]/(static)/Pricing/page.tsx`)    |
| `/ko/Product`                   | 한국어 정적 페이지 | 정적 (`app/[locale]/(static)/Product/page.tsx`)    |
| `/ko/Resources`                 | 한국어 정적 페이지 | 정적 (`app/[locale]/(static)/Resources/page.tsx`)  |
| `/en/Solutions`                 | 영어 정적 페이지   | 정적 (`app/[locale]/(static)/Solutions/page.tsx`)  |
| `/ko/product/log-collecting`    | 한국어 동적 페이지 | 동적 (`app/[locale]/(dynamic)/[...slug]/page.tsx`) |
| `/en/solutions/by-team/product` | 영어 동적 페이지   | 동적 (`app/[locale]/(dynamic)/[...slug]/page.tsx`) |
| `/ko/resources/docs@signal/api` | 한국어 문서 페이지 | 동적 (`app/[locale]/(dynamic)/[...slug]/page.tsx`) |

### 라우팅 우선순위

1. **홈페이지** (`/ko`, `/en`) - `app/[locale]/page.tsx`
2. **정적 라우트** (`(static)` 폴더 내) - 예: `/ko/Company`, `/ko/Pricing`, `/ko/Product`, `/ko/Resources`, `/en/Solutions` → `app/[locale]/(static)/{PageName}/page.tsx`
3. **동적 라우트** (`(dynamic)/[...slug]`) - Firestore에서 페이지 데이터 조회 → `app/[locale]/(dynamic)/[...slug]/page.tsx`
4. **404 처리** - 페이지가 없을 경우

> 💡 **중요**: Next.js App Router에서 `(static)` 폴더의 정적 라우트가 `(dynamic)/[...slug]` 동적 라우트보다 우선순위가 높습니다.

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

### 3.2 정적 페이지 구현

```tsx
// app/[locale]/(static)/Product/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product - AtSignal",
  description: "AtSignal 제품 소개",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div>
      <h1>Product</h1>
      {/* 정적 콘텐츠 또는 컴포넌트 */}
    </div>
  );
}

// 정적 생성
export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}
```

### 3.3 동적 페이지 구현

```tsx
// app/[locale]/(dynamic)/[...slug]/page.tsx
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/cms/getPage";
import { PageRenderer } from "@/components/cms/PageRenderer";

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

export default async function DynamicPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const slugPath = Array.isArray(slug) ? slug.join("/") : slug || "";

  // Firestore에서 페이지 데이터 조회 (site 파라미터 추가)
  const pageData = await getPageBySlug("web", slugPath, locale);

  if (!pageData) {
    notFound();
  }

  return <PageRenderer data={pageData} locale={locale} />;
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

### 3.4 Firestore 데이터 조회

```tsx
// lib/cms/getPage.ts
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Site = "web" | "docs" | "support" | "app";

export async function getPageBySlug(site: Site, slug: string, locale: string) {
  const pagesRef = collection(db, "pages");
  const q = query(
    pagesRef,
    where("site", "==", site),
    where("locale", "==", locale),
    where("slug", "==", slug)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}
```

### 3.5 동적 메뉴 생성

```tsx
// lib/cms/getMenus.ts
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Site = "web" | "docs" | "support" | "app";

export async function getMenusByLocale(site: Site, locale: string) {
  const menusRef = collection(db, "menus");
  const q = query(
    menusRef,
    where("site", "==", site),
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
  const menus = await getMenusByLocale("web", locale); // site 파라미터 추가

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

### 3.6 TOC (Table of Contents) 자동 생성

Nextra 스타일의 TOC 자동 생성 기능을 구현했습니다. Markdown 헤딩을 자동으로 감지하여 목차를 생성하고, 스크롤 스파이 기능을 제공합니다.

#### 3.6.1 TOC 컴포넌트

```tsx
// components/cms/TOC.tsx
"use client";

import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TOC({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>("");
  const [headings, setHeadings] = useState<TOCItem[]>([]);

  // DOM에서 실제 헤딩 요소 추출 (rehype-slug가 생성한 ID 사용)
  useEffect(() => {
    const timer = setTimeout(() => {
      const headingElements = Array.from(
        document.querySelectorAll("h1, h2, h3, h4, h5, h6")
      ).filter((el) => el.id) as HTMLElement[];

      const extracted: TOCItem[] = headingElements.map((el) => {
        const level = parseInt(el.tagName.charAt(1), 10);
        const text = el.textContent?.trim() || "";
        const id = el.id;
        return { id, text, level };
      });

      setHeadings(extracted);
    }, 100);

    return () => clearTimeout(timer);
  }, [content]);

  // 스크롤 스파이 (IntersectionObserver)
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%", threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) observer.unobserve(element);
      });
    };
  }, [headings]);

  // ... 렌더링 로직
}
```

#### 3.6.2 PageRenderer에 TOC 통합

```tsx
// components/cms/PageRenderer.tsx
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { TOC } from './TOC';

export default function PageRenderer({ title, content, ... }: PageRendererProps) {
  return (
    <div className="page-renderer-wrapper">
      <article className="page-renderer-content">
        {/* 헤더 및 콘텐츠 */}
        <ReactMarkdown
          rehypePlugins={[rehypeSlug]}
          components={{
            h1: ({ node, ...props }) => (
              <h1 id={props.id} style={{ scrollMarginTop: '100px' }} {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 id={props.id} style={{ scrollMarginTop: '100px' }} {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 id={props.id} style={{ scrollMarginTop: '100px' }} {...props} />
            ),
            h4: ({ node, ...props }) => (
              <h4 id={props.id} style={{ scrollMarginTop: '100px' }} {...props} />
            ),
            h5: ({ node, ...props }) => (
              <h5 id={props.id} style={{ scrollMarginTop: '100px' }} {...props} />
            ),
            h6: ({ node, ...props }) => (
              <h6 id={props.id} style={{ scrollMarginTop: '100px' }} {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
      <aside className="page-renderer-toc">
        <TOC content={content} />
      </aside>
    </div>
  );
}
```

#### 3.6.3 필요한 패키지

```json
{
  "dependencies": {
    "react-markdown": "^9.0.1",
    "rehype-slug": "^6.0.0"
  }
}
```

#### 3.6.4 주요 기능

- **자동 TOC 생성**: Markdown 헤딩(`#`, `##`, `###` 등)을 자동으로 감지하여 목차 생성
- **앵커 링크**: `rehype-slug` 플러그인으로 각 헤딩에 자동으로 ID 부여
- **스크롤 스파이**: IntersectionObserver로 현재 보고 있는 섹션을 TOC에서 하이라이트
- **부드러운 스크롤**: TOC 항목 클릭 시 해당 섹션으로 부드럽게 이동
- **Nextra 스타일**: 우측 고정 사이드바 형태의 TOC (데스크톱), 모바일에서는 숨김
- **다크 모드 지원**: CSS로 다크 모드 스타일 제공

### 3.7 Admin 앱 구현

#### 3.7.1 페이지 편집 기능

Admin 앱은 Firestore 기반 CMS로 페이지를 생성, 수정, 삭제할 수 있는 인터페이스를 제공합니다.

```tsx
// app/pages/[site]/[id]/page.tsx
import { PageEditor } from "@/components/pages/PageEditor";

export default function EditPagePage({
  params,
}: {
  params: { site: string; id: string };
}) {
  return <PageEditor site={params.site} pageId={params.id} />;
}
```

#### 3.7.2 드래프트/발행 워크플로우

페이지는 드래프트와 발행본을 분리하여 관리합니다:

- **드래프트 저장**: `labelsDraft`, `contentDraft` 필드에 저장
- **발행**: `labelsLive`, `contentLive` 필드에 저장
- **미리보기**: Next.js Preview Mode를 사용하여 드래프트 내용을 실제 사이트에서 확인

```tsx
// lib/admin/pageService.ts
export async function savePageDraft(id: string, payload: PageFormValues) {
  await updateDoc(doc(db, "pages", id), {
    labelsDraft: payload.labels,
    contentDraft: payload.content,
    draftUpdatedAt: new Date(),
  });
}

export async function publishPage(id: string, payload: PageFormValues) {
  await updateDoc(doc(db, "pages", id), {
    labelsLive: payload.labels,
    contentLive: payload.content,
    labelsDraft: payload.labels, // 발행 후 드래프트도 동기화
    contentDraft: payload.content,
    updatedAt: new Date(),
    draftUpdatedAt: new Date(),
  });
}
```

#### 3.7.3 미리보기 기능

```tsx
// lib/admin/preview.ts
export function createPreviewUrl(
  site: Site,
  pageId: string,
  slug: string,
  locale: "ko" | "en"
) {
  const previewSecret = process.env.NEXT_PUBLIC_PREVIEW_SECRET;
  const previewOrigin =
    site === "web"
      ? process.env.NEXT_PUBLIC_WEB_PREVIEW_ORIGIN
      : process.env.NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN;

  const previewApiUrl = new URL("/api/preview", previewOrigin);
  previewApiUrl.searchParams.set("secret", previewSecret);
  previewApiUrl.searchParams.set("draftId", pageId);
  previewApiUrl.searchParams.set("slug", slug);
  previewApiUrl.searchParams.set("locale", locale);

  return previewApiUrl.toString();
}
```

#### 3.7.4 Nextra 스타일 마크다운 에디터

```tsx
// components/editor/NextraMarkdownField.tsx
export function NextraMarkdownField({ value, onChange, locale, ... }) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <section>
      <header>
        <span>{locale.toUpperCase()}</span>
        <div>
          <button onClick={() => setMode('write')}>Write</button>
          <button onClick={() => setMode('preview')}>Preview</button>
        </div>
      </header>
      {mode === 'write' ? (
        <textarea value={value} onChange={onChange} />
      ) : (
        <ReactMarkdown>{value}</ReactMarkdown>
      )}
    </section>
  );
}
```

#### 3.7.5 메뉴 관리

메뉴는 계층 구조로 관리되며, 언어별로 독립적으로 활성화/비활성화할 수 있습니다:

```tsx
// lib/admin/menuService.ts
export interface Menu {
  site: Site;
  labels: { ko: string; en?: string };
  path: string;
  depth: number;
  parentId: string;
  order: number;
  enabled: {
    ko: boolean;
    en: boolean;
  };
}
```

---

## 🚀 4️⃣ 배포 전략

| 서비스             | 도메인                | 배포 대상           | 빌드 명령어               | Firebase Hosting Target | 비고                                                                       |
| ------------------ | --------------------- | ------------------- | ------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| 메인 사이트        | `atsignal.io`         | `/apps/web/out`     | `npm run build:web`       | `web`                   |                                                                            |
| 문서 사이트        | `docs.atsignal.io`    | `/apps/docs/out`    | `npm run build:docs`      | `docs`                  |                                                                            |
| 고객지원 사이트    | `support.atsignal.io` | `/apps/support/out` | `npm run build:support`   | `support`               |                                                                            |
| 솔루션 체험 사이트 | `app.atsignal.io`     | `/apps/app/out`     | `npm run build:app`       | `app`                   |                                                                            |
| 관리자 앱          | `atsignal.io/admin`   | Vercel (임시)       | `npm run build:admin`     | -                       | 개발 단계 임시 (최종: Firebase Hosting)<br/>별도 앱이지만 같은 도메인 사용 |
| 백엔드 API         | Cloud Functions       | `/functions`        | `npm run build:functions` | `functions`             |                                                                            |

> 💡 **한 Firebase 프로젝트**에 여러 Hosting Target을 등록해서  
> 도메인별로 각각 배포 가능
>
> 💡 **Admin 앱**: 별도의 Next.js 앱(`apps/admin/`)으로 개발되지만, Vercel rewrites를 통해 `atsignal.io/admin` 경로로 접근합니다.  
> 이는 코드 분리와 유지보수 용이성을 위한 아키텍처 설계입니다.

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
    "build:admin": "cd apps/admin && npm run build",
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

## 🌐 8️⃣.5️⃣ Vercel 배포 설정 (Admin 앱) ⚠️ 개발 단계 임시

> **⚠️ 주의**: 이 섹션은 개발 단계에서만 사용하는 임시 설정입니다.  
> 최종 배포 시 Firebase Hosting으로 전환 예정이며, 이 섹션은 제거될 예정입니다.

### Admin 앱 아키텍처

Admin 앱은 **별도의 Next.js 앱**(`apps/admin/`)으로 개발되지만, 사용자는 `atsignal.io/admin` 경로로 접근합니다.

**구조:**

- **개발**: `apps/admin/` - 독립적인 Next.js 앱
- **배포**: Vercel에서 `apps/web`과 함께 빌드하여 같은 도메인에 배포
- **URL**: `atsignal.io/admin/*` - Vercel rewrites를 통해 라우팅
- **장점**:
  - Admin 앱과 메인 웹 앱의 코드 분리로 유지보수 용이
  - 같은 도메인 사용으로 CORS 문제 없음
  - 쿠키 기반 인증 공유 가능

**빌드 프로세스:**

1. `apps/web` 빌드 → `apps/web/out`
2. `apps/admin` 빌드 → `apps/web/out/admin` (또는 별도 처리)
3. Vercel rewrites로 `/admin/*` 요청을 Admin 앱으로 라우팅

Admin 앱은 현재 개발 단계에서 Vercel을 통해 배포되며, `atsignal.io/admin` 경로로 접근 가능합니다.

### vercel.json 설정

```json
{
  "buildCommand": "npm run build:web && npm run build:admin",
  "outputDirectory": "apps/web/out",
  "rewrites": [
    {
      "source": "/admin/:path*",
      "destination": "/admin/:path*"
    }
  ]
}
```

### Vercel 프로젝트 설정

1. **Monorepo 설정**: Vercel 대시보드에서 Root Directory를 프로젝트 루트로 설정
2. **Build Command**: `npm run build:web && npm run build:admin`
3. **Output Directory**: `apps/web/out` (또는 Vercel이 자동 감지)
4. **Rewrites**: `vercel.json`의 rewrites 설정 사용

### 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정:

```
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=your-secure-password
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_PREVIEW_SECRET=your-preview-secret
NEXT_PUBLIC_WEB_PREVIEW_ORIGIN=http://localhost:3000
NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN=http://localhost:3001
```

### Admin 앱 인증

- **쿠키 기반 인증**: `/api/login` 엔드포인트로 로그인 후 쿠키 발급
- **Middleware**: `apps/admin/middleware.ts`에서 쿠키 검증
- **세션 관리**: 7일간 유효한 `admin-auth` 쿠키 사용

---

## 📊 9️⃣ Firestore 데이터 구조

### pages 컬렉션

```
pages/
  {id}/
    - site: 'web' | 'docs' | 'support' | 'app'  # 사이트 구분 필드
    - menuId: string                             # 연결된 메뉴 ID
    - slug: string                               # 페이지 URL 경로
    - labelsLive: {                              # 발행된 페이지 제목
        ko: string
        en?: string
      }
    - contentLive: {                              # 발행된 페이지 내용
        ko: string
        en?: string
      }
    - labelsDraft?: {                            # 임시 저장된 페이지 제목
        ko: string
        en?: string
      }
    - contentDraft?: {                            # 임시 저장된 페이지 내용
        ko: string
        en?: string
      }
    - draftUpdatedAt?: Timestamp                 # 드래프트 마지막 수정 시간
    - createdAt: Timestamp
    - updatedAt: Timestamp                        # 발행 마지막 수정 시간
```

**예시:**

```
pages/
  {id-1}/
    site: "web"
    menuId: "menu-123"
    slug: "product/log-collecting"
    labelsLive: { ko: "로그 수집", en: "Log Collecting" }
    contentLive: { ko: "# 로그 수집\n...", en: "# Log Collecting\n..." }
    labelsDraft: { ko: "로그 수집 (수정중)", en: "Log Collecting (Editing)" }
    contentDraft: { ko: "# 로그 수집\n수정된 내용...", en: "# Log Collecting\nUpdated content..." }
    draftUpdatedAt: Timestamp(2024-01-15)
    updatedAt: Timestamp(2024-01-10)
  {id-2}/
    site: "docs"
    menuId: "menu-456"
    slug: "admin/getting-started"
    labelsLive: { ko: "시작하기" }
    contentLive: { ko: "# 시작하기\n..." }
    updatedAt: Timestamp(2024-01-12)
```

### menus 컬렉션

```
menus/
  {id}/
    - site: 'web' | 'docs' | 'support' | 'app'  # 사이트 구분 필드
    - labels: {                                  # 메뉴 제목 (다국어)
        ko: string
        en?: string
      }
    - path: string                               # 메뉴 URL 경로
    - depth: number                              # 메뉴 깊이 (1부터 시작)
    - parentId: string                           # 부모 메뉴 ID (루트는 빈 문자열)
    - order: number                              # 정렬 순서
    - enabled: {                                  # 언어별 활성화 상태
        ko: boolean
        en: boolean
      }
    - createdAt?: Timestamp
    - updatedAt?: Timestamp
```

**예시:**

```
menus/
  {id-1}/
    site: "web"
    labels: { ko: "제품", en: "Product" }
    path: "product"
    depth: 1
    parentId: ""
    order: 1
    enabled: { ko: true, en: true }
  {id-2}/
    site: "web"
    labels: { ko: "로그 수집", en: "Log Collecting" }
    path: "product/log-collecting"
    depth: 2
    parentId: "menu-123"
    order: 1
    enabled: { ko: true, en: false }
  {id-3}/
    site: "docs"
    labels: { ko: "관리자 가이드" }
    path: "admin"
    depth: 1
    parentId: ""
    order: 1
    enabled: { ko: true, en: true }
```

---

## 🧩 🔟 확장 포인트

| 기능            | 기술                                                             | 설명                                             |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------ |
| 정적 페이지     | Next.js Static Route                                             | `app/[locale]/(static)/**/page.tsx`              |
| CMS 페이지 관리 | Firestore + Next.js Dynamic Route                                | `app/[locale]/(dynamic)/[...slug]/page.tsx`      |
| Admin 관리자 앱 | 별도 Admin 앱 (`apps/admin/`)                                    | Vercel 배포, 쿠키 기반 인증                      |
| 드래프트/발행   | Firestore `labelsDraft/contentDraft` vs `labelsLive/contentLive` | 임시 저장 및 발행 워크플로우 관리                |
| 미리보기 기능   | Next.js Preview Mode + Preview API                               | 드래프트 내용을 실제 사이트에서 미리 확인        |
| Nextra 에디터   | `NextraMarkdownField` 컴포넌트                                   | Write/Preview 탭이 있는 마크다운 에디터          |
| 메뉴 관리       | 계층 구조 메뉴 + 언어별 활성화                                   | Firestore 기반 동적 메뉴 생성 및 관리            |
| 사이트별 데이터 | Firestore `site` 필드                                            | `web`, `docs`, `support`, `app` 구분             |
| 블로그/뉴스     | InBlog API 연동 (`functions/src/inblog/`)                        | Firestore 캐싱 가능                              |
| 뉴스레터 구독   | Stibee API 연동 (`functions/src/stibee/`)                        | 구독자 동기화 및 관리                            |
| 고객지원        | Jira API + Functions Proxy (`functions/src/jira/`)               | REST API 호출 방식                               |
| 이메일/알림     | Firebase Functions + SendGrid                                    | 고객 메일 알림 처리                              |
| 다국어 지원     | `[locale]` 라우팅                                                | URL 기반 언어 전환                               |
| 동적 메뉴       | Firestore `menus` 컬렉션                                         | 운영자 관리 가능                                 |
| TOC 자동 생성   | rehype-slug + IntersectionObserver                               | Markdown 헤딩 기반 목차 자동 생성, 스크롤 스파이 |

---

## ✅ 정리

- 🔹 **Firebase Hosting 중심 혼합형 구조**
- 🔹 **하나의 Firebase 프로젝트**에서 **다중 도메인 운영**
- 🔹 **별도 Admin 앱**: `apps/admin/`으로 CMS 통합 관리, Vercel 배포
- 🔹 **드래프트/발행 워크플로우**: 임시 저장과 발행을 분리하여 안전한 콘텐츠 관리
- 🔹 **미리보기 기능**: Next.js Preview Mode로 드래프트 내용을 실제 사이트에서 확인
- 🔹 **Nextra 스타일 에디터**: Write/Preview 탭이 있는 마크다운 에디터 제공
- 🔹 **사이트별 데이터 구분**: Firestore에 `site` 필드로 `web`, `docs`, `support`, `app` 구분
- 🔹 **다국어 지원**: `[locale]` 라우팅으로 SEO 최적화
- 🔹 **정적/동적 페이지 분리**: `(static)` 폴더로 정적 페이지, `(dynamic)/[...slug]`로 동적 CMS 페이지 관리
- 🔹 **동적 메뉴 생성**: Firestore 기반 CMS 페이지 지원, 언어별 독립 활성화
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

1. **라우팅 우선순위**: `(static)` 폴더의 정적 라우트가 `(dynamic)/[...slug]` 동적 라우트보다 우선
2. **정적 생성**: `generateStaticParams`로 빌드 시 주요 페이지 미리 생성 권장
3. **ISR (Incremental Static Regeneration)**: 동적 페이지는 ISR로 주기적 업데이트
4. **캐싱 전략**: Firestore 조회 결과를 적절히 캐싱하여 성능 최적화
5. **404 처리**: 존재하지 않는 페이지는 `notFound()`로 처리
6. **폴더 구조**: `(static)`과 `(dynamic)`은 Next.js Route Groups로 URL에 포함되지 않음
7. **사이트 필드 필수**: Firestore `pages`와 `menus` 컬렉션에 `site` 필드 필수 (쿼리 필터링)
8. **Admin 앱 인증**: 쿠키 기반 인증 사용, 환경 변수로 인증 정보 관리
9. **Vercel Rewrites**: Admin 앱은 Vercel rewrites로 `atsignal.io/admin` 경로 제공
10. **드래프트/발행 분리**: `labelsDraft/contentDraft`와 `labelsLive/contentLive`를 분리하여 안전한 콘텐츠 관리
11. **미리보기 환경 변수**: `NEXT_PUBLIC_PREVIEW_SECRET`, `NEXT_PUBLIC_WEB_PREVIEW_ORIGIN`, `NEXT_PUBLIC_DOCS_PREVIEW_ORIGIN` 설정 필수
12. **메뉴-페이지 연동**: 메뉴와 페이지는 1:1 관계, 메뉴가 없으면 페이지 생성 불가
13. **언어별 메뉴 활성화**: 메뉴의 `enabled.ko`와 `enabled.en`을 독립적으로 관리하여 언어별 표시 제어

---
