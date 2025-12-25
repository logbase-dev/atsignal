'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { getWhatsNewById, deleteWhatsNew } from '@/lib/admin/whatsnewService';
import type { WhatsNew } from '@/lib/admin/types';
import { adminFetch } from '@/lib/admin/api';

// Toast UI Viewer는 SSR에서 문제가 있을 수 있으므로 동적 import
const ToastViewer = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => mod.Viewer),
  { ssr: false }
);

export default function ViewWhatsNewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [whatsnew, setWhatsNew] = useState<WhatsNew | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [locale, setLocale] = useState<'ko' | 'en'>('ko');

  // Toast UI Viewer CSS를 클라이언트에서만 동적으로 로드
  useEffect(() => {
    if (whatsnew?.saveFormat === 'html' && typeof window !== 'undefined') {
      // 이미 로드되었는지 확인
      const existingLink = document.querySelector('link[href*="toastui-editor-viewer.css"]');
      if (!existingLink) {
        // @ts-ignore - CSS 파일 타입 선언 없음
        require('@toast-ui/editor/dist/toastui-editor-viewer.css');
      }
    }
  }, [whatsnew?.saveFormat]);

  useEffect(() => {
    void loadWhatsNew();
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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

  const loadWhatsNew = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWhatsNewById(params.id);
      if (!data) {
        setError("What's new를 찾을 수 없습니다.");
        return;
      }
      setWhatsNew(data);
    } catch (e: any) {
      setError(e?.message || "What's new를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!whatsnew?.id) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      await deleteWhatsNew(whatsnew.id);
      router.push('/admin/whatsnew');
    } catch (e: any) {
      alert('삭제 중 오류가 발생했습니다: ' + (e?.message || '알 수 없는 오류'));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !whatsnew) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            color: '#991b1b',
          }}
        >
          {error || "What's new를 찾을 수 없습니다."}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link
            href="/admin/whatsnew"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            ← 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <Link
            href="/admin/whatsnew"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            ← 목록으로
          </Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>{whatsnew.title?.[locale] || whatsnew.title?.ko || '제목 없음'}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href={`/admin/whatsnew/${whatsnew.id}`}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.85rem' }}>
          {whatsnew.createdAt && <span>작성일: {new Date(whatsnew.createdAt).toLocaleDateString()}</span>}
          {whatsnew.updatedAt && whatsnew.updatedAt !== whatsnew.createdAt && (
            <span>수정일: {new Date(whatsnew.updatedAt).toLocaleDateString()}</span>
          )}
          {whatsnew.createdBy && <span>작성자: {admins.get(whatsnew.createdBy)?.name || '알 수 없음'}</span>}
          {whatsnew.updatedBy && whatsnew.updatedBy !== whatsnew.createdBy && (
            <span>수정자: {admins.get(whatsnew.updatedBy)?.name || '알 수 없음'}</span>
          )}
          {whatsnew.views !== undefined && <span>조회수: {whatsnew.views.toLocaleString()}</span>}
        </div>
      </div>

      {/* 언어 탭 */}
      <div style={{ display: 'inline-flex', gap: '0.25rem', backgroundColor: '#e2e8f0', borderRadius: '999px', padding: '0.25rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setLocale('ko')}
          style={{
            border: 'none',
            background: locale === 'ko' ? '#ffffff' : 'transparent',
            padding: '0.5rem 1.5rem',
            borderRadius: '999px',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: locale === 'ko' ? '#0f172a' : '#475569',
            cursor: 'pointer',
            boxShadow: locale === 'ko' ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none',
          }}
        >
          한국어
        </button>
        <button
          type="button"
          onClick={() => setLocale('en')}
          style={{
            border: 'none',
            background: locale === 'en' ? '#ffffff' : 'transparent',
            padding: '0.5rem 1.5rem',
            borderRadius: '999px',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: locale === 'en' ? '#0f172a' : '#475569',
            cursor: 'pointer',
            boxShadow: locale === 'en' ? '0 1px 3px rgba(15, 23, 42, 0.12)' : 'none',
          }}
        >
          English
        </button>
      </div>

      {/* 한 줄 문구 */}
      {whatsnew.oneLiner?.[locale] || whatsnew.oneLiner?.ko ? (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem', color: '#6b7280' }}>한 줄 문구</h3>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>{whatsnew.oneLiner?.[locale] || whatsnew.oneLiner?.ko || ''}</p>
        </div>
      ) : null}

      {/* 상세 내용 */}
      <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>상세 내용</h3>
        <div
          style={{
            fontSize: '1.125rem',
            lineHeight: '1.8',
            color: '#111827',
          }}
        >
          {whatsnew.saveFormat === 'html' ? (
            <div style={{ marginTop: '1rem' }}>
              <ToastViewer initialValue={whatsnew.content?.[locale] || whatsnew.content?.ko || ''} />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 id={props.id} style={{ fontSize: '2rem', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', scrollMarginTop: '100px' }} {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 id={props.id} style={{ fontSize: '1.75rem', fontWeight: 600, marginTop: '1.5rem', marginBottom: '0.75rem', scrollMarginTop: '100px' }} {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 id={props.id} style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '1.25rem', marginBottom: '0.5rem', scrollMarginTop: '100px' }} {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 id={props.id} style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', scrollMarginTop: '100px' }} {...props} />
                ),
                h5: ({ node, ...props }) => (
                  <h5 id={props.id} style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', scrollMarginTop: '100px' }} {...props} />
                ),
                h6: ({ node, ...props }) => (
                  <h6 id={props.id} style={{ fontSize: '1rem', fontWeight: 600, marginTop: '1rem', marginBottom: '0.5rem', scrollMarginTop: '100px' }} {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p style={{ marginBottom: '1rem' }} {...props} />
                ),
                img: ({ node, ...props }) => (
                  <img style={{ maxWidth: '100%', borderRadius: '0.5rem', margin: '1rem 0' }} {...props} />
                ),
                code: ({ node, inline, ...props }: any) => {
                  if (inline) {
                    return (
                      <code
                        style={{
                          padding: '0.2rem 0.4rem',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '0.35rem',
                          fontSize: '0.875em',
                          fontFamily: 'monospace',
                        }}
                        {...props}
                      />
                    );
                  }
                  return <code {...props} />;
                },
                pre: ({ node, ...props }) => (
                  <pre
                    {...props}
                    style={{
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      color: '#111827',
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      overflow: 'auto',
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                      margin: '1rem 0',
                    }}
                  />
                ),
                table: ({ node, ...props }: any) => (
                  <div style={{ overflowX: 'auto', margin: '1.5rem 0' }}>
                    <table
                      {...props}
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #d1d5db',
                        fontSize: '0.95rem',
                      }}
                    />
                  </div>
                ),
                thead: ({ node, ...props }: any) => (
                  <thead
                    {...props}
                    style={{
                      backgroundColor: '#f9fafb',
                      borderBottom: '2px solid #d1d5db',
                    }}
                  />
                ),
                tbody: ({ node, ...props }: any) => <tbody {...props} />,
                tr: ({ node, ...props }: any) => (
                  <tr
                    {...props}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  />
                ),
                th: ({ node, ...props }: any) => (
                  <th
                    {...props}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderRight: '1px solid #e5e7eb',
                    }}
                  />
                ),
                td: ({ node, ...props }: any) => (
                  <td
                    {...props}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRight: '1px solid #e5e7eb',
                    }}
                  />
                ),
                hr: ({ node, ...props }: any) => (
                  <hr
                    {...props}
                    style={{
                      border: 'none',
                      borderTop: '3px solid #e5e7eb',
                      margin: '2rem 0',
                    }}
                  />
                ),
                blockquote: ({ node, ...props }: any) => (
                  <blockquote
                    {...props}
                    style={{
                      borderLeft: '4px solid #3b82f6',
                      paddingLeft: '1rem',
                      margin: '1.5rem 0',
                      color: '#4b5563',
                      fontStyle: 'italic',
                    }}
                  />
                ),
              }}
            >
              {whatsnew.content?.[locale] || whatsnew.content?.ko || ''}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* 노출 정보 */}
      <div style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.25rem' }}>노출 정보</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
          <div>
            <strong>배너 노출:</strong> {whatsnew.showInBanner ? <span style={{ color: '#28a745' }}>노출</span> : <span style={{ color: '#666' }}>미노출</span>}
          </div>
          {whatsnew.showInBanner && (
            <div>
              <strong>배너 우선순위:</strong> {whatsnew.bannerPriority}
            </div>
          )}
          <div>
            <strong>발행 상태:</strong> {whatsnew.published ? <span style={{ color: '#28a745' }}>발행</span> : <span style={{ color: '#666' }}>초안</span>}
          </div>
          {whatsnew.publishedAt && (
            <div>
              <strong>발행일:</strong> {new Date(whatsnew.publishedAt).toLocaleDateString()}
            </div>
          )}
          {whatsnew.displayStartAt && (
            <div>
              <strong>노출 시작일시:</strong> {new Date(whatsnew.displayStartAt).toLocaleString()}
            </div>
          )}
          {whatsnew.displayEndAt && (
            <div>
              <strong>노출 종료일시:</strong> {new Date(whatsnew.displayEndAt).toLocaleString()}
            </div>
          )}
          <div>
            <strong>언어 활성화:</strong> 한국어 {whatsnew.enabled?.ko ? '✓' : '✗'}, English {whatsnew.enabled?.en ? '✓' : '✗'}
          </div>
        </div>
      </div>
    </div>
  );
}

