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

  // 카테고리별로 용어 그룹화
  const groupedGlossaries = glossaries.reduce((acc, glossary) => {
    const categoryId = glossary.categoryId || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(glossary);
    return acc;
  }, {} as Record<string, Glossary[]>);

  // 용어가 없을 때
  if (Object.keys(groupedGlossaries).length === 0) {
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
    <div>
      {Object.entries(groupedGlossaries).map(([categoryId, categoryGlossaries]) => {
        const category = categories.find(c => c.id === categoryId);
        const categoryName = categoryId === 'uncategorized' 
          ? (locale === 'en' ? 'Uncategorized' : '미분류')
          : (locale === 'en' && category?.name.en ? category.name.en : category?.name.ko || '');

        return (
          <div key={categoryId} style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '1.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid #20BDFF',
            }}>
              {categoryName}
            </h2>
            
            <div style={{ 
              display: 'grid',
              gap: '1rem',
            }}>
              {categoryGlossaries.map((glossary) => {
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
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}