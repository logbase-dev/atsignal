import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import NoticeDetailPage from '@/components/resources/notices/NoticeDetailPage';
import { getPublicNoticeById } from '@/lib/public/noticeService';

interface PageProps {
  params: { locale: 'ko' | 'en'; id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params;
  
  try {
    const notice = await getPublicNoticeById(id);
    
    if (!notice) {
      return {
        title: 'Notice Not Found - AtSignal',
        description: 'The requested notice could not be found.',
      };
    }

    const title = notice.title?.[locale] || notice.title?.ko || 'Notice - AtSignal';
    const description = notice.oneLiner?.[locale] || notice.oneLiner?.ko || 'AtSignal Notice';

    return {
      title: `${title} - AtSignal`,
      description,
    };
  } catch (error) {
    return {
      title: 'Notice - AtSignal',
      description: 'AtSignal Notice',
    };
  }
}

export default async function NoticeDetailPageRoute({ params }: PageProps) {
  const { locale, id } = params;
  
  try {
    const notice = await getPublicNoticeById(id);

    if (!notice) {
      notFound();
    }

    return (
      <NoticeDetailPage
        locale={locale}
        notice={notice}
      />
    );
  } catch (error) {
    console.error('Failed to load notice:', error);
    notFound();
  }
}