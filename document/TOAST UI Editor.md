내일 TOAST UI Editor를 붙일 때 참고할 수 있는 간단한 작업 개요입니다.

---

### 1. 패키지 설치

`apps/admin` 기준으로 TOAST UI Editor를 설치합니다.

```bash
cd apps/admin
pnpm add @toast-ui/react-editor @toast-ui/editor
pnpm add -D @types/react
```

(이미 React/TypeScript가 있으니 추가 의존성만 설치하면 됩니다.)

### 2. Editor 래퍼 컴포넌트 만들기

`components/editor/ToastMarkdownEditor.tsx` 같은 파일을 만들어 TOAST UI Editor를 감싼 래퍼를 작성합니다.

```tsx
"use client";

import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import { ForwardedRef, useRef, useEffect } from "react";

interface ToastMarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
}

export function ToastMarkdownEditor({
  value,
  onChange,
}: ToastMarkdownEditorProps) {
  const editorRef = useRef<Editor>(null);

  // 초기값 주입 (에디터 마운트 후 setMarkdown)
  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance();
    if (editorInstance && value !== editorInstance.getMarkdown()) {
      editorInstance.setMarkdown(value || "");
    }
  }, [value]);

  return (
    <Editor
      ref={editorRef as ForwardedRef<Editor>}
      initialValue={value}
      previewStyle="vertical"
      height="600px"
      initialEditType="markdown" // 또는 'wysiwyg'
      useCommandShortcut={true}
      onChange={() => {
        const markdown = editorRef.current?.getInstance().getMarkdown() || "";
        onChange(markdown);
      }}
      hideModeSwitch={false} // WYSIWYG ↔ Markdown 토글 표시 여부
      toolbarItems={
        [
          /* 필요한 버튼 구성 */
        ]
      }
    />
  );
}
```

### 3. PageEditorForm에 토글 추가

- `PageEditorForm`에서 `editorType` 상태를 추가 (`'nextra' | 'toast'`).
- UI 버튼/드롭다운으로 에디터 선택 가능하게 함.
- 전환 시 현재 content를 Markdown으로 유지하되, 전환 시 경고 모달을 띄울지 여부 결정.
- `editorType`에 따라 `NextraMarkdownField` vs `ToastMarkdownEditor`를 조건부 렌더링.

```tsx
const [editorType, setEditorType] = useState<'nextra' | 'toast'>('nextra');

{editorType === 'nextra' ? (
  <NextraMarkdownField ... />
) : (
  <ToastMarkdownEditor
    value={formState.contentEn}
    onChange={(next) => setFormState((prev) => ({ ...prev, contentEn: next }))}
  />
)}
```

### 4. 저장 로직 확인

- `formState.contentKo/contentEn`에 Markdown 문자열이 들어가므로 기존 저장 로직은 그대로 사용 가능.
- `getMarkdown()`을 호출하고 있으니 DB에는 Markdown이 저장됨.

### 5. 스타일/UX 보완

- 에디터 전환 버튼 옆에 “전환 시 현재 입력된 내용이 그대로 유지/초기화된다”는 안내 문구 추가.
- 필요하다면 전환 시 `confirm` 모달로 사용자 확인.

### 6. 테스트 포인트

- WYSIWYG에서 작성 → 저장 → 미리보기(TOC, 링크 등) 정상 렌더링 되는지 확인.
- WYSIWYG→Markdown 전환 시 줄바꿈/표/코드블록이 적절히 변환되는지 확인.
- `editorRef.current?.getInstance()`가 null이 아닌지, SSR 환경에서는 `use client` 컴포넌트로만 사용되는지 확인.

---

이 정도로 준비해 두면 내일 실제 구현을 시작할 때 빠르게 진행할 수 있을 겁니다. 필요하면 TOAST UI Editor 플러그인(코드 블록 하이라이트, 표, 이미지 업로드 등)도 추가로 붙일 수 있습니다.
