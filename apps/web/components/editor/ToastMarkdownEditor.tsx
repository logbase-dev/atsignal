"use client";

import React, { useEffect, useRef, useState } from "react";
import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import { uploadImage } from "@/lib/admin/imageUpload";

interface ToastMarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  saveFormat?: "markdown" | "html";
  onSaveFormatChange?: (format: "markdown" | "html") => void;
  isNewPage?: boolean;
  height?: string;
}

export function ToastMarkdownEditor({
  value,
  onChange,
  saveFormat = "markdown",
  onSaveFormatChange,
  isNewPage = false,
  height = "500px",
}: ToastMarkdownEditorProps) {
  const editorRef = useRef<Editor>(null);
  const isUserTypingRef = useRef(false);
  const previousValueRef = useRef<string>("");
  const previousSaveFormatRef = useRef<"markdown" | "html">(saveFormat);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);
  
  // 완전한 HTML을 저장하기 위한 ref
  const fullHTMLRef = useRef<string>("");
  // 사용자가 직접 입력한 원본 HTML을 저장하는 ref
  const userInputHTMLRef = useRef<string>("");

  const normalizeHtmlEscapes = (html: string): string => {
    if (!html) return html;
    let normalized = html;
    let previous = "";
    while (normalized !== previous) {
      previous = normalized;
      normalized = normalized.replace(/&amp;amp;/g, "&amp;");
    }
    return normalized;
  };

  const safeGetHTML = (editorInstance: any): string => {
    try {
      if (!editorInstance || typeof editorInstance.getHTML !== "function") {
        console.log("[safeGetHTML] Editor instance not available");
        return "";
      }
      
      // fullHTMLRef에 저장된 완전한 HTML이 있으면 우선 사용
      if (fullHTMLRef.current && fullHTMLRef.current.trim()) {
        console.log("[safeGetHTML] fullHTMLRef에서 가져온 HTML:", fullHTMLRef.current);
        return normalizeHtmlEscapes(fullHTMLRef.current);
      }
      
      // Toast UI Editor의 원본 HTML을 최대한 보존하여 가져오기
      let html = "";
      
      // 1차: sanitize 옵션을 false로 시도 (가능한 경우)
      try {
        if (typeof editorInstance.getHTML === "function") {
          const rawHTML = editorInstance.getHTML();
          html = rawHTML || "";
          console.log("[safeGetHTML] 1차 - getHTML() 결과:", html);
        }
      } catch (e) {
        console.warn("[safeGetHTML] Failed to get raw HTML:", e);
      }
      
      // 2차: 에디터의 내부 컨테이너에서 직접 HTML 추출 시도
      if (!html) {
        try {
          const editorEl = editorInstance.getEditorElement?.();
          if (editorEl) {
            const wysiwygEl = editorEl.querySelector('.te-ww-container .te-editor');
            if (wysiwygEl) {
              html = wysiwygEl.innerHTML || "";
              console.log("[safeGetHTML] 2차 - DOM에서 추출한 HTML:", html);
            }
          }
        } catch (e) {
          console.warn("[safeGetHTML] Failed to get HTML from DOM:", e);
        }
      }
      
      // 3차: 기본 getHTML() 사용
      if (!html) {
        html = editorInstance.getHTML() || "";
        console.log("[safeGetHTML] 3차 - 기본 getHTML() 결과:", html);
      }
      
      const finalHTML = normalizeHtmlEscapes(html);
      
      // 더 강력한 wrapper div 제거 로직
      let cleanedHTML = finalHTML;
      
      // 여러 단계의 wrapper div 제거
      let previousHTML = "";
      while (cleanedHTML !== previousHTML) {
        previousHTML = cleanedHTML;
        
        // 패턴 1: <div>내용</div> (속성 없음)
        const simpleWrapperPattern = /^<div>\s*(.*)\s*<\/div>$/s;
        let match = cleanedHTML.match(simpleWrapperPattern);
        if (match && match[1]) {
          cleanedHTML = match[1].trim();
          console.log("[safeGetHTML] 단순 wrapper div 제거:", cleanedHTML);
          continue;
        }
        
        // 패턴 2: <div data-nodeid="...">내용</div> (data-nodeid만 있음)
        const nodeIdWrapperPattern = /^<div\s+data-nodeid="[^"]*">\s*(.*)\s*<\/div>$/s;
        match = cleanedHTML.match(nodeIdWrapperPattern);
        if (match && match[1]) {
          cleanedHTML = match[1].trim();
          console.log("[safeGetHTML] data-nodeid wrapper div 제거:", cleanedHTML);
          continue;
        }
        
        // 패턴 3: <div data-nodeid="..." 기타속성>내용</div> (data-nodeid + 기타 무의미한 속성)
        const complexWrapperPattern = /^<div\s+[^>]*data-nodeid="[^"]*"[^>]*>\s*(.*)\s*<\/div>$/s;
        match = cleanedHTML.match(complexWrapperPattern);
        if (match && match[1]) {
          // 실제 의미있는 속성(style, class, id 등)이 있는지 확인
          const divTagMatch = cleanedHTML.match(/^<div([^>]*)>/);
          if (divTagMatch && divTagMatch[1]) {
            const attributes = divTagMatch[1];
            // style, class, id 등의 의미있는 속성이 없으면 제거
            if (!attributes.match(/\b(style|class|id)\s*=/)) {
              cleanedHTML = match[1].trim();
              console.log("[safeGetHTML] 무의미한 속성의 wrapper div 제거:", cleanedHTML);
              continue;
            }
          }
        }
      }
      
      console.log("[safeGetHTML] 최종 HTML:", cleanedHTML);
      
      return cleanedHTML;
    } catch (error) {
      console.warn("[safeGetHTML] Failed to get HTML from editor:", error);
      try {
        return editorInstance.getMarkdown() || "";
      } catch {
        return "";
      }
    }
  };

  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance();
    if (!editorInstance) return;

    if (previousSaveFormatRef.current !== saveFormat) {
      // 저장 형식이 변경되어도 에디터 모드는 Markdown으로 유지
      // const targetMode = saveFormat === "html" ? "wysiwyg" : "markdown";
      // editorInstance.changeMode(targetMode);
      
      previousSaveFormatRef.current = saveFormat;
      if (value && value.trim() !== "") {
        // HTML 저장 형식이어도 Markdown 모드에서 HTML 태그를 텍스트로 로드
        // 이렇게 하면 div 태그가 제거되지 않고 그대로 보존됨
        editorInstance.setMarkdown(value);
      }
      return;
    }

    if (isUserTypingRef.current) return;

    if (previousValueRef.current !== value) {
      previousValueRef.current = value;
      if (value && value.trim() !== "") {
        try {
          // 저장 형식에 관계없이 항상 setMarkdown 사용
          // HTML 태그가 텍스트로 표시되어 직접 편집 가능
          const currentMarkdown = editorInstance.getMarkdown();
          if (value !== currentMarkdown) {
            editorInstance.setMarkdown(value);
          }
        } catch (e) {
          console.warn("Failed to set content:", e);
        }
      } else if (isNewPage) {
        try {
          const currentMarkdown = editorInstance.getMarkdown();
          if (currentMarkdown && currentMarkdown.trim() !== "") {
            const defaultTexts = ["write", "preview", "markdown", "wysiwyg"];
            const hasDefaultText = defaultTexts.some((text) => currentMarkdown.toLowerCase().includes(text.toLowerCase()));
            if (hasDefaultText) editorInstance.setMarkdown("");
          }
        } catch (e) {
          console.warn("Failed to clear default content:", e);
        }
      }
    }
  }, [value, saveFormat, isNewPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const editorInstance = editorRef.current?.getInstance();
      if (!editorInstance) return;

      if (value && value.trim() !== "") {
        try {
          // 저장 형식에 관계없이 항상 setMarkdown 사용
          const currentMarkdown = editorInstance.getMarkdown();
          if (value !== currentMarkdown) {
            editorInstance.setMarkdown(value);
          }
        } catch (e) {
          console.warn("Failed to set initial value:", e);
        }
      } else if (isNewPage) {
        try {
          const currentMarkdown = editorInstance.getMarkdown();
          const defaultTexts = ["write", "preview", "markdown", "wysiwyg"];
          const hasDefaultText = defaultTexts.some((text) => currentMarkdown.toLowerCase().includes(text.toLowerCase()));
          if (hasDefaultText) editorInstance.setMarkdown("");
        } catch {
          // ignore
        }
      }
    }, 1);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };
    if (isFormatDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFormatDropdownOpen]);

  const handleChange = () => {
    const editorInstance = editorRef.current?.getInstance();
    if (!editorInstance) {
      console.log("[handleChange] Editor instance not available");
      return;
    }

    isUserTypingRef.current = true;
    console.log("[handleChange] Save format:", saveFormat);
    
    // 사용자가 Markdown 모드에서 직접 HTML을 입력한 경우를 감지
    if (saveFormat === "html") {
      try {
        const markdownContent = editorInstance.getMarkdown();
        console.log("[handleChange] Markdown content:", markdownContent);
        
        // Markdown 모드에서 HTML 태그가 직접 입력된 경우
        if (markdownContent && markdownContent.includes('<') && markdownContent.includes('>')) {
          // HTML 태그가 포함된 경우 Markdown 내용을 그대로 사용
          userInputHTMLRef.current = markdownContent;
          console.log("[handleChange] 사용자 직접 입력 HTML 감지:", markdownContent);
          
          previousValueRef.current = markdownContent;
          onChange(markdownContent);
          
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 0);
          return;
        }
      } catch (e) {
        console.warn("[handleChange] Failed to get markdown content:", e);
      }
    }
    
    const next = saveFormat === "html" ? safeGetHTML(editorInstance) : editorInstance.getMarkdown();
    console.log("[handleChange] Content to save:", next);
    
    previousValueRef.current = next;
    onChange(next);

    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 0);
  };

  const handleSaveFormatChange = (format: "markdown" | "html") => {
    onSaveFormatChange?.(format);
    setIsFormatDropdownOpen(false);
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", overflow: "hidden", background: "#fff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}
      >
        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          TOAST UI Editor
          {saveFormat === "html" && (
            <span style={{ marginLeft: "0.5rem", color: "#dc2626", fontWeight: 600 }}>
              ⚠️ HTML 태그 입력 시 Markdown 모드를 사용하세요
            </span>
          )}
        </div>
        <div style={{ position: "relative" }} ref={formatDropdownRef}>
          <button
            type="button"
            onClick={() => setIsFormatDropdownOpen((v) => !v)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            저장 형식: {saveFormat === "html" ? "HTML" : "Markdown"}
          </button>
          {isFormatDropdownOpen ? (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 0.5rem)",
                width: 160,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                boxShadow: "0 10px 15px rgba(0,0,0,0.08)",
                zIndex: 50,
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => handleSaveFormatChange("markdown")}
                style={dropdownItemStyle(saveFormat === "markdown")}
              >
                Markdown
              </button>
              <button
                type="button"
                onClick={() => handleSaveFormatChange("html")}
                style={dropdownItemStyle(saveFormat === "html")}
              >
                HTML (WYSIWYG)
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Editor
        ref={editorRef}
        height={height}
        initialEditType="markdown" // 항상 Markdown 모드로 시작 (HTML 태그 직접 입력 가능)
        previewStyle="vertical"
        usageStatistics={false}
        onChange={handleChange}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock']
        ]}
        customHTMLSanitizer={(html: string) => {
          // HTML 정리를 최소화하여 div 태그와 스타일 속성 보존
          console.log("[customHTMLSanitizer] 입력 HTML:", html);
          
          // data-nodeid 속성 제거
          let cleanHTML = html.replace(/\s*data-nodeid="[^"]*"/g, '');
          
          // 연속된 wrapper div 제거 로직
          let previousHTML = "";
          let iterations = 0;
          const maxIterations = 10; // 무한루프 방지
          
          while (cleanHTML !== previousHTML && iterations < maxIterations) {
            previousHTML = cleanHTML;
            iterations++;
            
            console.log(`[customHTMLSanitizer] 반복 ${iterations}: ${cleanHTML}`);
            
            // 패턴 1: <div>내용</div> (속성 없음)
            const simpleWrapperPattern = /^<div>\s*(.*)\s*<\/div>$/s;
            let match = cleanHTML.match(simpleWrapperPattern);
            if (match && match[1] && match[1].trim()) {
              // 내용이 실제 HTML 태그로 시작하는지 확인 (단순 텍스트가 아닌)
              if (match[1].trim().startsWith('<')) {
                cleanHTML = match[1].trim();
                console.log(`[customHTMLSanitizer] 반복 ${iterations} - 단순 wrapper div 제거`);
                continue;
              }
            }
            
            // 패턴 2: <div 속성>내용</div>에서 의미없는 속성만 있는 경우
            const attributeWrapperPattern = /^<div\s+([^>]*)>\s*(.*)\s*<\/div>$/s;
            match = cleanHTML.match(attributeWrapperPattern);
            if (match && match[2] && match[2].trim()) {
              const attributes = match[1].trim();
              // style, class, id 등의 의미있는 속성이 없으면 제거
              if (!attributes.match(/\b(style|class|id|onclick|onload|href|src|alt|title)\s*=/i)) {
                if (match[2].trim().startsWith('<')) {
                  cleanHTML = match[2].trim();
                  console.log(`[customHTMLSanitizer] 반복 ${iterations} - 무의미한 속성 wrapper div 제거`);
                  continue;
                }
              }
            }
          }
          
          console.log(`[customHTMLSanitizer] 최종 결과 (${iterations}회 반복):`, cleanHTML);
          
          fullHTMLRef.current = cleanHTML;
          console.log("[customHTMLSanitizer] 저장된 완전한 HTML:", cleanHTML);
          
          return html; // 에디터에는 원본 반환 (표시용)
        }}
        hooks={{
          addImageBlobHook: async (blob: Blob, callback: (url: string, altText: string) => void) => {
            try {
              // 파일 크기 확인 (10MB 제한)
              if (blob.size > 10 * 1024 * 1024) {
                alert('이미지 크기는 10MB를 초과할 수 없습니다.');
                return;
              }

              const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type || "image/png" });
              
              // 업로드 시작 알림
              console.log('이미지 업로드 중...');
              
              const result = await uploadImage(file, { target: 'editor' });
              // 에디터 이미지는 mediumUrl이 있으면 사용, 없으면 originalUrl 사용
              const imageUrl = result.mediumUrl || result.originalUrl;
              callback(imageUrl, "image");
            } catch (e: any) {
              console.error("Image upload failed:", e);
              alert(`이미지 업로드에 실패했습니다: ${e.message || '알 수 없는 오류'}`);
            }
          },
        }}
      />
    </div>
  );
}

function dropdownItemStyle(active: boolean): React.CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    padding: "0.6rem 0.75rem",
    border: "none",
    background: active ? "#eef2ff" : "#fff",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: active ? 700 : 500,
  };
}

