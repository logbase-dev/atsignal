'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import type { Notice } from '@/lib/admin/types';

// Toast UI Viewer는 SSR에서 문제가 있을 수 있으므로 동적 import
const ToastViewer = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => mod.Viewer),
  { ssr: false }
);

interface Props {
  locale: 'ko' | 'en';
  notice: Notice;
}

export default function NoticeDetailPage({ locale, notice }: Props) {
  const router = useRouter();

  const texts = {
    ko: {
      backToList: '← 목록으로',
      date: '작성일',
      views: '조회수',
    },
    en: {
      backToList: '← Back to List',
      date: 'Date',
      views: 'Views',
    },
  };

  const t = texts[locale];

  // Toast UI Viewer CSS를 클라이언트에서만 동적으로 로드
  useEffect(() => {
    if (notice?.saveFormat === 'html' && typeof window !== 'undefined') {
      // 이미 로드되었는지 확인
      const existingLink = document.querySelector('link[href*="toastui-editor-viewer.css"]');
      if (!existingLink) {
        // @ts-ignore - CSS 파일 타입 선언 없음
        require('@toast-ui/editor/dist/toastui-editor-viewer.css');
      }
    }
  }, [notice?.saveFormat]);

  const formatDate = (date: any) => {
    if (!date) return '';
    
    // Handle Firestore Timestamp objects
    let dateObj: Date;
    if (date && typeof date === 'object' && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  };

  const getLocalizedText = (field: { ko: string; en?: string } | undefined) => {
    if (!field) return '';
    return field[locale] || field.ko || '';
  };

  const content = notice?.content?.[locale] || notice?.content?.ko || '';
  const contentIsHTML = notice?.saveFormat === 'html';

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      padding: '2rem 1rem',
      paddingTop: '6rem',
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
      }}>
        {/* 상단 네비게이션 */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'flex-end', // 우측 정렬
        }}>
          <button
            onClick={() => router.push(`/${locale}/resources/notices`)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            {t.backToList}
          </button>
        </div>

        {/* 메인 콘텐츠 */}
        <main>
          <article style={{ 
            backgroundColor: '#fff', 
            borderRadius: '12px', 
            padding: '3rem', 
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
          }}>
            {/* 제목 */}
            <header style={{ 
              marginBottom: '2rem', 
              paddingBottom: '2rem', 
              borderBottom: '1px solid #e5e7eb' 
            }}>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                marginBottom: '1.5rem', 
                lineHeight: '1.2',
                color: '#1a1a1a',
              }}>
                {getLocalizedText(notice?.title)}
              </h1>
              
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                alignItems: 'center', 
                color: '#6b7280', 
                fontSize: '0.875rem', 
                flexWrap: 'wrap' 
              }}>
                {/* 작성일 */}
                {notice?.createdAt && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.date}</div>
                    <div>{formatDate(notice.createdAt)}</div>
                  </div>
                )}
                
                {/* 조회수 */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.views}</div>
                  <div>{(notice?.views || 0).toLocaleString()}</div>
                </div>
              </div>
            </header>

            {/* 본문 */}
            <div style={{
              fontSize: '1.125rem',
              lineHeight: '1.8',
              color: '#111827',
            }}>
              {contentIsHTML ? (
                <div style={{ marginTop: '1rem' }}>
                  <ToastViewer initialValue={content || ''} />
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
                      <img style={{ maxWidth: '100%', borderRadius: '8px', margin: '1.5rem 0' }} {...props} />
                    ),
                    code: ({ node, inline, ...props }: any) => {
                      if (inline) {
                        return (
                          <code
                            style={{
                              padding: '0.2rem 0.4rem',
                              backgroundColor: '#e2e8f0',
                              borderRadius: '4px',
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
                          padding: '1.5rem',
                          borderRadius: '8px',
                          overflow: 'auto',
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          margin: '1.5rem 0',
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
                          borderLeft: '4px solid #20BDFF',
                          paddingLeft: '1rem',
                          margin: '1.5rem 0',
                          color: '#4b5563',
                          fontStyle: 'italic',
                        }}
                      />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}