'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { getFAQCategories } from '@/lib/admin/faqCategoryService';
import { getAllTags } from '@/lib/admin/faqService';
import type { FAQ, FAQCategory } from '@/lib/admin/types';
import { NextraMarkdownField } from '@/components/editor/NextraMarkdownField';

const ToastMarkdownEditor = dynamic(
  () => import('@/components/editor/ToastMarkdownEditor').then((mod) => ({ default: mod.ToastMarkdownEditor })),
  { ssr: false },
);

interface FAQFormProps {
  initialFAQ?: FAQ | null;
  onSubmit: (faqData: {
    question: { ko: string; en?: string };
    answer: { ko: string; en?: string };
    categoryId?: string;
    level: number;
    isTop: boolean;
    enabled: { ko: boolean; en: boolean };
    tags?: string[];
    order?: number;
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

export function FAQForm({ initialFAQ, onSubmit, onCancel, submitting }: FAQFormProps) {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [activeLocale, setActiveLocale] = useState<'ko' | 'en'>('ko');
  const [editorType, setEditorType] = useState<'nextra' | 'toast'>('toast');
  const [saveFormat, setSaveFormat] = useState<'markdown' | 'html'>('markdown');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const isComposingRef = useRef(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    level: 999,
    isTop: false,
    enabled: { ko: true, en: true },
    tags: [] as string[],
    questionKo: '',
    questionEn: '',
    answerKo: '',
    answerEn: '',
    order: 0,
  });

  useEffect(() => {
    void loadCategories();
    void loadAllTags();
  }, []);

  useEffect(() => {
    if (initialFAQ) {
      setFormData({
        categoryId: initialFAQ.categoryId || '',
        level: initialFAQ.level,
        isTop: initialFAQ.isTop,
        enabled: initialFAQ.enabled,
        tags: initialFAQ.tags || [],
        questionKo: initialFAQ.question.ko,
        questionEn: initialFAQ.question.en || '',
        answerKo: initialFAQ.answer.ko,
        answerEn: initialFAQ.answer.en || '',
        order: initialFAQ.order || 0,
      });
      setEditorType(initialFAQ.editorType || 'toast');
      setSaveFormat(initialFAQ.saveFormat || 'markdown');
    } else {
      setEditorType('toast');
      setSaveFormat('markdown');
    }
  }, [initialFAQ]);

  const loadCategories = async () => {
    try {
      const data = await getFAQCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadAllTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (formData.tags.includes(trimmedTag)) return;
    setFormData((p) => ({ ...p, tags: [...p.tags, trimmedTag] }));
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((p) => ({ ...p, tags: p.tags.filter((t) => t !== tagToRemove) }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposingRef.current) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(Boolean(value.trim()));
  };

  const filteredSuggestions = allTags
    .filter((tag) => tag.toLowerCase().includes(tagInput.toLowerCase()))
    .filter((tag) => !formData.tags.includes(tag))
    .slice(0, 10);

  const validate = () => {
    const question = activeLocale === 'ko' ? formData.questionKo : formData.questionEn;
    const answer = activeLocale === 'ko' ? formData.answerKo : formData.answerEn;
    if (!formData.questionKo.trim() || !formData.answerKo.trim()) {
      alert('한국어 질문/답변은 필수입니다.');
      return false;
    }
    if (!question.trim() || !answer.trim()) {
      alert('현재 선택한 언어의 질문/답변을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      question: { ko: formData.questionKo.trim(), ...(formData.questionEn.trim() ? { en: formData.questionEn.trim() } : {}) },
      answer: { ko: formData.answerKo, ...(formData.answerEn ? { en: formData.answerEn } : {}) },
      categoryId: formData.categoryId || undefined,
      level: Number(formData.level),
      isTop: Boolean(formData.isTop),
      enabled: formData.enabled,
      tags: formData.tags.length ? formData.tags : undefined,
      order: Number(formData.order) || 0,
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
            <label style={labelStyle}>카테고리</label>
            <p style={helpTextStyle}>FAQ가 속할 카테고리를 선택합니다. (선택사항)</p>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
              disabled={loadingCategories}
              style={inputStyle}
            >
              <option value="">미분류</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.ko}
                  {c.name.en ? ` / ${c.name.en}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Level</label>
            <p style={helpTextStyle}>낮을수록 상단에 노출됩니다. (기본 999)</p>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData((p) => ({ ...p, level: Number(e.target.value) }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>맨 상위</label>
            <p style={helpTextStyle}>⭐ 맨 상위 표시 여부</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={formData.isTop} onChange={(e) => setFormData((p) => ({ ...p, isTop: e.target.checked }))} />
              맨 상위로 고정
            </label>
          </div>
          <div>
            <label style={labelStyle}>활성화</label>
            <p style={helpTextStyle}>언어별 노출 여부를 설정합니다.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={formData.enabled.ko} onChange={(e) => setFormData((p) => ({ ...p, enabled: { ...p.enabled, ko: e.target.checked } }))} />
                KO
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={formData.enabled.en} onChange={(e) => setFormData((p) => ({ ...p, enabled: { ...p.enabled, en: e.target.checked } }))} />
                EN
              </label>
            </div>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>질문/답변</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>에디터 타입:</span>
            <select
              value={editorType}
              onChange={(e) => setEditorType(e.target.value as 'nextra' | 'toast')}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', fontSize: '0.9rem', backgroundColor: '#fff' }}
            >
              <option value="toast">TOAST UI Editor</option>
              <option value="nextra">Nextra</option>
            </select>
          </div>
        </div>

        <div style={contentTabWrapperStyle}>
          <button type="button" style={activeLocale === 'ko' ? contentTabActiveStyle : contentTabStyle} onClick={() => setActiveLocale('ko')}>
            KO
          </button>
          <button type="button" style={activeLocale === 'en' ? contentTabActiveStyle : contentTabStyle} onClick={() => setActiveLocale('en')}>
            EN
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>
              질문 {requiredMark}
            </label>
            <p style={helpTextStyle}>현재 언어({activeLocale.toUpperCase()}) 기준 질문을 입력합니다.</p>
            <input
              required={activeLocale === 'ko'}
              style={inputStyle}
              value={activeLocale === 'ko' ? formData.questionKo : formData.questionEn}
              onChange={(e) =>
                setFormData((p) =>
                  activeLocale === 'ko' ? { ...p, questionKo: e.target.value } : { ...p, questionEn: e.target.value },
                )
              }
            />
          </div>
          <div>
            <label style={labelStyle}>정렬(order)</label>
            <p style={helpTextStyle}>같은 level 내 정렬용 숫자입니다.</p>
            <input type="number" value={formData.order} onChange={(e) => setFormData((p) => ({ ...p, order: Number(e.target.value) }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <label style={labelStyle}>
            답변 {activeLocale === 'ko' ? requiredMark : null}
          </label>
          <p style={helpTextStyle}>현재 언어({activeLocale.toUpperCase()}) 기준 답변을 입력합니다.</p>

          {editorType === 'nextra' ? (
            <NextraMarkdownField
              id={`answer-${activeLocale}`}
              label={`답변 (${activeLocale.toUpperCase()})`}
              locale={activeLocale}
              required={activeLocale === 'ko'}
              value={activeLocale === 'ko' ? formData.answerKo : formData.answerEn}
              onChange={(next) =>
                setFormData((p) => (activeLocale === 'ko' ? { ...p, answerKo: next } : { ...p, answerEn: next }))
              }
            />
          ) : (
            <ToastMarkdownEditor
              value={activeLocale === 'ko' ? formData.answerKo : formData.answerEn}
              onChange={(next) =>
                setFormData((p) => (activeLocale === 'ko' ? { ...p, answerKo: next } : { ...p, answerEn: next }))
              }
              saveFormat={saveFormat}
              onSaveFormatChange={setSaveFormat}
              isNewPage={!initialFAQ}
            />
          )}
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>태그</h2>
        <p style={helpTextStyle}>쉼표(,) 또는 Enter로 태그를 추가합니다.</p>
        <div style={{ position: 'relative' }}>
          <input
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
              setIsComposing(true);
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
              setIsComposing(false);
            }}
            placeholder="태그 입력..."
            style={inputStyle}
          />
          {showTagSuggestions && filteredSuggestions.length > 0 ? (
            <div style={{ position: 'absolute', top: 'calc(100% + 0.25rem)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', zIndex: 20, overflow: 'hidden' }}>
              {filteredSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', border: 'none', background: '#fff', cursor: 'pointer' }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {formData.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
            >
              #{tag} ✕
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}>
          취소
        </button>
        <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: submitting ? '#9ca3af' : '#2563eb', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', minWidth: '130px' }}>
          {submitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}


