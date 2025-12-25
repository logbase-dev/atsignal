'use client';

import { useRouter } from 'next/navigation';
import type { Site } from '@/lib/admin/types';

interface PageEditorLayoutProps {
  site: Site;
  pageId: string | null;
  onBack: () => void;
  onDelete?: () => void | Promise<void>;
  children: React.ReactNode;
}

export function PageEditorLayout({ site, pageId, onBack, onDelete, children }: PageEditorLayoutProps) {
  const router = useRouter();
  const isNew = pageId === null;
  const siteLabel = site === 'web' ? 'Web' : 'Docs';
  const title = isNew ? `${siteLabel} 페이지 추가` : `${siteLabel} 페이지 수정`;

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      await onDelete();
      router.push(`/menus/${site}`); // /pages/${site}에서 변경
    } catch (err) {
      alert('페이지 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button
            onClick={onBack}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0 }}>{title}</h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              {site === 'web' ? 'Web 사이트' : 'Docs 사이트'} 페이지를 관리합니다.
            </p>
          </div>
          {!isNew && onDelete && (
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
      {children}
    </div>
  );
}

