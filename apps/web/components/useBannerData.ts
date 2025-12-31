import { useEffect, useState } from 'react';
import { getPublicNotices } from '@/lib/public/noticeService';
import { getPublicEvents } from '@/lib/public/eventService';
import type { Notice, Event } from '@/lib/admin/types';

export interface BannerItem {
  id: string;
  text: string;
  link: string;
  type: 'notice' | 'event';
}

export function useBannerData() {
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        setIsLoading(true);
        const now = new Date();
        
        console.log('[useBannerData] API 호출 시작');
        
        // 공지사항과 이벤트를 병렬로 가져오기
        const [noticesResponse, eventsResponse] = await Promise.all([
          getPublicNotices({
            page: 1,
            limit: 10,
            published: true,
            showInBanner: true,
          }).catch(err => {
            console.error('[useBannerData] Notice API 실패:', err);
            return { notices: [], total: 0, page: 1, limit: 10, totalPages: 0 };
          }),
          getPublicEvents({
            page: 1,
            limit: 10,
            published: true,
            showInBanner: true,
          }).catch(err => {
            console.error('[useBannerData] Event API 실패:', err);
            return { events: [], total: 0, page: 1, limit: 10, totalPages: 0 };
          }),
        ]);
        
        console.log('[useBannerData] API 호출 성공:', {
          notices: noticesResponse.notices.length,
          events: eventsResponse.events.length,
        });
        
        // 공지사항 필터링 및 변환
        const validNotices: BannerItem[] = noticesResponse.notices
          .filter((notice: Notice) => {
            // showInBanner가 true인지 확인
            if (!notice.showInBanner) return false;
            
            // displayStartAt과 displayEndAt 사이에 있는지 확인
            if (notice.displayStartAt || notice.displayEndAt) {
              const startAt = notice.displayStartAt ? new Date(notice.displayStartAt) : null;
              const endAt = notice.displayEndAt ? new Date(notice.displayEndAt) : null;
              
              if (startAt && now < startAt) return false;
              if (endAt && now > endAt) return false;
            }
            
            // oneLiner가 있는지 확인
            if (!notice.oneLiner?.ko) return false;
            
            return true;
          })
          .map((notice: Notice) => ({
            id: notice.id || '',
            text: `[공지] ${notice.oneLiner.ko}`,
            link: `/notice/${notice.id}`,
            type: 'notice' as const,
            publishedAt: notice.publishedAt ? new Date(notice.publishedAt) : notice.createdAt ? new Date(notice.createdAt) : new Date(0),
          }));
        
        // 이벤트 필터링 및 변환
        const validEvents: BannerItem[] = eventsResponse.events
          .filter((event: Event) => {
            // showInBanner가 true인지 확인
            if (!event.showInBanner) return false;
            
            // displayStartAt과 displayEndAt 사이에 있는지 확인
            if (event.displayStartAt || event.displayEndAt) {
              const startAt = event.displayStartAt ? new Date(event.displayStartAt) : null;
              const endAt = event.displayEndAt ? new Date(event.displayEndAt) : null;
              
              if (startAt && now < startAt) return false;
              if (endAt && now > endAt) return false;
            }
            
            // oneLiner가 있는지 확인
            if (!event.oneLiner?.ko) return false;
            
            return true;
          })
          .map((event: Event) => ({
            id: event.id || '',
            text: `[이벤트] ${event.oneLiner.ko}`,
            link: `/event/${event.id}`,
            type: 'event' as const,
            publishedAt: event.publishedAt ? new Date(event.publishedAt) : event.createdAt ? new Date(event.createdAt) : new Date(0),
          }));
        
        // 공지사항과 이벤트 합치기
        const allItems: (BannerItem & { publishedAt?: Date })[] = [...validNotices, ...validEvents];
        
        // 최신글 순서로 정렬 (publishedAt 또는 createdAt 기준)
        allItems.sort((a, b) => {
          const dateA = a.publishedAt?.getTime() || 0;
          const dateB = b.publishedAt?.getTime() || 0;
          return dateB - dateA; // 최신순 (내림차순)
        });
        
        // 최대 5개만 선택 (publishedAt 제거)
        setBannerItems(allItems.slice(0, 5).map(({ publishedAt, ...item }) => item));
      } catch (error) {
        console.error('[Home] 롤링 배너 데이터 가져오기 실패:', error);
        // 에러 발생 시 빈 배열로 설정
        setBannerItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBannerData();
  }, []);

  return { bannerItems, isLoading };
}