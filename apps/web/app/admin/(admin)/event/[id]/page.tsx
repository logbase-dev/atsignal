'use client';

import { EventForm } from '@/components/admin/event/EventForm';

export default function EditEventPage({ params }: { params: { id: string } }) {
  return <EventForm mode="edit" id={params.id} />;
}

