'use client';

import { useParams } from 'next/navigation';
import { PageEditor } from '@/components/pages/PageEditor';
import type { Site } from '@/lib/admin/types';

export default function EditPagePage() {
  const params = useParams();
  const site = (params.site as Site) || 'web';
  const pageId = params.id as string;

  return <PageEditor site={site} pageId={pageId} />;
}

