# 🧩 **atsignal — 동적 페이지 구성 방식 정리**

**버전:** 1.0
**작성일:** 2025-11-06
**작성자:** 이민규

---

## ✅ **운영자 페이지 생성 원칙**

> 운영자가 파일을 생성하거나 수정하는 것이 아니라,
>
> **DB(Firestore)에 콘텐츠를 저장 → 동적 라우팅으로 렌더링**
>
> → CMS처럼 페이지 추가/수정 가능
>
> → `head`, `topmenu`, `footer`는 고정 import
>
> → 중앙 콘텐츠(본문)만 변경

---

## 📂 **Firestore 데이터 예시**

```
pages/
   feature-abc/
      title: "신규 기능 소개"
      content: "<h1>신규 기능</h1><p>설명...</p>"
      menuName: "기능 소개"

```

---

## 🧱 **Next.js 동적 라우팅 구조 예시**

```
/app/[slug]/page.tsx

```

→ slug에 맞는 페이지 데이터를 Firestore에서 읽어 렌더링

---

## ⚙️ **본문(서브페이지) 구현 방식 비교**

---

### 1️⃣ **HTML 저장형 (가장 간단한 방식)**

**📌 개념**

- WYSIWYG 에디터(`react-quill`, `tinymce`)로 입력
- Firestore에 HTML 문자열로 저장
- 프론트에서 `dangerouslySetInnerHTML`로 렌더링

```tsx
<div dangerouslySetInnerHTML={{ __html: pageData.content }} />
```

**✅ 장점**

- 구현이 매우 단순
- 이미지 삽입 쉬움
- 자유로운 표현 가능

**❌ 단점**

- 운영자가 CSS/레이아웃을 망가뜨릴 수 있음
- UI 일관성 유지 어려움

**💡 적합한 영역**

- Blog, Case, News 등 “글 중심 콘텐츠”

---

### 2️⃣ **블록 구성형 (Component Schema 기반 CMS)**

**📌 개념**

- Firestore에 “블록 배열”로 저장
- 블록 타입별 컴포넌트를 import 해서 렌더링

```json
{
  "title": "로그 수집",
  "blocks": [
    {
      "type": "hero",
      "props": { "title": "로그 수집", "subtitle": "다양한 채널 지원" }
    },
    { "type": "image", "props": { "src": "/images/log.png" } },
    { "type": "text", "props": { "html": "<p>수집된 로그를...</p>" } }
  ]
}
```

```tsx
const components = {
  hero: HeroSection,
  image: ImageBlock,
  text: TextBlock,
};

return page.blocks.map((block, i) => {
  const Component = components[block.type];
  return <Component key={i} {...block.props} />;
});
```

**✅ 장점**

- 디자인 일관성 유지
- 재사용성과 유지보수성 높음
- 확장성 뛰어남

**❌ 단점**

- 구현 복잡도 약간 있음 (Admin UI 필요)

**💡 적합한 영역**

- Product, Solution 등 구조적 페이지

---

### 3️⃣ **Markdown + Renderer 혼합형**

**📌 개념**

- Markdown 문법으로 작성 (`## 제목`, `*강조**`, `![이미지]`)
- Firestore에 저장 후 `react-markdown`으로 렌더링

```tsx
import ReactMarkdown from "react-markdown";

<ReactMarkdown>{pageData.markdown}</ReactMarkdown>;
```

**✅ 장점**

- 기술 문서, 텍스트 위주 콘텐츠에 적합
- 작성과 관리가 간단

**❌ 단점**

- 이미지/스타일 제한
- 시각적 다양성 부족

**💡 적합한 영역**

- Docs, FAQ, Tips, API 문서

---

## 🔍 **비교 요약**

| 구분            | 장점                | 단점                | atsignal 적용 추천  |
| --------------- | ------------------- | ------------------- | ------------------- |
| **HTML 저장형** | 단순, 자유도 높음   | 일관성 깨질 수 있음 | Blog / Case / News  |
| **블록 구성형** | 디자인 통일, 확장성 | 구현 복잡도 ↑       | Product / Solutions |
| **Markdown형**  | 문서 작성 편리      | 디자인 제한         | Docs / FAQ / Tips   |

---

## ✨ **atsignal 적용 제안**
