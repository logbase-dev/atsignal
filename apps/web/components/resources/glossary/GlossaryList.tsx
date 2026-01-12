'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import type { Glossary, GlossaryCategory } from '@/lib/admin/types';

interface GlossaryListProps {
  locale: string;
  glossaries: Glossary[];
  categories: GlossaryCategory[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

export function GlossaryList({
  locale,
  glossaries,
  categories,
  loading,
  error,
  searchQuery,
}: GlossaryListProps) {
  // 로딩 상태
  if (loading) {
    return (
      <div style={{ 
        padding: '3rem 1rem', 
        textAlign: 'center', 
        color: '#666' 
      }}>
        <p>{locale === 'en' ? 'Loading glossary...' : '용어사전을 불러오는 중...'}</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div style={{ 
        padding: '2rem 1rem', 
        textAlign: 'center', 
        color: '#dc3545',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #dc3545',
      }}>
        <p>{error}</p>
      </div>
    );
  }

  // 용어가 없을 때
  if (glossaries.length === 0) {
    return (
      <div style={{ 
        padding: '3rem 1rem', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e5e5',
      }}>
        <p>{searchQuery ? (locale === 'en' ? 'No terms found.' : '검색된 용어가 없습니다.') : (locale === 'en' ? 'No terms available.' : '용어가 없습니다.')}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid',
      gap: '1rem',
      marginBottom: '2rem',
    }}>
      {glossaries.map((glossary) => {
        const term = locale === 'en' && glossary.term.en 
          ? glossary.term.en 
          : glossary.term.ko;
        const description = locale === 'en' && glossary.description.en 
          ? glossary.description.en 
          : glossary.description.ko;

        return (
          <div
            key={glossary.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1.5rem',
              border: '1px solid #e5e5e5',
              transition: 'box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#20BDFF',
              marginBottom: '0.75rem',
              margin: 0,
            }}>
              {term}
            </h3>
            
            <div style={{
              color: '#666',
              lineHeight: '1.6',
              fontSize: '1rem',
            }}>
              {glossary.saveFormat === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: description }} />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]}
                  components={{
                    p: ({ children }) => (
                      <p style={{ margin: '0 0 1rem 0' }}>{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ margin: '0 0 0.5rem 0' }}>{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: '600', color: '#1a1a1a' }}>{children}</strong>
                    ),
                    code: ({ children }) => (
                      <code style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '0.125rem 0.375rem', 
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}>{children}</code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote style={{
                        borderLeft: '4px solid #20BDFF',
                        paddingLeft: '1rem',
                        margin: '1rem 0',
                        fontStyle: 'italic',
                        color: '#555'
                      }}>{children}</blockquote>
                    ),
                    table: ({ children }) => (
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        margin: '1rem 0',
                        border: '1px solid #e5e5e5'
                      }}>{children}</table>
                    ),
                    thead: ({ children }) => (
                      <thead style={{ backgroundColor: '#f8f9fa' }}>{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #e5e5e5',
                        fontWeight: '600',
                        textAlign: 'left',
                        fontSize: '0.875rem'
                      }}>{children}</th>
                    ),
                    td: ({ children }) => (
                      <td style={{ 
                        padding: '0.75rem', 
                        border: '1px solid #e5e5e5',
                        fontSize: '0.875rem'
                      }}>{children}</td>
                    ),
                  }}
                >
                  {description}
                </ReactMarkdown>
              )}
            </div>

            {/* 관련 문서 링크 */}
            {glossary.relatedLinks && glossary.relatedLinks.length > 0 && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e5e5',
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}>
                  {locale === 'en' ? 'Related Links' : '관련 문서'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {glossary.relatedLinks.map((link, linkIndex) => (
                    <a
                      key={linkIndex}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#f3f4f6',
                        color: '#20BDFF',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                    >
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}