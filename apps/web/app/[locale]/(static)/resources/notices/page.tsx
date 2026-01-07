import { Metadata } from 'next';
import NoticesPage from '@/components/resources/notices/NoticesPage';
import { getPublicNotices } from '@/lib/public/noticeService';

interface PageProps {
  params: { locale: 'ko' | 'en' };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  
  const titles = {
    ko: '공지사항 - atsignal',
    en: 'Notices - atsignal'
  };
  
  const descriptions = {
    ko: 'atsignal의 최신 공지사항과 업데이트를 확인하세요',
    en: 'Check out the latest notices and updates from atsignal'
  };

  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

export default async function NoticesListPage({ params }: PageProps) {
  const { locale } = params;
  
  try {
    const noticesResponse = await getPublicNotices({ page: 1, limit: 20 });

    return (
      <NoticesPage
        locale={locale}
        initialNotices={noticesResponse.notices}
        initialTotal={noticesResponse.total}
      />
    );
  } catch (error) {
    console.error('Failed to load notices:', error);
    return (
      <NoticesPage
        locale={locale}
        initialNotices={[]}
        initialTotal={0}
      />
    );
  }
}

// 5분마다 캐시 갱신
export const revalidate = 300;