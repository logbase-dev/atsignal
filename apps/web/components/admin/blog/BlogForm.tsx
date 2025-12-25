'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { BlogCategory, BlogPost, LocalizedField } from '@/lib/admin/types';
import { createBlogPost, getBlogPostById, updateBlogPost, deleteBlogPost } from '@/lib/admin/blogService';
import { getBlogCategories } from '@/lib/admin/blogCategoryService';
import { isValidSlug, slugify } from '@/lib/utils/slug';
import { uploadImage } from '@/lib/admin/imageUpload';
import { BlogCategoryModal } from './BlogCategoryModal';
import { getAdminApiUrl } from '@/lib/admin/api';

type Locale = 'ko' | 'en';

interface BlogFormProps {
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

export function BlogForm({ mode, id }: BlogFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);

  const [localeTab, setLocaleTab] = useState<Locale>('ko');

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [title, setTitle] = useState<LocalizedField>(emptyLocalized());
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState<LocalizedField>(emptyLocalized());
  const [content, setContent] = useState<LocalizedField>(emptyLocalized());

  const [categoryId, setCategoryId] = useState<string>('');
  const [published, setPublished] = useState(false);
  const [enabledKo, setEnabledKo] = useState(true);
  const [enabledEn, setEnabledEn] = useState(true);

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const isComposingRef = useRef(false);
  const [thumbnail, setThumbnail] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorImage, setAuthorImage] = useState('');

  const [editorType, setEditorType] = useState<'nextra' | 'toast'>('toast');
  const [saveFormat, setSaveFormat] = useState<'markdown' | 'html'>('markdown');

  const [metaTitle, setMetaTitle] = useState<LocalizedField>(emptyLocalized());
  const [metaDescription, setMetaDescription] = useState<LocalizedField>(emptyLocalized());
  const [metaKeywordsInput, setMetaKeywordsInput] = useState('');

  const [isFeatured, setIsFeatured] = useState(false);

  const pageTitle = useMemo(() => (mode === 'create' ? '블로그 포스트 추가' : '블로그 포스트 수정'), [mode]);

  const metaKeywords = useMemo(() => {
    const items = metaKeywordsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(items));
  }, [metaKeywordsInput]);

  useEffect(() => {
    void (async () => {
      try {
        const list = await getBlogCategories();
        setCategories(list);
      } catch {
        // optional
      }
    })();
  }, []);

  useEffect(() => {
    void loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await fetch(getAdminApiUrl('admins'), { credentials: 'include' });
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
      setError(null);
      try {
        const post = await getBlogPostById(id);
        if (!post) {
          setError('포스트를 찾을 수 없습니다.');
          return;
        }

        setCurrentPost(post);

        setTitle({ ko: post.title?.ko || '', en: post.title?.en || '' });
        setSlug(post.slug || '');
        setSlugTouched(true);
        setExcerpt({ ko: post.excerpt?.ko || '', en: post.excerpt?.en || '' });
        setContent({ ko: post.content?.ko || '', en: post.content?.en || '' });

        setCategoryId(post.categoryId || '');
        setPublished(Boolean(post.published));
        setEnabledKo(Boolean(post.enabled?.ko ?? true));
        setEnabledEn(Boolean(post.enabled?.en ?? true));

        setTags(post.tags || []);
        setThumbnail(post.thumbnail || '');
        setFeaturedImage(post.featuredImage || '');
        setAuthorName(post.authorName || '');
        setAuthorImage(post.authorImage || '');

        setEditorType(post.editorType || 'toast');
        setSaveFormat(post.saveFormat || 'markdown');

        setMetaTitle({ ko: post.metaTitle?.ko || '', en: post.metaTitle?.en || '' });
        setMetaDescription({ ko: post.metaDescription?.ko || '', en: post.metaDescription?.en || '' });
        setMetaKeywordsInput((post.metaKeywords || []).join(', '));

        setIsFeatured(Boolean(post.isFeatured));
      } catch (e: any) {
        setError(e?.message || '불러오기에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, mode]);

  useEffect(() => {
    if (slugTouched) return;
    const base = title.en?.trim() ? title.en.trim() : title.ko.trim();
    const next = slugify(base);
    if (next) setSlug(next);
  }, [slugTouched, title]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    setTags((prev) => [...prev, trimmedTag]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposingRef.current) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const validate = (): string | null => {
    if (!title.ko.trim()) return '제목(ko)은 필수입니다.';
    if (!slug.trim()) return 'slug는 필수입니다.';
    if (!isValidSlug(slug.trim())) return 'slug는 영문 소문자/숫자/하이픈만 허용됩니다.';
    if (!content.ko.trim()) return '본문(ko)은 필수입니다.';
    return null;
  };

  const buildPayload = (publishedOverride?: boolean): Omit<BlogPost, 'id'> => {
    return {
      title: { ko: title.ko.trim(), ...(title.en?.trim() ? { en: title.en.trim() } : {}) },
      slug: slug.trim(),
      content: { ko: content.ko.trim(), ...(content.en?.trim() ? { en: content.en.trim() } : {}) },
      excerpt:
        excerpt.ko.trim() || excerpt.en?.trim()
          ? { ko: excerpt.ko.trim(), ...(excerpt.en?.trim() ? { en: excerpt.en.trim() } : {}) }
          : undefined,

      categoryId: categoryId || undefined,
      published: publishedOverride !== undefined ? publishedOverride : published,

      tags: tags.length > 0 ? tags : undefined,
      thumbnail: thumbnail.trim() ? thumbnail.trim() : undefined,
      featuredImage: featuredImage.trim() ? featuredImage.trim() : undefined,
      authorName: authorName.trim() ? authorName.trim() : undefined,
      authorImage: authorImage.trim() ? authorImage.trim() : undefined,

      editorType,
      saveFormat,

      enabled: { ko: enabledKo, en: enabledEn },

      metaTitle:
        metaTitle.ko.trim() || metaTitle.en?.trim()
          ? { ko: metaTitle.ko.trim(), ...(metaTitle.en?.trim() ? { en: metaTitle.en.trim() } : {}) }
          : undefined,
      metaDescription:
        metaDescription.ko.trim() || metaDescription.en?.trim()
          ? { ko: metaDescription.ko.trim(), ...(metaDescription.en?.trim() ? { en: metaDescription.en.trim() } : {}) }
          : undefined,
      metaKeywords: metaKeywords.length ? metaKeywords : undefined,

      isFeatured: isFeatured || undefined,
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
      console.log('[BlogForm] 저장할 payload:', {
        authorName: payload.authorName,
        authorImage: payload.authorImage,
        hasAuthorName: 'authorName' in payload,
        hasAuthorImage: 'authorImage' in payload,
      });
      if (mode === 'create') {
        const newId = await createBlogPost(payload);
        // published 상태 업데이트 (발행: true, 임시저장: false)
        setPublished(publishedOverride ?? false);
        router.push(`/admin/blog/${newId}`);
      } else {
        if (!id) throw new Error('id가 없습니다.');
        await updateBlogPost(id, payload);
        // published 상태 업데이트 (발행: true, 임시저장: false)
        setPublished(publishedOverride ?? false);
        alert('저장되었습니다.');
      }
    } catch (e: any) {
      setError(e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      await deleteBlogPost(id);
      router.push('/admin/blog');
    } catch (e: any) {
      alert('삭제 중 오류가 발생했습니다: ' + (e?.message || '알 수 없는 오류'));
    }
  };

  const handleUpload = async (file: File, target: 'thumbnail' | 'featuredImage' | 'authorImage') => {
    setError(null);
    setSaving(true);
    try {
      const res = await uploadImage(file, {
        maxWidth: target === 'thumbnail' ? 800 : target === 'authorImage' ? 400 : 1600,
        target: target === 'authorImage' ? 'authorImage' : 'editor',
      });
      if (target === 'thumbnail') setThumbnail(res.originalUrl);
      else if (target === 'featuredImage') setFeaturedImage(res.originalUrl);
      else if (target === 'authorImage') {
        // authorImage는 원본 이미지이므로 originalUrl 사용
        setAuthorImage(res.originalUrl);
      }
    } catch (e: any) {
      setError(e?.message || '이미지 업로드에 실패했습니다.');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{pageTitle}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <p style={{ color: '#6b7280', margin: 0 }}>
                블로그 포스트를 관리합니다.
              </p>
              {mode === 'edit' && currentPost && (
                <>
                  {currentPost.createdAt && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      작성일: {new Date(currentPost.createdAt).toLocaleDateString()}
                    </span>
                  )}
                  {currentPost.updatedAt && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      수정일: {new Date(currentPost.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  {currentPost.createdBy && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      작성자: {admins.get(currentPost.createdBy)?.name || '알 수 없음'}
                    </span>
                  )}
                  {currentPost.updatedBy && currentPost.updatedBy !== currentPost.createdBy && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      수정자: {admins.get(currentPost.updatedBy)?.name || '알 수 없음'}
                    </span>
                  )}
                  {currentPost.views !== undefined && (
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      조회수: {currentPost.views.toLocaleString()}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          {mode === 'edit' && id && (
            <button
              onClick={handleDelete}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#dc2626',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {error ? <div style={{ padding: '0.75rem', border: '1px solid #f0b3b3', background: '#fff5f5', color: '#b42318', borderRadius: 8, marginBottom: 12 }}>{error}</div> : null}

      {/* 기본 정보 */}
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>기본 정보</h2>
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>제목(ko) <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={title.ko || ''} onChange={(e) => setTitle((p) => ({ ...p, ko: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>제목(en)</label>
            <input value={title.en || ''} onChange={(e) => setTitle((p) => ({ ...p, en: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>slug <span style={{ color: '#dc2626' }}>*</span></label>
            <p style={helpTextStyle}>URL에 사용될 고유 식별자입니다.</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={slug || ''}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="my-post"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  setSlugTouched(true);
                  const base = title.en?.trim() ? title.en.trim() : title.ko.trim();
                  setSlug(slugify(base));
                }}
                style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                자동 생성
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>카테고리</label>
            <p style={helpTextStyle}>블로그 포스트가 속할 카테고리를 선택합니다. (선택사항)</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="">미분류</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name?.ko || c.slug}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                관리
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail, Featured Image 입력 폼 - 현재 사용하지 않음 */}
        {/* <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Thumbnail</label>
            <p style={helpTextStyle}>블로그 포스트 썸네일 이미지 URL을 입력하거나 파일을 업로드합니다.</p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <input value={thumbnail || ''} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://..." style={inputStyle} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f, 'thumbnail');
                }}
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Featured Image</label>
            <p style={helpTextStyle}>블로그 포스트 대표 이미지 URL을 입력하거나 파일을 업로드합니다.</p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <input value={featuredImage || ''} onChange={(e) => setFeaturedImage(e.target.value)} placeholder="https://..." style={inputStyle} />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f, 'featuredImage');
                }}
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div> */}

        {/* 저자명 및 이미지 */}
        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>저자명</label>
            <p style={helpTextStyle}>블로그 포스트의 저자명을 입력합니다.</p>
            <input
              type="text"
              value={authorName || ''}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="저자명을 입력하세요"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>사진 이미지</label>
            <p style={helpTextStyle}>저자 이미지 파일을 선택합니다.</p>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <input
                type="text"
                value={authorImage || ''}
                onChange={(e) => setAuthorImage(e.target.value)}
                placeholder="https://... 또는 파일 업로드"
                style={inputStyle}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    void handleUpload(f, 'authorImage');
                  }
                }}
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ ...rowStyle, marginTop: '1.5rem' }}>
          <div>
            <label style={labelStyle}>추천 포스트</label>
            <p style={helpTextStyle}>추천 포스트로 표시할지 설정합니다.</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              <span>추천 포스트로 표시</span>
            </label>
          </div>
          <div>
            <label style={labelStyle}>활성화</label>
            <p style={helpTextStyle}>언어별 노출 여부를 설정합니다.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={enabledKo} onChange={(e) => setEnabledKo(e.target.checked)} />
                <span>KO</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={enabledEn} onChange={(e) => setEnabledEn(e.target.checked)} />
                <span>EN</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
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

      {/* 태그 */}
      <div style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>태그</h2>
        <p style={helpTextStyle}>쉼표(,) 또는 Enter로 태그를 추가합니다.</p>
        <div style={{ position: 'relative' }}>
          <input
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            onCompositionStart={() => {
              isComposingRef.current = true;
              setIsComposing(true);
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
              setIsComposing(false);
            }}
            placeholder="태그 입력..."
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              style={{ padding: '0.35rem 0.75rem', borderRadius: '999px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
            >
              #{tag} ✕
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', marginTop: '2rem' }}>
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          목록
        </button>
        {mode === 'edit' && id && (
          <Link
            href={`/admin/blog/${id}/view`}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#111827',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
              minWidth: '130px',
              textAlign: 'center',
            }}
          >
            미리보기
          </Link>
        )}
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

      <BlogCategoryModal
        open={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          void (async () => {
            try {
              const list = await getBlogCategories();
              setCategories(list);
            } catch {
              // ignore
            }
          })();
        }}
        onSelect={(c) => setCategoryId(c.id || '')}
      />
    </div>
  );
}


