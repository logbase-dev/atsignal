import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogDetailPage from '@/components/resources/blogs/BlogDetailPage';
import { getPublicBlogById, getPublicBlogCategories } from '@/lib/public/blogService';

interface PageProps {
  params: { locale: 'ko' | 'en'; id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params;
  
  try {
    const blog = await getPublicBlogById(id);
    
    if (!blog) {
      return {
        title: 'Blog Not Found - AtSignal',
        description: 'The requested blog post could not be found.',
      };
    }

    const title = blog.title?.[locale] || blog.title?.ko || 'Blog - AtSignal';
    const description = blog.excerpt?.[locale] || blog.excerpt?.ko || 'AtSignal Blog Post';

    return {
      title: `${title} - AtSignal`,
      description,
    };
  } catch (error) {
    return {
      title: 'Blog - AtSignal',
      description: 'AtSignal Blog Post',
    };
  }
}

export default async function BlogDetailPageRoute({ params }: PageProps) {
  const { locale, id } = params;
  
  try {
    const [blog, categories] = await Promise.all([
      getPublicBlogById(id),
      getPublicBlogCategories(),
    ]);

    if (!blog) {
      notFound();
    }

    return (
      <BlogDetailPage
        locale={locale}
        blog={blog}
        categories={categories}
      />
    );
  } catch (error) {
    console.error('Failed to load blog:', error);
    notFound();
  }
}