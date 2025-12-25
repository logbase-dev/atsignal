좋습니다 — `Nextra`로 연동하기로 하셨군요. 아래는 **docs.atsignal.io(다국어 + static/(dynamic) 분리 + 정적 우선 라우팅)** 요구사항에 맞춰, 실무에서 바로 적용 가능한 **쉽고 자세한 단계별 가이드**입니다. 중요한 근거 문서들은 문단 끝에 붙여두었어요(참고용).

---

# 요약(한줄)

Nextra는 **Next.js 기반의 문서 테마**로 TOC/사이드바/검색/다국어(i18n)를 테마 수준에서 지원하므로, `docs.atsignal.io` 같은 기술문서 사이트(다국어·대량 동적 페이지)에 적합합니다. 기본적으로 **Nextra(앱) → Next.js(앱 라우터)** 위에서 동작합니다. ([Nextra][1])

---

# 1단계 — 프로젝트 구조 설계 (권장)

Nextra는 Next.js App Router 기반(Nextra v4+)이므로 `app/` 디렉토리를 활용하는 것을 권장드립니다. `locale`과 `(static)`/`(dynamic)` 분리를 다음처럼 추천합니다:

```
/docs-site/                # Nextra 프로젝트 루트
  package.json
  next.config.mjs
  theme.config.js
  /app
    /[locale]/
      /(static)/
        intro/page.mdx          # 정적 우선 라우트 예시
        getting-started/page.mdx
      /(dynamic)/
        /[...slug]/
          page.tsx              # catch-all 동적 CMS 페이지
  /content                    # (선택) 파일 기반 정적 MDX 보관소
```

- `(static)` 폴더에 고정 경로(명시적 페이지)를 두면 **정적 경로가 우선** 매칭됩니다. 그 외의 요청은 `(dynamic)/[...slug]`의 캐치올(dynamic) 라우트로 가게 하여 CMS 또는 Firestore에서 콘텐츠를 불러옵니다. Next.js의 catch-all 동작을 이용하면 됩니다. ([nextjs.org][2])

---

# 2단계 — Nextra 기본 설치

터미널에서 Nextra docs 테마 설치(예시: npm):

```bash
mkdir docs-site
cd docs-site
npm init -y

# 필수 패키지 설치
npm install next react react-dom nextra nextra-theme-docs
# (선택) TypeScript 쓰면 tsconfig 및 types 설치
```

`package.json` scripts 예:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

(참고: Nextra 공식 스타터/템플릿으로 Vercel에서 빠르게 시작할 수도 있습니다). ([Vercel][3])

---

# 3단계 — Next.js + Nextra 설정 (`next.config.mjs`)

Nextra를 Next.js에 연결하고 **i18n(다국어)**을 설정하는 예:

```js
// next.config.mjs
import nextra from "nextra";
import docsTheme from "nextra-theme-docs";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.js",
});

export default withNextra({
  reactStrictMode: true,
  i18n: {
    locales: ["en", "ko"], // 지원 로케일 목록 (예시)
    defaultLocale: "en",
  },
  // 필요시 외부 이미지 도메인, SWC 설정 등 추가
});
```

- Nextra는 **Next.js i18n 라우팅**을 테마 차원에서 지원합니다 (docs 테마 한정). ([Nextra][4])

---

# 4단계 — 테마 설정 (`theme.config.js`)

사이드바, 상단 네비, TOC 동작을 제어합니다. 아주 기본 예:

```js
// theme.config.js
export default {
  project: {
    link: "https://github.com/yourorg/atsignal",
  },
  docsRepositoryBase: "https://github.com/yourorg/atsignal/blob/main",
  titleSuffix: " · AtSignal Docs",
  nav: [
    { title: "Docs", href: "/" },
    { title: "API", href: "/api" },
  ],
  // TOC, hide or show 설정은 테마 문서에 따라 옵션이 다름
  toc: {
    float: true, // TOC를 우측 고정형으로 띄움 (테마 옵션 예시)
  },
};
```

- **TOC(소제목 목차)**는 Nextra Docs Theme에 기본 지원 항목이므로 별도 구현 없이도 사이드 TOC가 나타납니다. 더 세밀한 옵션은 테마 문서 확인 후 theme.config.js에서 조절 가능합니다. ([Nextra][1])

---

# 5단계 — 정적 페이지 파일 배치 `(static)` 예

