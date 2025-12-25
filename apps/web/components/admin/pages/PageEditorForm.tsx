'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Page, Site } from '@/lib/admin/types';
import type { MenuOption, PageFormValues } from '@/src/features/pages/types';
import { NextraMarkdownField } from '@/components/editor/NextraMarkdownField';
import { buildPublishedUrl } from '@/lib/admin/preview';

const ToastMarkdownEditor = dynamic(
  () => import('@/components/editor/ToastMarkdownEditor').then((mod) => ({ default: mod.ToastMarkdownEditor })),
  { ssr: false },
);

interface PageEditorFormProps {
  site: Site;
  pageId: string | null;
  initialPage: Page | null;
  menuOptions: MenuOption[];
  onSaveDraft: (values: PageFormValues) => Promise<void>;
  onPublish: (values: PageFormValues) => Promise<void>;
  onPreview: (values: PageFormValues, locale: 'ko' | 'en') => Promise<string>;
  submitting: boolean;
  admins: Map<string, { name: string; username: string }>;
}

const requiredMark = <span style={{ color: '#dc2626' }}>*</span>;

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

const sectionStyle: React.CSSProperties = {
  marginBottom: '1rem',
  padding: '1.5rem',
  backgroundColor: '#f9fafb',
  borderRadius: '0.75rem',
};

