"use client";

import "@toast-ui/editor/dist/toastui-editor.css";
import { Editor } from "@toast-ui/react-editor";
import { ForwardedRef, useRef, useEffect, useState } from "react";
import { uploadImage } from '@/lib/imageUpload';

interface ToastMarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  saveFormat?: 'markdown' | 'html';
  onSaveFormatChange?: (format: 'markdown' | 'html') => void;
  isNewPage?: boolean; // 페이지 추가 모드인지 여부
  height?: string; // height prop 추가
}

export function ToastMarkdownEditor({
  value,
  onChange,
  saveFormat = 'markdown',
  onSaveFormatChange,
  isNewPage = false, // 기본값은 false (수정 모드)
  height = '800px', // 기본값 설정
}: ToastMarkdownEditorProps) {
  const editorRef = useRef<Editor>(null);
  const isUserTypingRef = useRef(false);
  const previousValueRef = useRef<string>(''); // 이전 value 추적
  const previousSaveFormatRef = useRef<'markdown' | 'html'>(saveFormat);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // HTML 이스케이프 정규화 함수: 중복된 &amp;를 정규화
  const normalizeHtmlEscapes = (html: string): string => {
    if (!html) return html;
    
    // &amp;가 반복되는 모든 패턴을 찾아서 &amp;로 정규화
    // &amp;amp; -> &amp;
    // &amp;amp;amp; -> &amp;
    // 등등...
    let normalized = html;
    let previous = '';
    
    // 반복적으로 정규화하여 모든 중복을 제거
    while (normalized !== previous) {
      previous = normalized;
      // &amp;amp;를 &amp;로 변환
      normalized = normalized.replace(/&amp;amp;/g, '&amp;');
    }
    
    return normalized;
  };

  // getHTML을 안전하게 호출하는 헬퍼 함수
  const safeGetHTML = (editorInstance: any): string => {
    try {
      // 에디터가 완전히 초기화되었는지 확인
      if (!editorInstance || typeof editorInstance.getHTML !== 'function') {
        return '';
      }
      const html = editorInstance.getHTML();
      
      // 중복 이스케이프 정규화
      return normalizeHtmlEscapes(html || '');
    } catch (error) {
      console.warn('Failed to get HTML from editor:', error);
      // HTML을 가져오는 데 실패하면 마크다운을 반환
      try {
        return editorInstance.getMarkdown() || '';
      } catch {
        return '';
      }
    }
  };

  // 에디터 마운트 후 초기화 및 value 설정
  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance();
    if (!editorInstance) {
      return;
    }

    // saveFormat에 따라 모드 변경 (saveFormat이 변경되었을 때)
    if (previousSaveFormatRef.current !== saveFormat) {
      const targetMode = saveFormat === 'html' ? 'wysiwyg' : 'markdown';
      try {
        editorInstance.changeMode(targetMode);
        previousSaveFormatRef.current = saveFormat;
        
        // 모드 변경 후 value 설정 (모드 변경 직후)
        if (value && value.trim() !== '') {
          if (saveFormat === 'html') {
            editorInstance.setHTML(value);
          } else {
            editorInstance.setMarkdown(value);
          }
        }
      } catch (e) {
        console.warn('Failed to change editor mode:', e);
      }
      return; // 모드 변경 시 여기서 종료
    }

    // 사용자가 입력 중이면 에디터를 업데이트하지 않음
    if (isUserTypingRef.current) {
      return;
    }

    // value가 변경되었을 때만 업데이트 (외부에서 변경된 경우)
    if (previousValueRef.current !== value) {
      previousValueRef.current = value;

      if (saveFormat === 'html') {
        try {
          const currentHTML = editorInstance.getHTML();
          if (value && value.trim() !== '' && value !== currentHTML) {
            // 수정 모드: value가 있으면 설정
            editorInstance.setHTML(value);
          } else if (isNewPage && (!value || value.trim() === '') && currentHTML && currentHTML.trim() !== '') {
            // 새 페이지일 때만: 에디터에 기본 텍스트가 있으면 비우기
            editorInstance.setHTML('');
          }
        } catch (e) {
          console.warn('Failed to set HTML:', e);
        }
      } else {
        try {
          const currentMarkdown = editorInstance.getMarkdown();
          if (value && value.trim() !== '' && value !== currentMarkdown) {
            // 수정 모드: value가 있으면 설정
            editorInstance.setMarkdown(value);
          } else if (isNewPage && (!value || value.trim() === '') && currentMarkdown && currentMarkdown.trim() !== '') {
            // 새 페이지일 때만: 에디터에 기본 텍스트가 있으면 비우기
            const defaultTexts = ['write', 'preview', 'markdown', 'wysiwyg'];
            const hasDefaultText = defaultTexts.some(text => 
              currentMarkdown.toLowerCase().includes(text.toLowerCase())
            );
            if (hasDefaultText) {
              editorInstance.setMarkdown('');
            }
          }
        } catch (e) {
          console.warn('Failed to set Markdown:', e);
        }
      }
    }
  }, [value, saveFormat, isNewPage]);

  // 에디터 초기 마운트 시 value 설정 및 기본 텍스트 제거 (한 번만)
  useEffect(() => {
    const timer = setTimeout(() => {
      const editorInstance = editorRef.current?.getInstance();
      if (!editorInstance) return;

      // 초기 마운트 시 value 설정
      if (value && value.trim() !== '') {
        try {
          if (saveFormat === 'html') {
            const currentHTML = editorInstance.getHTML();
            if (value !== currentHTML) {
              editorInstance.setHTML(value);
            }
          } else {
            const currentMarkdown = editorInstance.getMarkdown();
            if (value !== currentMarkdown) {
              editorInstance.setMarkdown(value);
            }
          }
        } catch (e) {
          console.warn('Failed to set initial value:', e);
        }
      } else if (isNewPage) {
        // 새 페이지일 때만 기본 텍스트 제거 (더 빠르게)
        try {
          const currentMarkdown = editorInstance.getMarkdown();
          const defaultTexts = ['write', 'preview', 'markdown', 'wysiwyg'];
          const hasDefaultText = defaultTexts.some(text => 
            currentMarkdown.toLowerCase().includes(text.toLowerCase())
          );
          if (hasDefaultText) {
            editorInstance.setMarkdown('');
          }
        } catch (e) {
          // 무시
        }
      }
    }, 1); // 300ms에서 100ms로 줄임

    return () => clearTimeout(timer);
  }, []); // 마운트 시 한 번만

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };

    if (isFormatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFormatDropdownOpen]);

  const handleFormatChange = (format: 'markdown' | 'html') => {
    onSaveFormatChange?.(format);
    setIsFormatDropdownOpen(false);
    
    const editorInstance = editorRef.current?.getInstance();
    if (editorInstance) {
      const targetMode = format === 'html' ? 'wysiwyg' : 'markdown';
      editorInstance.changeMode(targetMode); // 탭 클릭 시 저장 형식 자동 변경
      
      const content = format === 'html' 
        ? safeGetHTML(editorInstance)
        : editorInstance.getMarkdown();
      onChange(content || "");
    }
  };

  return (
    <div>
      <Editor
        ref={editorRef as ForwardedRef<Editor>}
        initialValue={value || ""}
        previewStyle="vertical"
        height={height} // prop 사용
        initialEditType={saveFormat === 'html' ? 'wysiwyg' : 'markdown'}
        useCommandShortcut={true}
        onChange={() => {
          const editorInstance = editorRef.current?.getInstance();
          if (!editorInstance) return;
          
          isUserTypingRef.current = true;
          
          const content = saveFormat === 'html' 
            ? safeGetHTML(editorInstance)
            : editorInstance.getMarkdown();
          onChange(content || "");
          
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 100);
        }}
        hideModeSwitch={false}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync'],
        ]}
        hooks={{
          addImageBlobHook: async (blob: Blob, callback: (url: string, alt?: string) => void) => {
            try {
              const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type });
              const { mediumUrl } = await uploadImage(file, { maxWidth: 800 });
              callback(mediumUrl);
            } catch (error: any) {
              console.error('이미지 업로드 실패:', error);
              alert(`이미지 업로드 실패: ${error.message}`);
            }
          },
          // 탭 클릭 시 저장 형식 자동 변경 - 이 기능을 추가하는지는 고민이 필요함. 이기능이 있으면 하단데 저장 형식이 보일 필요가 없어짐.
          changeMode: (mode: string) => {
            const editorInstance = editorRef.current?.getInstance();
            if (!editorInstance || !onSaveFormatChange) return;
            
            // 모드가 변경되면 저장 형식도 자동으로 변경
            if (mode === 'wysiwyg') {
              // WYSIWYG 모드 선택 시 → HTML 저장 형식으로 변경
              onSaveFormatChange('html');
              previousSaveFormatRef.current = 'html';
            } else if (mode === 'markdown') {
              // Markdown 모드 선택 시 → Markdown 저장 형식으로 변경
              onSaveFormatChange('markdown');
              previousSaveFormatRef.current = 'markdown';
            }
          },
        }}
      />
      {/* display: 'none' : 저장형식 드롭다운 숨기기, 탭 클릭 시 저장 형식 자동 변경 기능 때문에 필요없음. */}
      {/* display: 'flex' : 저장형식 드롭다운 보이기, 탭 클릭 시 저장 형식 자동 변경 기능 때문에 필요없음. */}
      <div style={{ marginTop: '0.75rem', display: 'none', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.85rem', color: '#6b7280' }}>저장 형식:</label>
        <div ref={formatDropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              fontSize: '0.85rem',
              backgroundColor: saveFormat === 'markdown' ? '#dbeafe' : '#fef3c7',
              color: saveFormat === 'markdown' ? '#1e40af' : '#92400e',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{saveFormat === 'markdown' ? 'Markdown' : 'HTML'}</span>
            <span style={{ fontSize: '0.7rem' }}>▼</span>
          </button>
          {isFormatDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.25rem',
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                minWidth: '120px',
              }}
            >
              <button
                type="button"
                onClick={() => handleFormatChange('markdown')}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  backgroundColor: saveFormat === 'markdown' ? '#dbeafe' : '#fff',
                  color: saveFormat === 'markdown' ? '#1e40af' : '#374151',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: saveFormat === 'markdown' ? 600 : 400,
                  borderTopLeftRadius: '0.5rem',
                  borderTopRightRadius: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  if (saveFormat !== 'markdown') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (saveFormat !== 'markdown') {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                Markdown
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('html')}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  backgroundColor: saveFormat === 'html' ? '#fef3c7' : '#fff',
                  color: saveFormat === 'html' ? '#92400e' : '#374151',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: saveFormat === 'html' ? 600 : 400,
                  borderBottomLeftRadius: '0.5rem',
                  borderBottomRightRadius: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  if (saveFormat !== 'html') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (saveFormat !== 'html') {
                    e.currentTarget.style.backgroundColor = '#fff';
                  }
                }}
              >
                HTML
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

