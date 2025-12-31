import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EventDetailPage from './EventDetailPage';

interface Props {
  params: {
    locale: string;
    id: string;
  };
}

// 서버사이드에서 API 호출하는 헬퍼 함수
async function fetchEventById(id: string) {
  try {
    const response = await fetch(`http://localhost:3000/api/resources/events/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.event || null;
  } catch (error) {
    console.error('[Server] Error fetching event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = params;
  
  try {
    const event = await fetchEventById(id);
    
    if (!event) {
      return {
        title: locale === 'ko' ? '이벤트를 찾을 수 없습니다 | AtSignal' : 'Event Not Found | AtSignal',
      };
    }

    const title = event.title[locale as 'ko' | 'en'] || event.title.ko;
    const description = event.oneLiner?.[locale as 'ko' | 'en'] || event.oneLiner?.ko || event.description?.[locale as 'ko' | 'en'] || event.description?.ko;

    return {
      title: `${title} | AtSignal`,
      description,
      openGraph: {
        title: `${title} | AtSignal`,
        description,
        images: event.featuredImage ? [event.featuredImage] : undefined,
      },
    };
  } catch (error) {
    console.error('[Event Detail] Error generating metadata:', error);
    return {
      title: locale === 'ko' ? '이벤트 | AtSignal' : 'Event | AtSignal',
    };
  }
}

export default async function Page({ params }: Props) {
  const { locale, id } = params;
  
  if (locale !== 'ko' && locale !== 'en') {
    notFound();
  }

  try {
    const event = await fetchEventById(id);
    
    if (!event) {
      notFound();
    }

    return (
      <EventDetailPage
        locale={locale as 'ko' | 'en'}
        event={event}
      />
    );
  } catch (error) {
    console.error('[Event Detail Page] Error loading event:', error);
    notFound();
  }
}