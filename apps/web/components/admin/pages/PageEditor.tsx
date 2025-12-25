'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePageEditor } from '@/src/features/pages/hooks/usePageEditor';
import { PageEditorLayout } from './PageEditorLayout';
import { PageEditorForm } from './PageEditorForm';
import type { Site } from '@/lib/admin/types';
import { getAdminApiUrl } from '@/lib/admin/api';

interface PageEditorProps {
  site: Site;
  pageId: string | null;
}

export function PageEditor({ site, pageId }: PageEditorProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());

  const { page, menuOptions, loading, error, submitting, handleSaveDraft, handlePublish, handlePreview, handleDelete } =
    usePageEditor(site, pageId);

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

  const handleBack = () => {
    router.push(`/admin/menus/${site}`);
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
        <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c' }}>{error}</div>
      </PageEditorLayout>
    );
  }

  return (
    <PageEditorLayout site={site} pageId={pageId} onBack={handleBack} onDelete={pageId ? handleDelete : undefined}>
      <PageEditorForm
        site={site}
        pageId={pageId}
        initialPage={page}
        menuOptions={menuOptions}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onPreview={handlePreview}
        submitting={submitting}
        admins={admins}
      />
    </PageEditorLayout>
  );
}


