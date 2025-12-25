'use client';

import { useRouter } from 'next/navigation';
import { usePageEditor } from '@/src/features/pages/hooks/usePageEditor';
import { PageEditorLayout } from './PageEditorLayout';
import { PageEditorForm } from './PageEditorForm';
import type { Site } from '@/lib/admin/types';

interface PageEditorProps {
  site: Site;
  pageId: string | null;
}

export function PageEditor({ site, pageId }: PageEditorProps) {
  const router = useRouter();
  const {
    page,
    menus,
    menuOptions,
    loading,
    error,
    submitting,
    handleSaveDraft,
    handlePublish,
    handlePreview,
    handleDelete,
  } = usePageEditor(site, pageId);

  const handleBack = () => {
    router.push(`/menus/${site}`);
  };

  if (loading) {
    return (
      <PageEditorLayout site={site} pageId={pageId} onBack={handleBack}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#6b7280' }}>페이지를 불러오는 중입니다...</p>
        </div>
      </PageEditorLayout>
    );
  }

  if (error) {
    return (
      <PageEditorLayout site={site} pageId={pageId} onBack={handleBack}>
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: '#fef2f2',
            color: '#b91c1c',
          }}
        >
          {error}
        </div>
      </PageEditorLayout>
    );
  }

  return (
    <PageEditorLayout
      site={site}
      pageId={pageId}
      onBack={handleBack}
      onDelete={pageId ? handleDelete : undefined}
    >
      <PageEditorForm
        site={site}
        pageId={pageId}
        initialPage={page}
        menuOptions={menuOptions}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onPreview={handlePreview}
        submitting={submitting}
      />
    </PageEditorLayout>
  );
}

