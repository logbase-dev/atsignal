'use client';

import { useEffect, useState } from 'react';
import type { Page } from '@/lib/admin/types';
import type { MenuOption, PageFormValues } from '../types';

interface PageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PageFormValues) => Promise<void>;
  menuOptions: MenuOption[];
  initialPage?: Page | null;
}

const requiredMark = <span style={{ color: '#dc2626' }}>*</span>;

const baseWrapperStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  width: '960px',
  maxHeight: '90vh',
  overflowY: 'auto',
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1rem',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontWeight: 600,
  marginBottom: '0.25rem',
};

const helpTextStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#6b7280',
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.8rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
};

export function PageForm({
  isOpen,
  onClose,
  onSubmit,
  menuOptions,
  initialPage,
}: PageFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    menuId: '',
    slug: '',
    labelKo: '',
    labelEn: '',
    contentKo: '',
    contentEn: '',
  });

  useEffect(() => {
    if (!initialPage) {
      setFormState({
        menuId: '',
        slug: '',
        labelKo: '',
        labelEn: '',
        contentKo: '',
        contentEn: '',
      });
      return;
    }

    const labelsSource = initialPage.labelsDraft ?? initialPage.labelsLive;
    const contentSource = initialPage.contentDraft ?? initialPage.contentLive;

    setFormState({
      menuId: initialPage.menuId,
      slug: initialPage.slug,
      labelKo: labelsSource.ko,
      labelEn: labelsSource.en || '',
      contentKo: contentSource.ko,
      contentEn: contentSource.en || '',
    });
  }, [initialPage]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.menuId) {
      alert('메뉴를 선택해주세요.');
      return;
    }
    if (!formState.labelKo.trim() || !formState.slug.trim()) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    const payload: PageFormValues = {
      menuId: formState.menuId,
      slug: formState.slug.trim(),
      labels: {
        ko: formState.labelKo.trim(),
        ...(formState.labelEn.trim() ? { en: formState.labelEn.trim() } : {}),
      },
      content: {
        ko: formState.contentKo,
        ...(formState.contentEn ? { en: formState.contentEn } : {}),
      },
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={baseWrapperStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{initialPage ? '페이지 수정' : '페이지 추가'}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', padding: 0 }}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>
                메뉴 선택 {requiredMark}
              </label>
              <p style={helpTextStyle}>콘텐츠가 연결될 메뉴를 지정합니다. [비활성화] 메뉴도 선택은 가능하지만 Front에서 숨겨질 수 있습니다.</p>
              <select
                required
                style={inputStyle}
                value={formState.menuId}
                onChange={(event) => setFormState((prev) => ({ ...prev, menuId: event.target.value }))}
              >
                <option value="">메뉴를 선택하세요</option>
                {menuOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${'— '.repeat(Math.max(option.depth - 1, 0))}[Depth: ${option.depth}] ${option.label} (${option.path})${
                      option.enabled ? '' : ' [비활성화]'
                    }`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>
                Slug {requiredMark}
              </label>
              <p style={helpTextStyle}>페이지 URL에 사용될 식별자입니다. 공백 없이 영문/숫자/하이픈을 권장합니다.</p>
              <input
                required
                style={inputStyle}
                value={formState.slug}
                onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="예: pricing, solutions/template"
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>
                라벨 (한국어) {requiredMark}
              </label>
              <p style={helpTextStyle}>사이트 내에서 보여질 한글 페이지 제목입니다.</p>
              <input
                required
                style={inputStyle}
                value={formState.labelKo}
                onChange={(event) => setFormState((prev) => ({ ...prev, labelKo: event.target.value }))}
                placeholder="예: 솔루션 소개"
              />
            </div>
            <div>
              <label style={labelStyle}>라벨 (영어)</label>
              <p style={helpTextStyle}>영문 페이지 제목입니다. 필요 시만 입력하세요.</p>
              <input
                style={inputStyle}
                value={formState.labelEn}
                onChange={(event) => setFormState((prev) => ({ ...prev, labelEn: event.target.value }))}
                placeholder="예: Solutions overview"
              />
            </div>
          </div>

          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>
                콘텐츠 (한국어) {requiredMark}
              </label>
              <p style={helpTextStyle}>한글 페이지 본문입니다. Markdown 또는 HTML을 자유롭게 입력할 수 있습니다.</p>
              <textarea
                required
                style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
                value={formState.contentKo}
                onChange={(event) => setFormState((prev) => ({ ...prev, contentKo: event.target.value }))}
                placeholder="# 제목\n본문 내용을 작성하세요."
              />
            </div>
            <div>
              <label style={labelStyle}>콘텐츠 (영어)</label>
              <p style={helpTextStyle}>영문 페이지 본문입니다. 필요 시 번역본을 입력하세요.</p>
              <textarea
                style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
                value={formState.contentEn}
                onChange={(event) => setFormState((prev) => ({ ...prev, contentEn: event.target.value }))}
                placeholder="# Heading\nWrite the English content here."
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
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
                backgroundColor: '#2563eb',
                color: '#fff',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              {submitting ? '저장 중...' : initialPage ? '수정' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

