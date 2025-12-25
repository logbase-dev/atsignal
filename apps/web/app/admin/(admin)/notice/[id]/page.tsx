'use client';

import { NoticeForm } from '@/components/admin/notice/NoticeForm';

export default function EditNoticePage({ params }: { params: { id: string } }) {
  return <NoticeForm mode="edit" id={params.id} />;
}