`app/[locale]/(static)/getting-started/page.mdx`:

```mdx
---
title: Getting started
description: How to get started with AtSignal
---

# Getting started

내용...
```

이렇게 명시적 파일을 두면 Next가 정적 경로로 우선 매칭합니다.

---

# 6단계 — 동적 CMS 페이지: `(dynamic)/[...slug]/page.tsx` (예시)

요구하신 대로 동적 페이지는 Firestore(또는 외부 CMS)를 참조해 렌더링합니다. App Router에서는 `generateStaticParams`로 미리 빌드할 경로를 만들고, 동적으로는 서버 함수로 페치합니다.

**간단한 예시 (TypeScript)**:

```ts
// app/[locale]/(dynamic)/[...slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchDocBySlug } from "@/lib/cms"; // 여러분이 만든 fetch 함수

type Props = { params: { locale: string; slug: string[] } };

export async function generateStaticParams() {
  // 빌드 시 미리 정적으로 생성할 slug 리스트를 리턴 (선택)
  // 예: return [{ locale: 'en', slug: ['how-it-works'] }, ...]
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = await fetchDocBySlug(params.locale, params.slug.join("/"));
  if (!doc) return {};
  return { title: doc.title, description: doc.excerpt };
}

export default async function Page({ params }: Props) {
  const path = params.slug.join("/");
  const doc = await fetchDocBySlug(params.locale, path);

  if (!doc) {
    // notFound()를 호출하면 404 페이지
    notFound();
  }

  return (
    <article>
      {/* doc.content는 MDX 또는 HTML로 변환된 내용 */}
      <div dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}
```

- `fetchDocBySlug`는 Firestore나 CMS에서 문서(마크다운)를 가져와 서버사이드에서 MDX→HTML로 변환해 반환하는 함수로 구현합니다.
- **빌드 전략(SSG/ISR/SSR)**: 문서 변동성이 낮다면 빌드 타임에 미리 생성(SSG)하는 게 빠르고 안정적입니다. 자주 변경된다면 ISR(Next.js의 revalidate) 또는 SSR을 고려하세요.

---

# 7단계 — Firestore/관리 콘솔과 통합

- **콘텐츠 저장소(동적 페이지)**: Firestore에 문서(마크다운 원문, 메타데이터, slug, locale, updatedAt 등)를 저장합니다.
- **빌드 시 정적화**: `generateStaticParams`에서 Firestore 쿼리로 미리 빌드할 슬러그 목록을 불러오면 정적 HTML로 생성 가능.
- **실시간 변경 반영**: 새 문서가 자주 올라온다면 웹훅(예: Firestore → GitHub Action 트리거 → Vercel 빌드) 또는 ISR(재검증)을 사용.

(구현 세부: Firestore에 읽기 전용 API를 만들고 Next.js에서 서버 측으로 fetch 하거나, 빌드시 GitHub Action이 Firestore에서 MDX 파일을 읽어 repo에 커밋하는 패턴도 있습니다.)

---

# 8단계 — 배포 옵션 (권장순) => 현재는 개발중이라 Vercel에 배로하지만 어느정도 개발이되면 Firebase Hosting으로 변경 예정. Firebase Hosting을 고려하여 개발한다.

**권장 — Vercel**: Next.js + Nextra 공식 템플릿과 가장 궁합이 좋고, 빌드/ISR/CD 자동화가 쉬움. `docs.atsignal.io`를 Vercel에 배포하고 DNS(CNAME)로 `docs.atsignal.io` 연결하면 끝. ([Vercel][3])

**대안 — Firebase Hosting**: Firebase도 Next.js 배포(Framework-aware Hosting / App Hosting) 지원하지만(프리뷰 / 조심스러운 기능), 설정이 Vercel보다 복잡할 수 있습니다. Firebase에 배포하려면 Firebase CLI의 Next.js 통합을 사용하거나 Cloud Run/Cloud Functions로 Next.js 앱을 호스팅하는 방법이 있습니다. (주의: 일부 기능은 preview 상태일 수 있음). ([Firebase][5])

- 만약 `atsignal` 단일 Firebase 프로젝트 안에 `docs.atsignal.io`를 포함시키고 싶다면:

  - **A. DNS**: Vercel에 배포한 뒤 `docs.atsignal.io` CNAME을 Vercel에 연결 — Firebase는 `atsignal.io`와 다른 서브도메인(예: support, app)에 사용.
  - **B. Firebase에 직접 배포**: (원할 경우) Firebase Hosting의 프레임워크 통합을 통해 Next.js 앱 배포. 다만 설정/운영 복잡도가 큼. ([Firebase][5])

