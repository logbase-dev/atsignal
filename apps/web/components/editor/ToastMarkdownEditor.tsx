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
  height = "800px",
}: ToastMarkdownEditorProps) {
  const editorRef = useRef<Editor>(null);
  const isUserTypingRef = useRef(false);
  const previousValueRef = useRef<string>("");
  const previousSaveFormatRef = useRef<"markdown" | "html">(saveFormat);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

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
        return "";
      }
      const html = editorInstance.getHTML();
      return normalizeHtmlEscapes(html || "");
    } catch (error) {
      console.warn("Failed to get HTML from editor:", error);
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
      const targetMode = saveFormat === "html" ? "wysiwyg" : "markdown";
      try {
        editorInstance.changeMode(targetMode);
        previousSaveFormatRef.current = saveFormat;
        if (value && value.trim() !== "") {
          if (saveFormat === "html") {
            editorInstance.setHTML(value);
          } else {
            editorInstance.setMarkdown(value);
          }
        }
      } catch (e) {
        console.warn("Failed to change editor mode:", e);
      }
      return;
    }

    if (isUserTypingRef.current) return;

    if (previousValueRef.current !== value) {
      previousValueRef.current = value;
      if (saveFormat === "html") {
        try {
          const currentHTML = editorInstance.getHTML();
          if (value && value.trim() !== "" && value !== currentHTML) {
            editorInstance.setHTML(value);
          } else if (isNewPage && (!value || value.trim() === "") && currentHTML && currentHTML.trim() !== "") {
            editorInstance.setHTML("");
          }
        } catch (e) {
          console.warn("Failed to set HTML:", e);
        }
      } else {
        try {
          const currentMarkdown = editorInstance.getMarkdown();
          if (value && value.trim() !== "" && value !== currentMarkdown) {
            editorInstance.setMarkdown(value);
          } else if (isNewPage && (!value || value.trim() === "") && currentMarkdown && currentMarkdown.trim() !== "") {
            const defaultTexts = ["write", "preview", "markdown", "wysiwyg"];
            const hasDefaultText = defaultTexts.some((text) => currentMarkdown.toLowerCase().includes(text.toLowerCase()));
            if (hasDefaultText) editorInstance.setMarkdown("");
          }
        } catch (e) {
          console.warn("Failed to set Markdown:", e);
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
          if (saveFormat === "html") {
            const currentHTML = editorInstance.getHTML();
            if (value !== currentHTML) editorInstance.setHTML(value);
          } else {
            const currentMarkdown = editorInstance.getMarkdown();
            if (value !== currentMarkdown) editorInstance.setMarkdown(value);
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
    if (!editorInstance) return;

    isUserTypingRef.current = true;
    const next = saveFormat === "html" ? safeGetHTML(editorInstance) : editorInstance.getMarkdown();
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
        <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>TOAST UI Editor</div>
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
        initialEditType={saveFormat === "html" ? "wysiwyg" : "markdown"}
        previewStyle="vertical"
        usageStatistics={false}
        onChange={handleChange}
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


