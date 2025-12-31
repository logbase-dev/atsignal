'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import type { BlogPost } from '@/lib/admin/types';
import { getPublicFeaturedBlogsByCategory } from '@/lib/public/blogService';

// Toast UI Viewer는 SSR에서 문제가 있을 수 있으므로 동적 import
const ToastViewer = dynamic(
  () => import('@toast-ui/react-editor').then((mod) => mod.Viewer),
  { ssr: false }
);

// TOC 타입
interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface Props {
  locale: 'ko' | 'en';
  blog: BlogPost;
  categories: any[];
}

export default function BlogDetailPage({ locale, blog, categories }: Props) {
  const router = useRouter();
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [relatedPostsByCategory, setRelatedPostsByCategory] = useState<Record<string, BlogPost[]>>({});

  const texts = {
    ko: {
      backToList: '← 목록으로',
      tableOfContents: '목차',
      noToc: '목차가 없습니다.',
      author: '작성자',
      category: '카테고리',
      date: '작성일',
      views: '조회수',
      tags: '태그',
      recommendedPosts: '추천 포스트',
      noRecommendedPosts: '추천 포스트가 없습니다.',
    },
    en: {
      backToList: '← Back to List',
      tableOfContents: 'Table of Contents',
      noToc: 'No table of contents available.',
      author: 'Author',
      category: 'Category',
      date: 'Date',
      views: 'Views',
      tags: 'Tags',
      recommendedPosts: 'Recommended Posts',
      noRecommendedPosts: 'No recommended posts available.',
    },
  };

  const t = texts[locale];

  // 마크다운에서 TOC 추출
  const extractTOC = (markdown: string): TOCItem[] => {
    const lines = markdown.split('\n');
    const tocItems: TOCItem[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        // rehype-slug가 생성하는 ID 형식과 동일하게
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        tocItems.push({ id, text, level });
      }
    });
    
    return tocItems;
  };

  // Toast UI Viewer CSS를 클라이언트에서만 동적으로 로드
  useEffect(() => {
    if (blog?.saveFormat === 'html' && typeof window !== 'undefined') {
      // 이미 로드되었는지 확인
      const existingLink = document.querySelector('link[href*="toastui-editor-viewer.css"]');
      if (!existingLink) {
        // @ts-ignore - CSS 파일 타입 선언 없음
        require('@toast-ui/editor/dist/toastui-editor-viewer.css');
      }
    }

    // TOC 추출 (마크다운인 경우에만)
    if (blog?.saveFormat !== 'html') {
      const content = blog?.content?.[locale] || blog?.content?.ko || '';
      setToc(extractTOC(content));
    }

    // 카테고리별 추천 포스트 로드
    const loadRelatedPosts = async () => {
      const postsByCategory: Record<string, BlogPost[]> = {};
      
      for (const category of categories) {
        try {
          const posts = await getPublicFeaturedBlogsByCategory(category.id, 5);
          // 현재 블로그 제외
          const filteredPosts = posts.filter(p => p.id !== blog?.id);
          if (filteredPosts.length > 0) {
            postsByCategory[category.id] = filteredPosts;
          }
        } catch (error) {
          console.error(`Failed to load posts for category ${category.id}:`, error);
        }
      }
      
      setRelatedPostsByCategory(postsByCategory);
    };

    if (categories.length > 0 && blog?.id) {
      loadRelatedPosts();
    }
  }, [blog?.saveFormat, blog?.content, blog?.id, locale, categories]);

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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return getLocalizedText(category?.name) || '미분류';
  };

  const content = blog?.content?.[locale] || blog?.content?.ko || '';
  const contentIsHTML = blog?.saveFormat === 'html';

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      padding: '2rem 1rem',
      paddingTop: '6rem',
    }}>
      <div style={{ 
        maxWidth: '1600px', 
        margin: '0 auto',
      }}>
        {/* 상단 네비게이션 */}
        <div style={{ 
          maxWidth: '1300px', 
          margin: '0 auto',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'flex-end', // 우측 정렬
        }}>
          <button
            onClick={() => router.push(`/${locale}/resources/blogs`)}
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

        {/* 레이아웃 (3단: 좌측 추천포스트 + 가운데 본문 + 우측 TOC) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: contentIsHTML ? '250px minmax(0, 800px)' : '250px minmax(0, 800px) 250px', 
          gap: '2rem', 
          justifyContent: 'center' 
        }}>
          {/* 좌측: 카테고리별 추천 포스트 */}
          <aside style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            {categories.length === 0 ? (
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
              }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>카테고리가 없습니다.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categories.map((category) => {
                  const posts = relatedPostsByCategory[category.id] || [];
                  return (
                    <div
                      key={category.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <h4 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        marginBottom: '0.75rem', 
                        color: '#374151' 
                      }}>
                        {getLocalizedText(category.name)}
                      </h4>
                      {posts.length === 0 ? (
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{t.noRecommendedPosts}</p>
                      ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {posts.map((relatedPost) => (
                            <li key={relatedPost.id} style={{ marginBottom: '1rem' }}>
                              <Link
                                href={`/${locale}/resources/blogs/${relatedPost.id}`}
                                style={{
                                  color: '#20BDFF',
                                  textDecoration: 'none',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.5',
                                  display: 'block',
                                  transition: 'color 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.textDecoration = 'underline';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.textDecoration = 'none';
                                }}
                              >
                                {getLocalizedText(relatedPost.title)}
                              </Link>
                              {relatedPost.createdAt && (
                                <p style={{ 
                                  color: '#6b7280', 
                                  fontSize: '0.75rem', 
                                  marginTop: '0.25rem' 
                                }}>
                                  {formatDate(relatedPost.createdAt)}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
          {/* 가운데: 메인 콘텐츠 */}
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
                  {getLocalizedText(blog?.title)}
                </h1>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  alignItems: 'center', 
                  color: '#6b7280', 
                  fontSize: '0.875rem', 
                  flexWrap: 'wrap' 
                }}>
                  {/* 작성자 이미지 */}
                  {blog?.authorImage && (
                    <img
                      src={blog.authorImage}
                      alt={blog.authorName || t.author}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb',
                      }}
                    />
                  )}
                  
                  {/* 작성자 이름 */}
                  {blog?.authorName && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.author}</div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>{blog.authorName}</div>
                    </div>
                  )}
                  
                  {/* 카테고리 */}
                  {blog?.categoryId && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.category}</div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}>
                        {getCategoryName(blog.categoryId)}
                      </span>
                    </div>
                  )}
                  
                  {/* 작성일 */}
                  {blog?.createdAt && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.date}</div>
                      <div>{formatDate(blog.createdAt)}</div>
                    </div>
                  )}
                  
                  {/* 조회수 */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t.views}</div>
                    <div>{(blog?.views || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* 태그 */}
                {blog?.tags && blog.tags.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>{t.tags}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {blog.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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

          {/* 우측: TOC (마크다운인 경우에만 표시) */}
          {!contentIsHTML && (
            <aside style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
              <div style={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' 
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  marginBottom: '1rem', 
                  color: '#111827' 
                }}>
                  {t.tableOfContents}
                </h3>
                {toc.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{t.noToc}</p>
                ) : (
                  <nav>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {toc.map((item) => (
                        <li
                          key={item.id}
                          style={{
                            marginBottom: '0.5rem',
                            paddingLeft: `${(item.level - 1) * 1}rem`,
                          }}
                        >
                          <a
                            href={`#${item.id}`}
                            style={{
                              color: '#6b7280',
                              textDecoration: 'none',
                              fontSize: item.level === 1 ? '0.875rem' : '0.75rem',
                              fontWeight: item.level <= 2 ? 600 : 400,
                              display: 'block',
                              transition: 'color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#20BDFF';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#6b7280';
                            }}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}