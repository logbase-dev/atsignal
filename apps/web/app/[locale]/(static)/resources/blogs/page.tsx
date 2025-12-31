import { Metadata } from 'next';
import BlogsPage from '@/components/resources/blogs/BlogsPage';
import { getPublicBlogs, getPublicBlogCategories } from '@/lib/public/blogService';

interface PageProps {
  params: { locale: 'ko' | 'en' };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  
  const titles = {
    ko: '블로그 - atsignal',
    en: 'Blog - atsignal'
  };
  
  const descriptions = {
    ko: 'atsignal의 최신 기술 블로그와 인사이트를 확인하세요',
    en: 'Check out the latest tech blog and insights from atsignal'
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function BlogsListPage({ params }: PageProps) {
  const { locale } = params;
  
  try {
    const [blogsResponse, categories] = await Promise.all([
      getPublicBlogs({ page: 1, limit: 20 }),
      getPublicBlogCategories(),
    ]);

    return (
      <BlogsPage
        locale={locale}
        initialBlogs={blogsResponse.blogs}
        initialTotal={blogsResponse.total}
        categories={categories}
      />
    );
  } catch (error) {
    console.error('Failed to load blogs:', error);
    return (
      <BlogsPage
        locale={locale}
        initialBlogs={[]}
        initialTotal={0}
        categories={[]}
      />
    );
  }
}