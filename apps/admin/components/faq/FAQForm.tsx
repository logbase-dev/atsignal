'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getFAQCategories } from '@/lib/admin/faqCategoryService';
import { getAllTags } from '@/lib/admin/faqService';
import type { FAQ, FAQCategory } from '@/lib/admin/types';
import { NextraMarkdownField } from '@/components/editor/NextraMarkdownField';

// SSR 비활성화하여 동적 import
const ToastMarkdownEditor = dynamic(
  () => import('@/components/editor/ToastMarkdownEditor').then((mod) => ({ default: mod.ToastMarkdownEditor })),
  { ssr: false }
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
  const [isComposing, setIsComposing] = useState(false); // 한글 입력 중인지 추적하는 상태 추가
  const [formData, setFormData] = useState({
    categoryId: '',
    level: 999,
    isTop: false,
    enabled: {
      ko: true,
      en: true,
    },
    tags: [] as string[],
    questionKo: '',
    questionEn: '',
    answerKo: '',
    answerEn: '',
    order: 0,
  });
  const [showFormatTooltip, setShowFormatTooltip] = useState(false);

  useEffect(() => {
    loadCategories();
    loadAllTags();
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
      // 에디터 타입과 저장 형식 로드
      setEditorType(initialFAQ.editorType || 'toast');
      setSaveFormat(initialFAQ.saveFormat || 'markdown');
    } else {
      // 새 FAQ일 때 기본값 설정
      setEditorType('toast');
      setSaveFormat('markdown');
    }
  }, [initialFAQ]);

  const loadCategories = async () => {
    try {
      const data = await getFAQCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadAllTags = async () => {
    try {
      const tags = await getAllTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // 태그 추가 함수
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    
    // 중복 체크
    if (formData.tags.includes(trimmedTag)) return;
    
    setFormData({
      ...formData,
      tags: [...formData.tags, trimmedTag],
    });
    setTagInput('');
    setShowTagSuggestions(false);
  };

  // 태그 제거 함수
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  // 태그 입력 처리
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 입력 중일 때는 엔터 처리를 하지 않음
    if (isComposing) {
      return;
    }

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        addTag(tagInput);
      }
    } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      // 백스페이스로 마지막 태그 제거
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  // 태그 입력 변경 처리
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.trim().length > 0);
  };

  // 자동완성 필터링된 태그 목록
  const filteredTags = tagInput.trim()
    ? allTags.filter((tag) => 
        tag.toLowerCase().includes(tagInput.toLowerCase()) && 
        !formData.tags.includes(tag)
      )
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.questionKo.trim()) {
      alert('질문(한국어)을 입력해주세요.');
      return;
    }

    if (!formData.answerKo.trim()) {
      alert('답변(한국어)을 입력해주세요.');
      return;
    }

    await onSubmit({
      question: {
        ko: formData.questionKo.trim(),
        ...(formData.questionEn.trim() ? { en: formData.questionEn.trim() } : {}),
      },
      answer: {
        ko: formData.answerKo.trim(),
        ...(formData.answerEn.trim() ? { en: formData.answerEn.trim() } : {}),
      },
      categoryId: formData.categoryId || undefined,
      level: formData.level,
      isTop: formData.isTop,
      enabled: formData.enabled,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      order: formData.order,
      editorType,
      saveFormat: editorType === 'nextra' ? 'markdown' : saveFormat,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 기본 설정 섹션 */}
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>기본 설정</h2>

        <div style={rowStyle}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>
              카테고리
            </label>
            <p style={helpTextStyle}>FAQ가 속할 카테고리를 선택합니다. (선택사항)</p>
            {loadingCategories ? (
              <p>카테고리 로딩 중...</p>
            ) : (
              <select
                style={inputStyle}
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">카테고리를 선택하세요 (선택사항)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name.ko}
                    {category.name.en && ` / ${category.name.en}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Level</label>
            <p style={helpTextStyle}>우선순위 레벨입니다. 낮을수록 높은 우선순위를 가집니다. (기본값: 999)</p>
            <input
              type="number"
              style={inputStyle}
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 999 })}
              min="0"
            />
          </div>
        </div>

        {/* 해시태그 입력 */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <label style={labelStyle}>해시태그</label>
          <p style={helpTextStyle}>
            FAQ에 태그를 추가하여 분류할 수 있습니다. 쉼표(,) 또는 엔터로 구분하여 입력하세요.
          </p>
          
          {/* 입력된 태그 표시 */}
          {formData.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.375rem 0.75rem',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      lineHeight: 1,
                      padding: 0,
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label={`${tag} 태그 제거`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 태그 입력 필드 */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              style={inputStyle}
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagInputKeyDown}
              onCompositionStart={() => setIsComposing(true)} // 한글 입력 시작
              onCompositionEnd={() => setIsComposing(false)} // 한글 입력 종료
              onBlur={() => {
                // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록
                setTimeout(() => setShowTagSuggestions(false), 200);
              }}
              onFocus={() => {
                if (tagInput.trim()) {
                  setShowTagSuggestions(true);
                }
              }}
              placeholder="태그를 입력하세요 (쉼표 또는 엔터로 구분)"
            />

            {/* 자동완성 제안 */}
            {showTagSuggestions && filteredTags.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.25rem',
                  backgroundColor: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {filteredTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#374151',
                    }}
                    onMouseDown={(e) => {
                      // onBlur보다 먼저 실행되도록
                      e.preventDefault();
                      addTag(tag);
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 기존 태그 힌트 */}
          {allTags.length > 0 && formData.tags.length === 0 && tagInput === '' && (
            <p style={{ ...helpTextStyle, marginTop: '0.5rem', fontSize: '0.8rem' }}>
              기존 태그: {allTags.slice(0, 10).map((tag) => `#${tag}`).join(', ')}
              {allTags.length > 10 && ` 외 ${allTags.length - 10}개`}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isTop}
              onChange={(e) => setFormData({ ...formData, isTop: e.target.checked })}
            />
            맨 상위 표시
          </label>
          <p style={helpTextStyle}>체크하면 FAQ 목록의 맨 위에 고정 표시됩니다.</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>활성화 상태</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.enabled.ko}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    enabled: { ...formData.enabled, ko: e.target.checked },
                  })
                }
              />
              한국어 활성화
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.enabled.en}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    enabled: { ...formData.enabled, en: e.target.checked },
                  })
                }
              />
              영어 활성화
            </label>
          </div>
        </div>
      </div>

      {/* 콘텐츠 섹션 */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>콘텐츠</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>에디터 타입:</span>
            <select
              value={editorType}
              onChange={(e) => {
                const newType = e.target.value as 'nextra' | 'toast';
                const message = '에디터를 전환하면 현재 입력된 내용이 그대로 유지됩니다.\n\n⚠️ 주의사항:\n- 에디터 간 호환성 문제가 발생할 수 있습니다.\n- 전환 후 반드시 내용을 확인하세요.\n\n계속하시겠습니까?';
                if (window.confirm(message)) {
                  setEditorType(newType);
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontSize: '0.9rem',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="toast">TOAST UI Editor</option>
              <option value="nextra">Nextra</option>
            </select>
          </div>
        </div>

        {/* 언어 탭 */}
        <div style={contentTabWrapperStyle}>
          <button
            type="button"
            style={activeLocale === 'ko' ? contentTabActiveStyle : contentTabStyle}
            onClick={() => setActiveLocale('ko')}
          >
            한국어
          </button>
          <button
            type="button"
            style={activeLocale === 'en' ? contentTabActiveStyle : contentTabStyle}
            onClick={() => setActiveLocale('en')}
          >
            English
          </button>
        </div>

        {/* 질문 입력 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>
            질문 {activeLocale === 'ko' && requiredMark}
          </label>
          <p style={helpTextStyle}>
            {activeLocale === 'ko'
              ? 'FAQ 질문을 입력합니다. (한국어는 필수입니다.)'
              : 'Enter the FAQ question. (Optional)'}
          </p>
          <input
            type="text"
            required={activeLocale === 'ko'}
            style={inputStyle}
            value={activeLocale === 'ko' ? formData.questionKo : formData.questionEn}
            onChange={(e) =>
              setFormData({
                ...formData,
                [activeLocale === 'ko' ? 'questionKo' : 'questionEn']: e.target.value,
              })
            }
            placeholder={activeLocale === 'ko' ? '예: atsignal은 무엇인가요?' : 'e.g., What is atsignal?'}
          />
        </div>

        {/* 답변 입력 */}
        <div style={{ marginBottom: '1.5rem' }}>
          {activeLocale === 'ko' ? (
            editorType === 'nextra' ? (
              <NextraMarkdownField
                id="answer-ko"
                label="답변 (한국어)"
                locale="ko"
                required
                helperText="FAQ 답변을 입력합니다. Markdown 또는 MDX 형식으로 작성하세요. (한국어는 필수입니다.)"
                value={formData.answerKo}
                onChange={(next) => setFormData({ ...formData, answerKo: next })}
                height="300px" // FAQ용으로 더 작은 높이
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={labelStyle}>
                  답변 {requiredMark}
                </label>
                <p style={helpTextStyle}>
                  FAQ 답변을 입력합니다. Toast UI Editor를 사용하여 작성할 수 있습니다. (한국어는 필수입니다.)
                </p>
                <ToastMarkdownEditor
                  value={formData.answerKo}
                  onChange={(value) => setFormData({ ...formData, answerKo: value })}
                  saveFormat={saveFormat}
                  onSaveFormatChange={setSaveFormat}
                  isNewPage={!initialFAQ}
                  height="300px" // FAQ용으로 더 작은 높이
                />
              </div>
            )
          ) : (
            editorType === 'nextra' ? (
              <NextraMarkdownField
                id="answer-en"
                label="답변 (영어)"
                locale="en"
                helperText="FAQ 답변을 입력합니다. Markdown 또는 MDX 형식으로 작성하세요. (선택사항)"
                value={formData.answerEn}
                onChange={(next) => setFormData({ ...formData, answerEn: next })}
                height="300px" // 한국어와 동일한 높이
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={labelStyle}>
                  답변
                </label>
                <p style={helpTextStyle}>
                  FAQ 답변을 입력합니다. Toast UI Editor를 사용하여 작성할 수 있습니다. (선택사항)
                </p>
                <ToastMarkdownEditor
                  value={formData.answerEn}
                  onChange={(value) => setFormData({ ...formData, answerEn: value })}
                  saveFormat={saveFormat}
                  onSaveFormatChange={setSaveFormat}
                  isNewPage={!initialFAQ}
                  height="300px" // 한국어와 동일한 높이
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
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
            backgroundColor: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '저장 중...' : initialFAQ ? '수정' : '저장'}
        </button>
      </div>
    </form>
  );
}