const contentTabWrapperStyle: React.CSSProperties = {
  display: 'inline-flex',
  gap: '0.25rem',
  backgroundColor: '#e2e8f0',
  borderRadius: '999px',
  padding: '0.25rem',
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

export function PageEditorForm({
  site,
  pageId,
  initialPage,
  menuOptions,
  onSaveDraft,
  onPublish,
  onPreview,
  submitting,
  admins = new Map(),
}: PageEditorFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuIdFromQuery = searchParams.get('menuId');

  const [formState, setFormState] = useState({
    menuId: menuIdFromQuery || '',
    slug: '',
    labelKo: '',
    labelEn: '',
    contentKo: '',
    contentEn: '',
  });
  const [activeContentLocale, setActiveContentLocale] = useState<'ko' | 'en'>('ko');
  const [editorType, setEditorType] = useState<'nextra' | 'toast'>('toast');
  const [saveFormat, setSaveFormat] = useState<'markdown' | 'html'>('markdown');
  const [previewing, setPreviewing] = useState(false);
  const [showContentTooltip, setShowContentTooltip] = useState(false);

  const lastPublishedAt = useMemo(() => {
    if (!initialPage?.updatedAt) return null;
    return new Date(initialPage.updatedAt).toLocaleString('ko-KR');
  }, [initialPage?.updatedAt]);

  const lastDraftAt = useMemo(() => {
    if (!initialPage?.draftUpdatedAt) return null;
    return new Date(initialPage.draftUpdatedAt).toLocaleString('ko-KR');
  }, [initialPage?.draftUpdatedAt]);

  const hasPendingDraft = useMemo(() => {
    if (!initialPage?.draftUpdatedAt) return false;
    if (!initialPage?.updatedAt) return true;
    return initialPage.draftUpdatedAt > initialPage.updatedAt;
  }, [initialPage?.draftUpdatedAt, initialPage?.updatedAt]);

  useEffect(() => {
    if (!initialPage) {
      const menuIdFromQueryInner = searchParams.get('menuId');
      let initialSlug = '';
      if (menuIdFromQueryInner) {
        const selectedMenu = menuOptions.find((opt) => opt.id === menuIdFromQueryInner);
        if (selectedMenu) initialSlug = selectedMenu.path;
      }
      setFormState({
        menuId: menuIdFromQueryInner || '',
        slug: initialSlug,
        labelKo: '',
        labelEn: '',
        contentKo: '',
        contentEn: '',
      });
      setEditorType('toast');
      setSaveFormat(site === 'web' ? 'html' : 'markdown');
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
    setEditorType(initialPage.editorType || 'toast');
    setSaveFormat(initialPage.saveFormat || 'markdown');
  }, [initialPage, searchParams, menuOptions, site]);

  const isEmptyContent = (content: string): boolean => {
    if (!content || !content.trim()) return true;
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    return textContent === '' || textContent === '\n' || textContent === '\r\n';
  };

  const buildPayload = (): PageFormValues => ({
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
    editorType,
    saveFormat: editorType === 'nextra' ? 'markdown' : saveFormat,
  });

  const validateForm = () => {
    if (!formState.menuId) {
      alert('메뉴를 선택해주세요.');
      return false;
    }
    if (!formState.labelKo.trim() || !formState.slug.trim()) {
      alert('필수 항목을 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    await onPublish(buildPayload());
  };

  const handleSaveDraftClick = async () => {
    if (!validateForm()) return;
    await onSaveDraft(buildPayload());
  };

  const handlePreviewClick = async () => {
    if (!validateForm()) return;
    setPreviewing(true);
    try {
      const url = await onPreview(buildPayload(), activeContentLocale);
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0rem' }}>
      <div style={sectionStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>기본 정보</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: hasPendingDraft ? '#fef3c7' : '#e0f2fe',
              color: hasPendingDraft ? '#92400e' : '#075985',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            {hasPendingDraft ? '게시 전 임시 저장본이 있습니다' : '게시본과 임시 저장본이 동일합니다'}
          </span>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{lastPublishedAt ? `마지막 게시: ${lastPublishedAt}` : '게시 이력 없음'}</span>
          {lastDraftAt ? <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>마지막 임시 저장: {lastDraftAt}</span> : null}
          {initialPage?.createdBy ? (
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>작성자: {admins.get(initialPage.createdBy)?.name || '알 수 없음'}</span>
          ) : null}
          {initialPage?.updatedBy && initialPage.updatedBy !== initialPage.createdBy ? (
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>수정자: {admins.get(initialPage.updatedBy)?.name || '알 수 없음'}</span>
          ) : null}
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>메뉴 선택 {requiredMark}</label>
            <p style={helpTextStyle}>콘텐츠가 연결될 메뉴를 지정합니다.</p>
            <select
              required
              style={inputStyle}
              value={formState.menuId}
              onChange={(event) => {
                const selectedMenuId = event.target.value;
                const selectedMenu = menuOptions.find((opt) => opt.id === selectedMenuId);
                if (selectedMenu?.hasPage && selectedMenuId !== initialPage?.menuId) {
                  alert('이미 작성된 페이지입니다.');
                  return;
                }
                if (selectedMenu?.hasChildren && selectedMenuId !== initialPage?.menuId) {
                  alert('하위메뉴에서 작성하셔야 합니다.');
                  return;
                }
                setFormState((prev) => ({
                  ...prev,
                  menuId: selectedMenuId,
                  slug: selectedMenu ? selectedMenu.path : prev.slug,
                }));
              }}
            >
              <option value="">메뉴를 선택하세요</option>
              {menuOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {`${'— '.repeat(Math.max(option.depth - 1, 0))}[Depth: ${option.depth}] ${option.label} (${option.path})${
                    option.enabled ? '' : ' [비활성화]'
                  }${option.hasPage ? ' [작성됨]' : ''}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Slug {requiredMark}</label>
            <p style={helpTextStyle}>페이지 URL에 사용될 식별자입니다. 수정을 원하시면 메뉴 관리 페이지에서 수정하세요.</p>
            <input required style={inputStyle} readOnly value={formState.slug} title="메뉴 경로가 자동으로 채워집니다." />
          </div>
        </div>

        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>페이지 제목 (한국어) {requiredMark}</label>
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
            <label style={labelStyle}>페이지 제목 (영어)</label>
            <p style={helpTextStyle}>영문 페이지 제목입니다.</p>
            <input
              style={inputStyle}
              value={formState.labelEn}
              onChange={(event) => setFormState((prev) => ({ ...prev, labelEn: event.target.value }))}
              placeholder="예: Solutions overview"
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            <h2 style={{ margin: 0 }}>콘텐츠</h2>
            <div
              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
              onMouseEnter={() => setShowContentTooltip(true)}
              onMouseLeave={() => setShowContentTooltip(false)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'help', color: '#6b7280' }}>
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <text x="8" y="11" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">
                  i
                </text>
              </svg>
              {showContentTooltip ? (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-20%)',
                    marginBottom: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#1f2937',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    lineHeight: '1.6',
                    whiteSpace: 'normal',
                    maxWidth: '850px',
                    width: 'max-content',
                    minWidth: '400px',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>콘텐츠 작성 가이드</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>• Docs 앱에서 기술 문서를 작성할 때는 Markdown 형식으로 작성·저장하는 것을 권장합니다.</div>
                    <div>• Web 앱에서 동적 페이지를 생성할 때는 HTML 형식으로 작성·저장하는 것을 권장합니다.</div>
                    <div>• Markdown 형식은 자동 목차 생성 지원, HTML 형식은 자동 목차 생성 미지원</div>
                    <div>
                      • Nextra ↔ TOAST UI Editor 간 문서 전환 시 호환성 문제가 발생할 수 있으므로,
                      <br />
                      &nbsp;&nbsp;에디터를 변경한 후에는 반드시 문서 내용을 확인해 주세요.
                    </div>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '20%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #1f2937',
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>에디터 타입:</span>
            <select
              value={editorType}
              onChange={(e) => {
                const newType = e.target.value as 'nextra' | 'toast';
                const message =
                  '에디터를 전환하면 현재 입력된 내용이 그대로 유지됩니다.\n\n⚠️ 주의사항:\n- 에디터 간 호환성 문제가 발생할 수 있습니다.\n- 전환 후 반드시 내용을 확인하세요.\n\n계속하시겠습니까?';
                if (window.confirm(message)) setEditorType(newType);
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

        <div style={contentTabWrapperStyle}>
          <button type="button" style={activeContentLocale === 'ko' ? contentTabActiveStyle : contentTabStyle} onClick={() => setActiveContentLocale('ko')}>
            KO 콘텐츠
          </button>
          <button type="button" style={activeContentLocale === 'en' ? contentTabActiveStyle : contentTabStyle} onClick={() => setActiveContentLocale('en')}>
            EN 콘텐츠
          </button>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          {activeContentLocale === 'ko' ? (
            editorType === 'nextra' ? (
              <NextraMarkdownField
                id="content-ko"
                label="콘텐츠 (한국어)"
                locale="ko"
                required
                helperText="한글 페이지 본문입니다. Markdown 또는 MDX 형식으로 작성하세요."
                value={formState.contentKo}
                onChange={(next) => setFormState((prev) => ({ ...prev, contentKo: next }))}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  콘텐츠 (한국어) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>한글 페이지 본문입니다. Markdown 또는 HTML 형식으로 작성하세요.</p>
                <ToastMarkdownEditor
                  value={formState.contentKo}
                  onChange={(next) => setFormState((prev) => ({ ...prev, contentKo: next }))}
                  saveFormat={saveFormat}
                  onSaveFormatChange={setSaveFormat}
                  isNewPage={!initialPage}
                />
              </div>
            )
          ) : editorType === 'nextra' ? (
            <NextraMarkdownField
              id="content-en"
              label="콘텐츠 (영어)"
              locale="en"
              helperText="영문 페이지 본문입니다. Markdown 또는 MDX 형식으로 작성하세요."
              value={formState.contentEn}
              onChange={(next) => setFormState((prev) => ({ ...prev, contentEn: next }))}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 600 }}>콘텐츠 (영어)</label>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>영문 페이지 본문입니다. Markdown 형식으로 작성하세요.</p>
              <ToastMarkdownEditor
                value={formState.contentEn}
                onChange={(next) => setFormState((prev) => ({ ...prev, contentEn: next }))}
                saveFormat={saveFormat}
                onSaveFormatChange={setSaveFormat}
                isNewPage={!initialPage}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={async () => {
              if (!validateForm()) return;
              setPreviewing(true);
              try {
                const url = await onPreview(buildPayload(), 'ko');
                window.open(url, '_blank', 'noopener,noreferrer');
              } finally {
                setPreviewing(false);
              }
            }}
            disabled={previewing || (!formState.labelKo.trim() && isEmptyContent(formState.contentKo))}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5f5',
              backgroundColor: '#eef2ff',
              color: '#4338ca',
              cursor: previewing || (!formState.labelKo.trim() && isEmptyContent(formState.contentKo)) ? 'not-allowed' : 'pointer',
              opacity: !formState.labelKo.trim() && isEmptyContent(formState.contentKo) ? 0.5 : 1,
              minWidth: '120px',
            }}
          >
            {previewing ? '준비중...' : 'KO 미리보기'}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!validateForm()) return;
              setPreviewing(true);
              try {
                const url = await onPreview(buildPayload(), 'en');
                window.open(url, '_blank', 'noopener,noreferrer');
              } finally {
                setPreviewing(false);
              }
            }}
            disabled={previewing || (!formState.labelEn.trim() && isEmptyContent(formState.contentEn))}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5f5',
              backgroundColor: '#eef2ff',
              color: '#4338ca',
              cursor: previewing || (!formState.labelEn.trim() && isEmptyContent(formState.contentEn)) ? 'not-allowed' : 'pointer',
              opacity: !formState.labelEn.trim() && isEmptyContent(formState.contentEn) ? 0.5 : 1,
              minWidth: '120px',
            }}
          >
            {previewing ? '준비중...' : 'EN 미리보기'}
          </button>

          {initialPage?.updatedAt ? (
            <>
              <a
                href={buildPublishedUrl(site, formState.slug, 'ko')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #10b981',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '120px',
                  fontWeight: 600,
                  cursor: !formState.labelKo.trim() && isEmptyContent(formState.contentKo) ? 'not-allowed' : 'pointer',
                  opacity: !formState.labelKo.trim() && isEmptyContent(formState.contentKo) ? 0.5 : 1,
                }}
                onClick={(e) => {
                  if (!formState.labelKo.trim() && isEmptyContent(formState.contentKo)) e.preventDefault();
                }}
              >
                KO 사이트 보기
              </a>
              <a
                href={buildPublishedUrl(site, formState.slug, 'en')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #10b981',
                  backgroundColor: '#d1fae5',
                  color: '#065f46',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '120px',
                  fontWeight: 600,
                  cursor: !formState.labelEn.trim() && isEmptyContent(formState.contentEn) ? 'not-allowed' : 'pointer',
                  opacity: !formState.labelEn.trim() && isEmptyContent(formState.contentEn) ? 0.5 : 1,
                }}
                onClick={(e) => {
                  if (!formState.labelEn.trim() && isEmptyContent(formState.contentEn)) e.preventDefault();
                }}
              >
                EN 사이트 보기
              </a>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => router.push(`/admin/menus/${site}`)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          목록
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={handleSaveDraftClick}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#111827',
            cursor: submitting ? 'not-allowed' : 'pointer',
            minWidth: '130px',
          }}
        >
          {submitting ? '저장 중...' : '임시 저장'}
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
            cursor: submitting ? 'not-allowed' : 'pointer',
            minWidth: '130px',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '발행 중...' : pageId ? '발행' : '생성 후 발행'}
        </button>
      </div>
    </form>
  );
}


