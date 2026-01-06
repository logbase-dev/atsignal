'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { getBlogPostById, getBlogPosts } from '@/lib/admin/blogService';
import { getBlogCategories } from '@/lib/admin/blogCategoryService';
import type { BlogPost, BlogCategory } from '@/lib/admin/types';

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

export default function BlogPostViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPostsByCategory, setRelatedPostsByCategory] = useState<Record<string, BlogPost[]>>({});
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toc, setToc] = useState<TOCItem[]>([]);

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

  useEffect(() => {
    void loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [postData, categoriesData] = await Promise.all([
        getBlogPostById(params.id),
        getBlogCategories(),
      ]);
      
      if (!postData) {
        setError('블로그 포스트를 찾을 수 없습니다.');
        return;
      }
      
      setPost(postData);
      setCategories(categoriesData);
      
      // 1단계: 모든 블로그 포스트 가져오기 (최대 100개)
      const allPosts = await getBlogPosts({ page: 1, limit: 100 });
      // 2단계: 카테고리별로 그룹화
      const postsByCategory: Record<string, BlogPost[]> = {};
      
      // 3단계: 각 카테고리별로 추천 포스트(isFeatured: true) 5개씩 가져오기
      categoriesData.forEach((category) => {
        const related = allPosts.posts
          .filter((p) => 
            p.id !== postData.id && 
            p.categoryId === category.id && 
            p.published &&
            p.isFeatured === true
          )
          .slice(0, 5);
        
        if (related.length > 0) {
          postsByCategory[category.id] = related;
        }
      });
      
      setRelatedPostsByCategory(postsByCategory);
      
      // TOC 추출 (마크다운인 경우에만)
      if (postData.saveFormat !== 'html') {
        const content = postData.content?.ko || postData.content?.en || '';
        setToc(extractTOC(content));
      }
    } catch (e: any) {
      console.error('Failed to load blog post:', e);
      setError(e.message || '블로그 포스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Toast UI Viewer CSS를 클라이언트에서만 동적으로 로드
  // hooks는 항상 같은 순서로 호출되어야 하므로 early return 이전에 배치
  useEffect(() => {
    if (post?.saveFormat === 'html' && typeof window !== 'undefined') {
      // 이미 로드되었는지 확인
      const existingLink = document.querySelector('link[href*="toastui-editor-viewer.css"]');
      if (!existingLink) {
        // @ts-ignore - CSS 파일 타입 선언 없음
        require('@toast-ui/editor/dist/toastui-editor-viewer.css');
      }
    }
  }, [post?.saveFormat]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => router.push('/admin/blog')}
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
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
          {error || '블로그 포스트를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === post.categoryId)?.name?.ko || '미분류';
  const content = post.content?.ko || post.content?.en || '';
  const contentIsHTML = post.saveFormat === 'html';
  const editorType = post.editorType || 'toast';

  return (
    <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 상단 네비게이션 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button
            onClick={() => router.push('/admin/blog')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginRight: '0.5rem',
            }}
          >
            ← 목록으로
          </button>
          <Link
            href={`/admin/blog/${post.id}`}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#111827',
              cursor: 'pointer',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            수정
          </Link>
        </div>
      </div>

      {/* 3단 레이아웃 (HTML인 경우 TOC 제외) */}
      <div style={{ display: 'grid', gridTemplateColumns: contentIsHTML ? '250px minmax(0, 800px)' : '250px minmax(0, 800px) 250px', gap: '2rem', justifyContent: 'center' }}>
        {/* 좌측: 카테고리별 추천 포스트 */}
        <aside style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
          {categories.length === 0 ? (
            <div style={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
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
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                      {category.name?.ko || category.name?.en || '미분류'}
                    </h4>
                    {posts.length === 0 ? (
                      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>추천 포스트가 없습니다.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {posts.map((relatedPost) => (
                          <li key={relatedPost.id} style={{ marginBottom: '1rem' }}>
                            <Link
                              href={`/admin/blog/${relatedPost.id}/view`}
                              style={{
                                color: '#0070f3',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                display: 'block',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecoration = 'underline';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecoration = 'none';
                              }}
                            >
                              {relatedPost.title?.ko || relatedPost.title?.en || '제목 없음'}
                            </Link>
                            {relatedPost.createdAt && (
                              <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                {new Date(relatedPost.createdAt).toLocaleDateString()}
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
          <article style={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '2rem', border: '1px solid #e5e7eb' }}>
            {/* 제목 */}
            <header style={{ marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', lineHeight: '1.2' }}>
                {post.title?.ko || post.title?.en || '제목 없음'}
              </h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', color: '#6b7280', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                {/* 작성자 이미지 */}
                {post.authorImage && (
                  <img
                    src={post.authorImage}
                    alt={post.authorName || '저자'}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid #e5e7eb',
                    }}
                  />
                )}
                {/* 작성자 이름 */}
                {post.authorName && (
                  <span style={{ fontWeight: 500, color: '#111827' }}>{post.authorName}</span>
                )}
                {/* 카테고리 */}
                {categoryName && <span>{categoryName}</span>}
                {/* 작성일 */}
                {post.createdAt && <span>• {new Date(post.createdAt).toLocaleDateString()}</span>}
                {/* 태그 */}
                {post.tags && post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '999px',
                          backgroundColor: '#f3f4f6',
                          fontSize: '0.75rem',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            {/* 본문 */}
            <div
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.8',
                color: '#111827',
              }}
            >
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
                {content}
              </ReactMarkdown>
              )}
            </div>
          </article>
        </main>

        {/* 우측: TOC (마크다운인 경우에만 표시) */}
        {!contentIsHTML && (
          <aside style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                목차
              </h3>
              {toc.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>목차가 없습니다.</p>
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
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#0070f3';
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
  );
}
