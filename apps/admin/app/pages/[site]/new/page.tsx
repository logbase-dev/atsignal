'use client';

import { useParams } from 'next/navigation';
import { PageEditor } from '@/components/pages/PageEditor';
import type { Site } from '@/lib/admin/types';

export default function NewPagePage() {
  const params = useParams();
  const site = (params.site as Site) || 'web';

  return <PageEditor site={site} pageId={null} />;
}

