'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getGlossaryCategories } from '@/lib/admin/glossaryCategoryService';
import { extractTitleFromUrl } from '@/lib/admin/glossaryService';
import type { Glossary, GlossaryCategory, RelatedLink } from '@/lib/admin/types';
import { NextraMarkdownField } from '@/components/editor/NextraMarkdownField';

const ToastMarkdownEditor = dynamic(
  () => import('@/components/editor/ToastMarkdownEditor').then((mod) => ({ default: mod.ToastMarkdownEditor })),
  { ssr: false },
);

interface GlossaryFormProps {
  initialGlossary?: Glossary | null;
  onSubmit: (glossaryData: {
    term: { ko: string; en?: string };
    description: { ko: string; en?: string };
    categoryId: string;
    enabled: { ko: boolean; en: boolean };
    relatedLinks?: RelatedLink[];
    editorType?: 'nextra' | 'toast';
    saveFormat?: 'markdown' | 'html';
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const requiredMark = <span style={{ color: '#dc2626' }}>*</span>;

const sectionStyle: React.CSSProperties = {
  marginBottom: '2rem',
  padding: '1.5rem',
  backgroundColor: '#f9fafb',
  borderRadius: '0.75rem',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1.5rem',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontWeight: 600,
  marginBottom: '0.5rem',
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#6b7280',
  marginBottom: '0.75rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
};

const contentTabWrapperStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: '0.25rem',
  backgroundColor: '#e2e8f0',
  borderRadius: '999px',
  padding: '0.25rem',
  marginBottom: '1rem',
};

const contentTabStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '0.5rem 1.5rem',
  borderRadius: '999px',
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#475569',
  cursor: 'pointer',
};

const contentTabActiveStyle: React.CSSProperties = {
  ...contentTabStyle,
  backgroundColor: '#ffffff',
  color: '#0f172a',
  boxShadow: '0 1px 3px rgba(15, 23, 42, 0.12)',
};

export function GlossaryForm({ initialGlossary, onSubmit, onCancel, submitting }: GlossaryFormProps) {
  const [categories, setCategories] = useState<GlossaryCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeLocale, setActiveLocale] = useState<'ko' | 'en'>('ko');
  const [editorType, setEditorType] = useState<'nextra' | 'toast'>('toast');
  const [saveFormat, setSaveFormat] = useState<'markdown' | 'html'>('markdown');
  const [formData, setFormData] = useState({
    termKo: '',
    termEn: '',
    descriptionKo: '',
    descriptionEn: '',
    categoryId: '',
    enabled: { ko: true, en: true },
    relatedLinks: [] as RelatedLink[],
  });
  const [linkInput, setLinkInput] = useState({ url: '', linkType: 'docs' as 'docs' | 'faq' | 'blog' | 'notice' });
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    if (initialGlossary) {
      setFormData({
        termKo: initialGlossary.term.ko || '',
        termEn: initialGlossary.term.en || '',
        descriptionKo: initialGlossary.description.ko || '',
        descriptionEn: initialGlossary.description.en || '',
        categoryId: initialGlossary.categoryId || '',
        enabled: initialGlossary.enabled,
        relatedLinks: initialGlossary.relatedLinks || [],
      });
      setEditorType(initialGlossary.editorType || 'toast');
      setSaveFormat(initialGlossary.saveFormat || 'markdown');
    }
  }, [initialGlossary]);

  const loadCategories = async () => {
    try {
      const data = await getGlossaryCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkInput.url.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    setLinkLoading(true);
    try {
      // URL에서 제목 추출 시도
      const title = await extractTitleFromUrl(linkInput.url, linkInput.linkType);
      
      const newLink: RelatedLink = {
        url: linkInput.url.trim(),
        title: title || undefined,
        linkType: linkInput.linkType,
      };

      setFormData((prev) => ({
        ...prev,
        relatedLinks: [...prev.relatedLinks, newLink],
      }));

      setLinkInput({ url: '', linkType: 'docs' });
    } catch (err) {
      console.error('Failed to extract title:', err);
      // 제목 추출 실패해도 링크는 추가 (수동으로 제목 입력 가능)
      const newLink: RelatedLink = {
        url: linkInput.url.trim(),
        linkType: linkInput.linkType,
      };
      setFormData((prev) => ({
        ...prev,
        relatedLinks: [...prev.relatedLinks, newLink],
      }));
      setLinkInput({ url: '', linkType: 'docs' });
    } finally {
      setLinkLoading(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      relatedLinks: prev.relatedLinks.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateLinkTitle = (index: number, title: string) => {
    setFormData((prev) => ({
      ...prev,
      relatedLinks: prev.relatedLinks.map((link, i) => (i === index ? { ...link, title } : link)),
    }));
  };

  const validate = () => {
    if (!formData.termKo.trim() || !formData.descriptionKo.trim()) {
      alert('한국어 용어명/설명은 필수입니다.');
      return false;
    }
    if (!formData.categoryId) {
      alert('카테고리를 선택해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      term: { ko: formData.termKo.trim(), ...(formData.termEn.trim() ? { en: formData.termEn.trim() } : {}) },
      description: {
        ko: formData.descriptionKo,
        ...(formData.descriptionEn ? { en: formData.descriptionEn } : {}),
      },
      categoryId: formData.categoryId,
      enabled: formData.enabled,
      relatedLinks: formData.relatedLinks.length > 0 ? formData.relatedLinks : undefined,
      editorType,
      saveFormat,
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>기본 정보</h2>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>
              카테고리 {requiredMark}
            </label>
            <p style={helpTextStyle}>용어가 속할 카테고리를 선택합니다.</p>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
              disabled={loadingCategories}
              required
              style={inputStyle}
            >
              <option value="">선택하세요</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.ko}
                  {c.name.en ? ` / ${c.name.en}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>활성화</label>
            <p style={helpTextStyle}>언어별 노출 여부를 설정합니다.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.enabled.ko}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, enabled: { ...p.enabled, ko: e.target.checked } }))
                  }
                />
                KO
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={formData.enabled.en}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, enabled: { ...p.enabled, en: e.target.checked } }))
                  }
                />
                EN
              </label>
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>용어/설명</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>에디터 타입:</span>
            <select
              value={editorType}
              onChange={(e) => setEditorType(e.target.value as 'nextra' | 'toast')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                backgroundColor: '#fff',
              }}
            >
              <option value="toast">TOAST UI Editor</option>
              <option value="nextra">Nextra</option>
            </select>
          </div>
        </div>

        <div style={contentTabWrapperStyle}>
          <button
            type="button"
            style={activeLocale === 'ko' ? contentTabActiveStyle : contentTabStyle}
            onClick={() => setActiveLocale('ko')}
          >
            KO
          </button>
          <button
            type="button"
            style={activeLocale === 'en' ? contentTabActiveStyle : contentTabStyle}
            onClick={() => setActiveLocale('en')}
          >
            EN
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>
            용어명 {activeLocale === 'ko' ? requiredMark : null}
          </label>
          <p style={helpTextStyle}>현재 언어({activeLocale.toUpperCase()}) 기준 용어명을 입력합니다.</p>
          <input
            required={activeLocale === 'ko'}
            style={inputStyle}
            value={activeLocale === 'ko' ? formData.termKo : formData.termEn}
            onChange={(e) =>
              setFormData((p) =>
                activeLocale === 'ko' ? { ...p, termKo: e.target.value } : { ...p, termEn: e.target.value },
              )
            }
          />
        </div>

        <div>
          <label style={labelStyle}>
            설명 {activeLocale === 'ko' ? requiredMark : null}
          </label>
          <p style={helpTextStyle}>현재 언어({activeLocale.toUpperCase()}) 기준 설명을 입력합니다.</p>

          {editorType === 'nextra' ? (
            <NextraMarkdownField
              id={`description-${activeLocale}`}
              label={`설명 (${activeLocale.toUpperCase()})`}
              locale={activeLocale}
              required={activeLocale === 'ko'}
              value={activeLocale === 'ko' ? formData.descriptionKo : formData.descriptionEn}
              onChange={(next) =>
                setFormData((p) =>
                  activeLocale === 'ko' ? { ...p, descriptionKo: next } : { ...p, descriptionEn: next },
                )
              }
            />
          ) : (
            <ToastMarkdownEditor
              value={activeLocale === 'ko' ? formData.descriptionKo : formData.descriptionEn}
              onChange={(next) =>
                setFormData((p) =>
                  activeLocale === 'ko' ? { ...p, descriptionKo: next } : { ...p, descriptionEn: next },
                )
              }
              saveFormat={saveFormat}
              onSaveFormatChange={setSaveFormat}
              isNewPage={!initialGlossary}
            />
          )}
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>관련 문서 링크</h2>
        <p style={helpTextStyle}>관련 문서나 FAQ, 블로그, 공지사항 링크를 추가할 수 있습니다.</p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={linkInput.url}
            onChange={(e) => setLinkInput((p) => ({ ...p, url: e.target.value }))}
            placeholder="URL 입력 (예: /docs/ko/getting-started, /faq/123)"
            style={{ flex: 1, ...inputStyle }}
          />
          <select
            value={linkInput.linkType}
            onChange={(e) => setLinkInput((p) => ({ ...p, linkType: e.target.value as any }))}
            style={{ ...inputStyle, width: 'auto', minWidth: '120px' }}
          >
            <option value="docs">docs</option>
            <option value="faq">faq</option>
            <option value="blog">blog</option>
            <option value="notice">notice</option>
          </select>
          <button
            type="button"
            onClick={() => void handleAddLink()}
            disabled={linkLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: linkLoading ? '#9ca3af' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: linkLoading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {linkLoading ? '추가 중...' : '링크 추가'}
          </button>
        </div>

        {formData.relatedLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {formData.relatedLinks.map((link, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={link.title || ''}
                      onChange={(e) => handleUpdateLinkTitle(index, e.target.value)}
                      placeholder="제목 (자동 추출 또는 수동 입력)"
                      style={{ ...inputStyle, marginBottom: '0.25rem' }}
                    />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {link.url} ({link.linkType})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: submitting ? '#9ca3af' : '#2563eb',
            color: '#fff',
            cursor: submitting ? 'not-allowed' : 'pointer',
            minWidth: '130px',
          }}
        >
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}

