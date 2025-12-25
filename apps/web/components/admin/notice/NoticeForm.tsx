'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Notice, LocalizedField } from '@/lib/admin/types';
import { createNotice, getNoticeById, updateNotice } from '@/lib/admin/noticeService';
import { adminFetch } from '@/lib/admin/api';

type Locale = 'ko' | 'en';

interface NoticeFormProps {
  mode: 'create' | 'edit';
  id?: string;
}

const emptyLocalized = (): LocalizedField => ({ ko: '', en: '' });

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

const ToastMarkdownEditor = dynamic(
  () => import('@/components/editor/ToastMarkdownEditor').then((mod) => ({ default: mod.ToastMarkdownEditor })),
  { ssr: false },
);

export function NoticeForm({ mode, id }: NoticeFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [currentNotice, setCurrentNotice] = useState<Notice | null>(null);

  const [localeTab, setLocaleTab] = useState<Locale>('ko');

  const [title, setTitle] = useState<LocalizedField>(emptyLocalized());
  const [oneLiner, setOneLiner] = useState<LocalizedField>(emptyLocalized());
  const [content, setContent] = useState<LocalizedField>(emptyLocalized());

  const [showInBanner, setShowInBanner] = useState(false);
  const [bannerPriority, setBannerPriority] = useState(999);
  const [displayStartAt, setDisplayStartAt] = useState('');
  const [displayEndAt, setDisplayEndAt] = useState('');

  const [published, setPublished] = useState(false);
  const [enabledKo, setEnabledKo] = useState(true);
  const [enabledEn, setEnabledEn] = useState(false);
  const [isTop, setIsTop] = useState(false);

  const [editorType, setEditorType] = useState<'nextra' | 'toast'>('toast');
  const [saveFormat, setSaveFormat] = useState<'markdown' | 'html'>('markdown');

  const pageTitle = useMemo(() => (mode === 'create' ? '공지사항 추가' : '공지사항 수정'), [mode]);

  useEffect(() => {
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await adminFetch('admins');
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const adminMap = new Map<string, { name: string; username: string }>();
        (data.admins || []).forEach((admin: { id?: string; name: string; username: string }) => {
          if (admin.id) adminMap.set(admin.id, { name: admin.name, username: admin.username });
        });
        setAdmins(adminMap);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  useEffect(() => {
    if (mode !== 'edit') return;
    if (!id) return;

    void (async () => {
      setLoading(true);
      try {
        const notice = await getNoticeById(id);
        if (!notice) {
          setError('공지사항을 찾을 수 없습니다.');
          return;
        }
        setCurrentNotice(notice);
        setTitle(notice.title || emptyLocalized());
        setOneLiner(notice.oneLiner || emptyLocalized());
        setContent(notice.content || emptyLocalized());
        setShowInBanner(notice.showInBanner ?? false);
        setBannerPriority(notice.bannerPriority ?? 999);
        setDisplayStartAt(notice.displayStartAt ? new Date(notice.displayStartAt).toISOString().slice(0, 16) : '');
        setDisplayEndAt(notice.displayEndAt ? new Date(notice.displayEndAt).toISOString().slice(0, 16) : '');
        setPublished(notice.published ?? false);
        setEnabledKo(notice.enabled?.ko ?? true);
        setEnabledEn(notice.enabled?.en ?? false);
        setEditorType(notice.editorType || 'toast');
        setSaveFormat(notice.saveFormat || 'markdown');
      } catch (e: any) {
        setError(e?.message || '공지사항을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, id]);

  const validate = (): string | null => {
    if (!title.ko.trim()) return '제목(ko)은 필수입니다.';
    if (!oneLiner.ko.trim()) return '한 줄 문구(ko)는 필수입니다.';
    if (oneLiner.ko.length > 50) return '한 줄 문구(ko)는 50글자를 초과할 수 없습니다.';
    if (!content.ko.trim()) return '본문(ko)은 필수입니다.';
    if (showInBanner && bannerPriority < 0) return '배너 우선순위는 0 이상이어야 합니다.';
    if (displayStartAt && displayEndAt) {
      const start = new Date(displayStartAt);
      const end = new Date(displayEndAt);
      if (end < start) return '종료일시는 시작일시보다 이후여야 합니다.';
    }
    return null;
  };

  const buildPayload = (publishedOverride?: boolean): Omit<Notice, 'id'> => {
    return {
      title: { ko: title.ko.trim(), ...(title.en?.trim() ? { en: title.en.trim() } : {}) },
      oneLiner: { ko: oneLiner.ko.trim(), ...(oneLiner.en?.trim() ? { en: oneLiner.en.trim() } : {}) },
      content: { ko: content.ko.trim(), ...(content.en?.trim() ? { en: content.en.trim() } : {}) },
      showInBanner,
      bannerPriority,
      displayStartAt: displayStartAt ? new Date(displayStartAt) : undefined,
      displayEndAt: displayEndAt ? new Date(displayEndAt) : undefined,
      published: publishedOverride !== undefined ? publishedOverride : published,
      editorType,
      saveFormat,
      enabled: { ko: enabledKo, en: enabledEn },
      isTop,
    };
  };

  const handleSave = async (publishedOverride?: boolean) => {
    setError(null);
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(publishedOverride);
      console.log('[NoticeForm] 저장 payload:', JSON.stringify(payload, null, 2));
      console.log('[NoticeForm] isTop 값:', payload.isTop, '(타입:', typeof payload.isTop, ')');
      if (mode === 'create') {
        const newId = await createNotice(payload);
        setPublished(publishedOverride ?? false);
        router.push(`/admin/notice/${newId}`);
      } else {
        if (!id) throw new Error('id가 없습니다.');
        await updateNotice(id, payload);
        setPublished(publishedOverride ?? false);
        alert('저장되었습니다.');
        void router.refresh();
      }
    } catch (e: any) {
      setError(e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button
            onClick={() => router.push('/admin/notice')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            ← 목록으로
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{pageTitle}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
              {mode === 'edit' && currentNotice && (
                <>
                  {currentNotice.createdAt && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      작성일: {new Date(currentNotice.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {currentNotice.updatedAt && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      수정일: {new Date(currentNotice.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  {currentNotice.createdBy && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      작성자: {admins.get(currentNotice.createdBy)?.name || '알 수 없음'}
                    </span>
                  )}
                  {currentNotice.updatedBy && currentNotice.updatedBy !== currentNotice.createdBy && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      수정자: {admins.get(currentNotice.updatedBy)?.name || '알 수 없음'}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            color: '#991b1b',
          }}
        >
          {error}
        </div>
      )}

      {/* 기본 정보 섹션 */}
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>기본 정보</h2>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>제목(ko) <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="text"
              value={title.ko}
              onChange={(e) => setTitle((p) => ({ ...p, ko: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>제목(en)</label>
            <input
              type="text"
              value={title.en || ''}
              onChange={(e) => setTitle((p) => ({ ...p, en: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>
              롤링 배너용 한 줄 문구(ko) <span style={{ color: '#dc2626' }}>*</span>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                ({oneLiner.ko.length}/50)
              </span>
            </label>
            <p style={helpTextStyle}>홈 상단 롤링 배너에 표시될 한 줄 문구입니다. (최대 50글자)</p>
            <input
              type="text"
              value={oneLiner.ko}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setOneLiner((p) => ({ ...p, ko: value }));
                }
              }}
              placeholder="한 줄 문구를 입력하세요 (최대 50글자)"
              style={inputStyle}
              maxLength={50}
            />
            {oneLiner.ko.length > 50 && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>50글자를 초과할 수 없습니다.</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>
              롤링 배너용 한 줄 문구(en)
              <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
                ({(oneLiner.en?.length || 0)}/50)
              </span>
            </label>
            <p style={helpTextStyle}>홈 상단 롤링 배너에 표시될 한 줄 문구입니다. (최대 50글자)</p>
            <input
              type="text"
              value={oneLiner.en || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setOneLiner((p) => ({ ...p, en: value }));
                }
              }}
              placeholder="Enter one-liner (max 50 chars)"
              style={inputStyle}
              maxLength={50}
            />
            {(oneLiner.en?.length || 0) > 50 && (
              <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>50글자를 초과할 수 없습니다.</p>
            )}
          </div>
        </div>

        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={isTop}
                onChange={(e) => setIsTop(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              목록 상단에 고정
            </label>
            <p style={helpTextStyle}>체크하면 공지사항 목록 상단에 고정 표시됩니다.</p>
          </div>
          <div>
            <label style={labelStyle}>활성화</label>
            <p style={helpTextStyle}>언어별 노출 여부를 설정합니다.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={enabledKo}
                  onChange={(e) => setEnabledKo(e.target.checked)}
                />
                <span>KO</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={enabledEn}
                  onChange={(e) => setEnabledEn(e.target.checked)}
                />
                <span>EN</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 노출 제어 섹션 */}
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>노출 제어</h2>

        <div style={rowStyle}>
          {/* 배너 노출 여부 */}
          <div>
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={showInBanner}
                onChange={(e) => setShowInBanner(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              홈 상단 롤링 배너에 노출
            </label>
            <p style={helpTextStyle}>체크하면 홈 상단 롤링 배너에 이 공지사항이 표시됩니다.</p>
          </div>

          {/* 배너 우선순위 */}
          <div>
            <label style={labelStyle}>
              배너 노출 우선순위
              {showInBanner && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <p style={helpTextStyle}>낮을수록 우선 표시됩니다. (기본값: 999)</p>
            <input
              type="number"
              value={bannerPriority}
              onChange={(e) => setBannerPriority(parseInt(e.target.value, 10) || 999)}
              min="0"
              disabled={!showInBanner}
              style={{ ...inputStyle, opacity: showInBanner ? 1 : 0.5 }}
            />
          </div>
        </div>

        {/* 노출 기간 */}
        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>노출 시작일시 (선택사항)</label>
            <p style={helpTextStyle}>이 날짜 이후부터 노출됩니다.</p>
            <input
              type="datetime-local"
              value={displayStartAt}
              onChange={(e) => setDisplayStartAt(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>노출 종료일시 (선택사항)</label>
            <p style={helpTextStyle}>이 날짜까지 노출됩니다.</p>
            <input
              type="datetime-local"
              value={displayEndAt}
              onChange={(e) => setDisplayEndAt(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* 콘텐츠 섹션 */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0 }}>콘텐츠</h2>
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
        <div style={{ display: 'inline-flex', gap: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '999px', padding: '0.25rem', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setLocaleTab('ko')}
            style={{
              border: 'none',
              background: localeTab === 'ko' ? '#ffffff' : 'transparent',
              color: localeTab === 'ko' ? '#0f172a' : '#475569',
              borderRadius: '999px',
              padding: '0.5rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: localeTab === 'ko' ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none',
            }}
          >
            한국어
          </button>
          <button
            type="button"
            onClick={() => setLocaleTab('en')}
            style={{
              border: 'none',
              background: localeTab === 'en' ? '#ffffff' : 'transparent',
              color: localeTab === 'en' ? '#0f172a' : '#475569',
              borderRadius: '999px',
              padding: '0.5rem 1.5rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: localeTab === 'en' ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none',
            }}
          >
            English
          </button>
        </div>

        <div>
          <label style={labelStyle}>
            본문 {localeTab === 'ko' ? <span style={{ color: '#dc2626' }}>*</span> : null}
          </label>
          <p style={helpTextStyle}>현재 언어({localeTab.toUpperCase()}) 기준 본문을 입력합니다.</p>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <ToastMarkdownEditor
              value={(localeTab === 'ko' ? content.ko : content.en) || ''}
              onChange={(next) => setContent((p) => ({ ...p, [localeTab]: next } as any))}
              saveFormat={saveFormat}
              onSaveFormatChange={setSaveFormat}
              isNewPage={mode === 'create'}
              height="680px"
            />
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
        <button
          type="button"
          onClick={() => router.push('/admin/notice')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          목록
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            await handleSave(false);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#111827',
            cursor: saving ? 'not-allowed' : 'pointer',
            minWidth: '130px',
          }}
        >
          {saving ? '저장 중...' : '임시저장'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            await handleSave(true);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            minWidth: '130px',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? '발행 중...' : mode === 'edit' ? '발행' : '생성 후 발행'}
        </button>
      </div>
    </div>
  );
}

