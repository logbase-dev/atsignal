'use client';

import { WhatsNewForm } from '@/components/admin/whatsnew/WhatsNewForm';

export default function EditWhatsNewPage({ params }: { params: { id: string } }) {
  return <WhatsNewForm mode="edit" id={params.id} />;
}

