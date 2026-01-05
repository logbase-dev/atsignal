'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import type { WhatsNew } from '@/lib/admin/types';

interface WhatsNewAccordionProps {
  locale: string;
  whatsNews: WhatsNew[];
  expandedItems: Set<string>;
  onToggleExpanded: (id: string) => void;
}

export function WhatsNewAccordion({
  locale,
  whatsNews,
  expandedItems,
  onToggleExpanded,
}: WhatsNewAccordionProps) {
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale === 'en' ? 'en-US' : 'ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (whatsNews.length === 0) {
    return (
      <div style={{ 
        padding: '3rem 1rem', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #e5e5e5',
      }}>
        <p>{locale === 'en' ? 'No updates available.' : '업데이트가 없습니다.'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {whatsNews.map((item) => {
        const isExpanded = expandedItems.has(item.id!);
        const title = locale === 'en' && item.title.en ? item.title.en : item.title.ko;
        const oneLiner = locale === 'en' && item.oneLiner.en ? item.oneLiner.en : item.oneLiner.ko;
        const content = locale === 'en' && item.content.en ? item.content.en : item.content.ko;

        return (
          <div
            key={item.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: item.isTop ? '2px solid #20BDFF' : '1px solid #e5e5e5',
              overflow: 'hidden',
              transition: 'box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* 아코디언 헤더 */}
            <div
              onClick={() => onToggleExpanded(item.id!)}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                borderBottom: isExpanded ? '1px solid #e5e5e5' : 'none',
                backgroundColor: item.isTop ? '#f0f9ff' : '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {item.isTop && (
                      <img 
                        src="/images/pin.png" 
                        alt="pinned image" 
                        style={{
                          width: '24px',
                          height: '24px',
                          objectFit: 'contain'
                        }}
                      />
                    )}
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '0.5rem',
                    margin: 0,
                  }}>
                    {title}
                  </h3>
                  <p style={{
                    color: '#666',
                    fontSize: '1rem',
                    margin: 0,
                    lineHeight: '1.5',
                  }}>
                    {oneLiner}
                  </p>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  color: '#666',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}>
                  ▼
                </div>
              </div>
            </div>

            {/* 아코디언 내용 */}
            {isExpanded && (
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#fafafa',
              }}>
                <div style={{
                  color: '#444',
                  lineHeight: '1.6',
                  fontSize: '1rem',
                }}>
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
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}