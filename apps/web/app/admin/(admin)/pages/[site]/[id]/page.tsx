'use client';

import { useParams } from 'next/navigation';
import { PageEditor } from '@/components/admin/pages/PageEditor';
import type { Site } from '@/lib/admin/types';

export default function EditAdminPage() {
  const params = useParams();
  const site = (params.site as Site) || 'web';
  const pageId = params.id as string;
  return <PageEditor site={site} pageId={pageId} />;
}


