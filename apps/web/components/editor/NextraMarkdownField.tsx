'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { uploadImage } from '@/lib/admin/imageUpload';

type EditorMode = 'write' | 'preview';

interface NextraMarkdownFieldProps {
  id: string;
  label: string;
  locale: string;
  value: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  onChange: (nextValue: string) => void;
  height?: string;
}

export function NextraMarkdownField({
  id,
  label,
  locale,
  value,
  required,
  helperText,
  placeholder = '# 제목\n본문을 작성하세요.',
  onChange,
  height = '800px',
}: NextraMarkdownFieldProps) {
  const [mode, setMode] = useState<EditorMode>('write');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewHtml = useMemo(() => markdownToHtml(value), [value]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await uploadImage(file, { maxWidth: 800, target: 'editor' });
      // 에디터 이미지는 mediumUrl이 있으면 사용, 없으면 originalUrl 사용
      const imageUrl = result.mediumUrl || result.originalUrl;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const imageMarkdown = `![이미지](${imageUrl})\n`;
        const newValue = value.substring(0, start) + imageMarkdown + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.focus();
          const newCursorPos = start + imageMarkdown.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } else {
        onChange(value + `\n![이미지](${imageUrl})\n`);
      }
    } catch (error: any) {
      console.error('이미지 업로드 실패:', error);
      alert(`이미지 업로드 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
  };

  const editorShellStyleWithHeight: CSSProperties = { ...editorShellStyle, minHeight: height };
  const textareaStyleWithHeight: CSSProperties = { ...textareaStyle, minHeight: height };
  const previewStyleWithHeight: CSSProperties = { ...previewStyle, minHeight: height };

  return (
    <section style={wrapperStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={badgeStyle}>{locale.toUpperCase()}</span>
          <label htmlFor={id} style={titleStyle}>
            {label}
            {required ? <span style={requiredStyle}>*</span> : null}
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {mode === 'write' ? (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: '#2563eb',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '0.5rem',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  opacity: isUploading ? 0.6 : 1,
                }}
              >
                {isUploading ? '업로드 중...' : '📷 이미지 추가'}
              </button>
            </>
          ) : null}
          <div style={tabGroupStyle}>
            <button type="button" onClick={() => setMode('write')} style={mode === 'write' ? tabActiveStyle : tabStyle}>
              Write
            </button>
            <button type="button" onClick={() => setMode('preview')} style={mode === 'preview' ? tabActiveStyle : tabStyle}>
              Preview
            </button>
          </div>
        </div>
      </header>
      {helperText ? <p style={helperStyle}>{helperText}</p> : null}

      {mode === 'write' ? (
        <div style={editorShellStyleWithHeight} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <textarea
            ref={textareaRef}
            id={id}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            value={value}
            placeholder={placeholder}
            style={textareaStyleWithHeight}
          />
        </div>
      ) : (
        <div style={previewStyleWithHeight}>
          {value.trim() ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p style={{ color: '#9ca3af', margin: 0 }}>내용이 없습니다.</p>}
        </div>
      )}
    </section>
  );
}

function markdownToHtml(markdown: string) {
  if (!markdown.trim()) return '';
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim());
  return blocks
    .map((block) => {
      if (!block) return '';
      if (/^```/.test(block)) {
        const code = block.replace(/^```.*\n?/, '').replace(/```$/, '');
        return `<pre style="background:#f3f4f6;border:1px solid #d1d5db;color:#111827;padding:1rem;border-radius:0.75rem;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:0.875rem;line-height:1.5;"><code>${escapeHtml(code)}</code></pre>`;
      }
      if (/^#{1,6}\s/.test(block)) {
        const level = (block.match(/^#+/)?.[0].length ?? 1).toString();
        const text = block.replace(/^#{1,6}\s*/, '');
        return `<h${level} style="margin:1rem 0 0.5rem;font-weight:700;">${formatInline(text)}</h${level}>`;
      }
      if (block.split('\n').every((line) => /^[-*]\s+/.test(line))) {
        const items = block
          .split('\n')
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .map((item) => `<li>${formatInline(item)}</li>`)
          .join('');
        return `<ul style="padding-left:1.25rem;margin:0.5rem 0;">${items}</ul>`;
      }
      if (block.split('\n').every((line) => /^\d+\.\s+/.test(line))) {
        const items = block
          .split('\n')
          .map((line) => line.replace(/^\d+\.\s+/, '').trim())
          .map((item) => `<li>${formatInline(item)}</li>`)
          .join('');
        return `<ol style="padding-left:1.25rem;margin:0.5rem 0;">${items}</ol>`;
      }
      if (/^>\s?/.test(block)) {
        const text = block.replace(/^>\s?/, '');
        return `<blockquote style="border-left:4px solid #dbeafe;padding-left:1rem;margin:0.75rem 0;color:#475569;">${formatInline(text)}</blockquote>`;
      }
      return `<p style="margin:0.5rem 0;line-height:1.6;">${formatInline(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

function formatInline(text: string) {
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:0.1rem 0.35rem;border-radius:0.35rem;">$1</code>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:#2563eb;">$1</a>');
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:0.5rem;margin:0.5rem 0;" loading="lazy" />');
  return formatted;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const wrapperStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  padding: '1.25rem',
  borderRadius: '1rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const badgeStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#1d4ed8',
  backgroundColor: '#dbeafe',
  padding: '0.1rem 0.5rem',
  borderRadius: '999px',
};

const titleStyle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};

const requiredStyle: CSSProperties = { color: '#dc2626' };

const tabGroupStyle: CSSProperties = {
  display: 'inline-flex',
  gap: '0.25rem',
  backgroundColor: '#f1f5f9',
  borderRadius: '999px',
  padding: '0.15rem',
};

const tabStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '0.3rem 0.9rem',
  borderRadius: '999px',
  fontSize: '0.9rem',
  fontWeight: 500,
  color: '#475569',
  cursor: 'pointer',
};

const tabActiveStyle: CSSProperties = {
  ...tabStyle,
  backgroundColor: '#ffffff',
  color: '#0f172a',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
};

const helperStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#6b7280',
};

const editorShellStyle: CSSProperties = {
  position: 'relative',
  borderRadius: '0.75rem',
  border: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  minHeight: '500px',
};

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: '800px',
  padding: '1rem',
  border: 'none',
  outline: 'none',
  resize: 'vertical',
  fontFamily:
    'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace)',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  backgroundColor: 'transparent',
  color: '#0f172a',
};

const previewStyle: CSSProperties = {
  borderRadius: '0.75rem',
  border: '1px solid #e2e8f0',
  backgroundColor: '#fff',
  padding: '1rem',
  minHeight: '500px',
  color: '#0f172a',
};


