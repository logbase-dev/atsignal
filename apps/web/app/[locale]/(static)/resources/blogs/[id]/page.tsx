import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogDetailPage from '@/components/resources/blogs/BlogDetailPage';
import { getPublicBlogById, getPublicBlogBySlug, getPublicBlogCategories } from '@/lib/public/blogService';

interface PageProps {
  params: { locale: 'ko' | 'en'; id: string };
}

// slug인지 ID인지 판단하는 함수 (Firestore ID는 보통 20자 이상의 랜덤 문자열이고 하이픈이 없음)
function isFirestoreId(value: string): boolean {
  // Firestore ID는 20자 이상, 영숫자만, 하이픈 없음
  return value.length >= 20 && /^[a-zA-Z0-9]+$/.test(value) && !value.includes('-');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params;
  
  try {
    // slug인지 ID인지 판단해서 적절한 함수 호출
    const blog = isFirestoreId(id) 
      ? await getPublicBlogById(id)
      : await getPublicBlogBySlug(id);
    
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
      // slug인지 ID인지 판단해서 적절한 함수 호출
      isFirestoreId(id) 
        ? getPublicBlogById(id)
        : getPublicBlogBySlug(id),
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