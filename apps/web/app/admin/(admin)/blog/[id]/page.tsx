'use client';

import { BlogForm } from '@/components/admin/blog/BlogForm';

export default function AdminBlogEditPage({ params }: { params: { id: string } }) {
  return <BlogForm mode="edit" id={params.id} />;
}