---

# 9단계 — 추가 실전 팁 (요구사항에 맞춰)

- **정적 우선 매칭 보장법**: 파일 기반으로 `(static)` 폴더에 명시적 페이지를 둡니다. Next.js 라우터는 명시적(static) 경로를 먼저 매칭하므로 캐치올보다 우선됩니다. (catch-all은 마지막에 매칭). ([nextjs.org][2])
- **TOC 표시/스타일 조정**: 기본 Nextra Docs Theme에 TOC 기본 기능이 있으므로, `theme.config.js`나 CSS로 위치/스타일을 조정하면 됩니다. 추가 JS/IntersectionObserver로 현재 섹션 하이라이트를 보강하세요. ([Nextra][1])
- **동적 메뉴([…slug] 기반) 자동생성**: Firestore에 메뉴 정의(메뉴 트리 JSON)를 두고, `theme.config.js`를 빌드 시 생성하거나 런타임에 API로 불러와 테마에 주입하면 동적 메뉴가 가능.
- **CMS 편의성**: 비개발자용 편집을 원하면, 간단한 editor (Netlify CMS, Sanity/Strapi UI, 또는 자체 admin)와 Firestore 연동을 고려하세요. 변경 시 빌드 트리거(웹훅)로 재빌드/ISR 동작.

---

# 10단계 — 예제 깃허브 시작 템플릿 (빠르게 시작)

- Vercel의 Nextra Docs 템플릿을 포크/클론 → `next.config.mjs`/`theme.config.js`/`app/[locale]/...` 만 수정하면 훨씬 빠릅니다. ([Vercel][3])

---

## 참고(중요 문서)

- Nextra Docs Theme (TOC, sidebar 등 기본 제공). ([Nextra][1])
- Nextra 가 Next.js i18n을 테마에서 지원한다는 문서. ([Nextra][4])
- Nextra v4 & App Router 안내(콘텐츠 디렉토리·catch-all 사용 관련). ([The Guild][6])
- Next.js 동적(캐치-올) 라우트 문서(정적 우선 매칭 관점). ([nextjs.org][2])
- Firebase의 Next.js 통합 가이드(Framework-aware Hosting / App Hosting). ([Firebase][5])

## <!--

# 마무리 추천

- **빠르고 안정적으로 운영(개발자 친화)**: `Nextra + Vercel` 조합이 가장 간단하고 관리 편의성이 높습니다. (도메인 연결만 하면 됨)
- **반드시 Firebase Hosting에 넣어야 한다면**: Firebase의 Next.js 통합 문서를 보고 진행하되, 배포/빌드 파이프라인이 다소 복잡할 수 있으니 초기엔 Vercel에서 빠르게 올려보고 이후 마이그레이션하는 걸 추천합니다. ([Firebase][5])

---

원하시면 지금 바로:

1. `next.config.mjs`, `theme.config.js`의 **완전한 예제 코드**를 제가 만들어 드리겠습니다.
2. 또는 `app/[locale]/(dynamic)/[...slug]/page.tsx`에서 Firestore로부터 MDX를 불러와 MDX로 렌더링하는 **구체적 코드(서버 함수 + MDX 변환 포함)** 예제를 만들어 드릴게요.

어떤 걸 먼저 원하시나요? (템플릿 세팅 / Firestore 통합 코드 / Vercel 배포 절차 중 택1 해주시면 바로 만들어드릴게요.)

[1]: https://nextra.site/docs/docs-theme/start?utm_source=chatgpt.com "Docs Theme"
[2]: https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes?utm_source=chatgpt.com "Dynamic Routes"
[3]: https://vercel.com/templates/next.js/documentation-starter-kit?utm_source=chatgpt.com "Nextra: Docs Starter Kit"
[4]: https://nextra.site/docs/guide/i18n?utm_source=chatgpt.com "Next.js I18n"
[5]: https://firebase.google.com/docs/hosting/frameworks/nextjs?utm_source=chatgpt.com "Integrate Next.js | Firebase Hosting - Google"

[6]: https://the-guild.dev/blog/nextra-4?utm_source=chatgpt.com "Nextra 4 x App Router. What's New and Migration Guide" -->
