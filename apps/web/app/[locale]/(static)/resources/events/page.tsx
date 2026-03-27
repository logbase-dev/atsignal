import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicApiUrl } from '@/lib/utils/api';
import EventsPage from './EventsPage';

interface Props {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = params;
  
  return {
    title: locale === 'ko' ? '이벤트 | atsignal' : 'Events | atsignal',
    description: locale === 'ko' 
      ? 'atsignal의 최신 이벤트와 소식을 확인하세요.' 
      : 'Check out the latest events and news from atsignal.',
  };
}

// 서버사이드에서 API 호출하는 헬퍼 함수들
async function fetchEvents() {
  try {
    const url = `${getPublicApiUrl('resources/events')}?page=1&limit=50&published=true`;
    console.log('[Server] Fetching events from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('[Server] Error fetching events:', error);
    return [];
  }
}

function getMainEvent(events: any[]) {
  return events.find(event => event.isMainEvent) || null;
}

function getSubEvents(events: any[]) {
  return events
    .filter(event => event.subEventOrder !== undefined && event.subEventOrder > 0)
    .sort((a, b) => (a.subEventOrder || 0) - (b.subEventOrder || 0))
    .slice(0, 3);
}

function getOtherEvents(events: any[]) {
  return events.filter(event => 
    !event.isMainEvent && 
    (!event.subEventOrder || event.subEventOrder <= 0)
  );
}

export default async function Page({ params }: Props) {
  const { locale } = params;
  
  if (locale !== 'ko' && locale !== 'en') {
    notFound();
  }

  try {
    // 서버사이드에서 초기 데이터 로드
    const allEvents = await fetchEvents();
    const mainEvent = getMainEvent(allEvents);
    const subEvents = getSubEvents(allEvents);
    const otherEvents = getOtherEvents(allEvents);

    return (
      <EventsPage
        locale={locale as 'ko' | 'en'}
        initialMainEvent={mainEvent}
        initialSubEvents={subEvents}
        initialOtherEvents={otherEvents.slice(0, 10)} // 처음 10개만
        initialTotal={otherEvents.length}
      />
    );
  } catch (error) {
    console.error('[Events Page] Error loading events:', error);
    
    // 에러 발생 시 빈 데이터로 클라이언트 렌더링
    return (
      <EventsPage
        locale={locale as 'ko' | 'en'}
        initialMainEvent={null}
        initialSubEvents={[]}
        initialOtherEvents={[]}
        initialTotal={0}
      />
    );
  }
}

// 5분마다 캐시 갱신
export const revalidate = 300;