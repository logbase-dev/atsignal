'use client';

import { useParams } from 'next/navigation';
import { PageEditor } from '@/components/admin/pages/PageEditor';
import type { Site } from '@/lib/admin/types';

export default function NewAdminPage() {
  const params = useParams();
  const site = (params.site as Site) || 'web';
  return <PageEditor site={site} pageId={null} />;
}


