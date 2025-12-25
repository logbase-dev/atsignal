'use client';

import { useRouter } from 'next/navigation';
import { PageList } from '@/src/features/pages/components/PageList';
import { usePages } from '@/src/features/pages/hooks/usePages';
import type { Page, Site } from '@/lib/admin/types';
import { buildPreviewUrl } from '@/lib/admin/preview';

interface PageManagementProps {
  site: Site;
  title: string;
}

export function PageManagement({ site, title }: PageManagementProps) {
  const router = useRouter();
  const { pages, menus, loading, error, handleDelete } = usePages(site);

  const handleDeleteWithConfirm = async (pageId: string) => {
    if (!pageId) return;
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    try {
      await handleDelete(pageId);
    } catch {
      alert('페이지 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCreate = () => {
    router.push(`/pages/${site}/new`);
  };

  const handleEdit = (page: { id?: string }) => {
    if (page.id) {
      router.push(`/pages/${site}/${page.id}`);
    }
  };

  const handlePreview = (page: Page, locale: 'ko' | 'en') => {
    if (!page.id) return;
    const url = buildPreviewUrl(site, page.slug, locale, page.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{title}</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>메뉴와 연결된 페이지를 한국어/영문 동시 입력 방식으로 관리합니다.</p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          페이지 추가
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      )}

      <PageList
        pages={pages}
        menus={menus}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(page) => handleDeleteWithConfirm(page.id!)}
        onPreview={handlePreview}
      />
    </div>
  );
}

