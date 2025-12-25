'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getEvents, deleteEvent } from '@/lib/admin/eventService';
import { getEventParticipants } from '@/lib/admin/eventParticipantService';
import type { Event } from '@/lib/admin/types';
import { adminFetch } from '@/lib/admin/api';

export default function EventPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [mainEvent, setMainEvent] = useState<Event | null>(null);
  const [subEvents, setSubEvents] = useState<Event[]>([]);
  const [normalEvents, setNormalEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [admins, setAdmins] = useState<Map<string, { name: string; username: string }>>(new Map());
  const [participantCounts, setParticipantCounts] = useState<Map<string, number>>(new Map());
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [bannerFilter, setBannerFilter] = useState<string>('all');
  const [ctaButtonFilter, setCtaButtonFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const limit = 20;

  useEffect(() => {
    void loadAdmins();
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await adminFetch('admins');
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const adminMap = new Map<string, { name: string; username: string }>();
        (data.admins || []).forEach((admin: { id?: string; name: string; username: string }) => {
          if (admin.id) adminMap.set(admin.id, { name: admin.name, username: admin.username });
        });
        setAdmins(adminMap);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
    }
  };

  const loadParticipantCounts = async (eventIds: string[]) => {
    try {
      const counts = new Map<string, number>();
      await Promise.all(
        eventIds.map(async (eventId) => {
          try {
            const data = await getEventParticipants({ eventId, page: 1, limit: 1 });
            counts.set(eventId, data.total);
          } catch (err) {
            console.error(`Failed to load participant count for event ${eventId}:`, err);
            counts.set(eventId, 0);
          }
        })
      );
      setParticipantCounts(counts);
    } catch (err) {
      console.error('Failed to load participant counts:', err);
    }
  };

  const loadEvents = async (overrideFilters?: { publishedFilter?: string; bannerFilter?: string; ctaButtonFilter?: string; searchText?: string; page?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const effectivePublishedFilter = overrideFilters?.publishedFilter ?? publishedFilter;
      const effectiveBannerFilter = overrideFilters?.bannerFilter ?? bannerFilter;
      const effectiveCtaButtonFilter = overrideFilters?.ctaButtonFilter ?? ctaButtonFilter;
      const effectiveSearchText = overrideFilters?.searchText ?? searchText;
      const effectivePage = overrideFilters?.page ?? currentPage;

      const options: { page: number; limit: number; published?: boolean; showInBanner?: boolean; hasCtaButton?: boolean; search?: string } = {
        page: effectivePage,
        limit,
      };
      if (effectivePublishedFilter !== 'all') {
        options.published = effectivePublishedFilter === 'published';
      }
      if (effectiveBannerFilter !== 'all') {
        options.showInBanner = effectiveBannerFilter === 'true';
      }
      if (effectiveCtaButtonFilter !== 'all') {
        options.hasCtaButton = effectiveCtaButtonFilter === 'true';
      }
      if (effectiveSearchText && effectiveSearchText.trim()) {
        options.search = effectiveSearchText.trim();
      }

      const data = await getEvents(options);
      // 정렬: createdAt DESC (메인/서브 이벤트는 별도 처리)
      const sortedEvents = [...data.events].sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
      setEvents(sortedEvents);
      
      // 메인/서브/일반 이벤트 분리
      const main = sortedEvents.find((e) => e.isMainEvent) || null;
      const subs = sortedEvents
        .filter((e) => e.subEventOrder && [1, 2, 3].includes(e.subEventOrder))
        .sort((a, b) => (a.subEventOrder || 0) - (b.subEventOrder || 0));
      const normal = sortedEvents.filter((e) => !e.isMainEvent && !e.subEventOrder);
      
      setMainEvent(main);
      setSubEvents(subs);
      setNormalEvents(normal);
      
      setTotalPages(data.totalPages);
      setTotal(data.total);
      
      // 참가자 수 로드
      if (sortedEvents.length > 0) {
        void loadParticipantCounts(sortedEvents.map((e) => e.id!).filter(Boolean));
      }
      
      if (data.events.length === 0 && data.total === 0) {
        console.warn('이벤트가 없거나 API/Firestore 연결에 문제가 있을 수 있습니다.');
      }
    } catch (e: any) {
      console.error('Failed to load events:', e);
      setError(e.message || '이벤트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteEvent(id);
        await loadEvents();
      } catch (e) {
        console.error('Failed to delete event:', e);
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void loadEvents();
  };

  const handleReset = () => {
    setPublishedFilter('all');
    setBannerFilter('all');
    setCtaButtonFilter('all');
    setSearchText('');
    setCurrentPage(1);
    void loadEvents({ publishedFilter: 'all', bannerFilter: 'all', ctaButtonFilter: 'all', searchText: '', page: 1 });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1500px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>이벤트 관리</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href="/admin/event/new"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            이벤트 추가
          </Link>
        </div>
      </div>

      {/* 검색 필터 */}
      <div
        style={{
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          {/* 제목/내용 검색 */}
          <div style={{ flex: '1 1 250px', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              제목/내용 검색
            </label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="검색어를 입력하세요"
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* 발행 상태 검색 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              발행 상태
            </label>
            <select
              value={publishedFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setPublishedFilter(newValue);
                setCurrentPage(1);
                void loadEvents({ publishedFilter: newValue, page: 1 });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">전체</option>
              <option value="published">발행</option>
              <option value="draft">초안</option>
            </select>
          </div>

          {/* 배너 노출 검색 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              배너 노출
            </label>
            <select
              value={bannerFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setBannerFilter(newValue);
                setCurrentPage(1);
                void loadEvents({ bannerFilter: newValue, page: 1 });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">전체</option>
              <option value="true">노출</option>
              <option value="false">미노출</option>
            </select>
          </div>

          {/* CTA 버튼 검색 */}
          <div style={{ flex: '1 1 150px', minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
              CTA 버튼
            </label>
            <select
              value={ctaButtonFilter}
              onChange={(e) => {
                const newValue = e.target.value;
                setCtaButtonFilter(newValue);
                setCurrentPage(1);
                void loadEvents({ ctaButtonFilter: newValue, page: 1 });
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
              }}
            >
              <option value="all">전체</option>
              <option value="true">있음</option>
              <option value="false">없음</option>
            </select>
          </div>

          {/* 검색 버튼 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSearch}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              검색
            </button>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
            color: '#856404',
          }}
        >
          <strong>경고:</strong> {error}
        </div>
      ) : null}

      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
        총 {total}개의 이벤트
        {(mainEvent || subEvents.length > 0 || normalEvents.length > 0) && (
          <span style={{ marginLeft: '0.5rem' }}>
            ({mainEvent && '메인: 1개'}
            {mainEvent && subEvents.length > 0 && ', '}
            {subEvents.length > 0 && `서브: ${subEvents.length}개`}
            {(mainEvent || subEvents.length > 0) && normalEvents.length > 0 && ', '}
            {normalEvents.length > 0 && `일반: ${normalEvents.length}개`})
          </span>
        )}
        {totalPages > 1 && (
          <span style={{ marginLeft: '0.5rem' }}>
            (페이지 {currentPage} / {totalPages})
          </span>
        )}
      </div>

      {/* 메인 이벤트 카드 */}
      {mainEvent && (
        <div
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: '#fff',
            borderRadius: '0.75rem',
            border: '2px solid #ffc107',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ffc107', color: '#000', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold', marginRight: '1rem' }}>
              메인 이벤트
            </span>
            <h3 style={{ margin: 0, flex: 1 }}>{mainEvent.title?.ko || '-'}</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                href={`/admin/event/${mainEvent.id}`}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                수정
              </Link>
              <button
                onClick={() => handleDelete(mainEvent.id!)}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem' }}
                type="button"
              >
                삭제
              </button>
            </div>
          </div>
          {mainEvent.thumbnailImage && (
            <img
              src={mainEvent.thumbnailImage}
              alt="메인 이벤트 썸네일"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
            <div>한 줄 문구: {mainEvent.oneLiner?.ko || '-'}</div>
            <div>이벤트 기간: {mainEvent.eventStartAt && mainEvent.eventEndAt ? `${new Date(mainEvent.eventStartAt).toLocaleDateString()} ~ ${new Date(mainEvent.eventEndAt).toLocaleDateString()}` : '-'}</div>
            <div>발행 상태: {mainEvent.published ? <span style={{ color: '#28a745' }}>발행</span> : <span style={{ color: '#666' }}>초안</span>}</div>
            <div>조회수: {mainEvent.views !== undefined ? mainEvent.views.toLocaleString() : '0'}</div>
          </div>
        </div>
      )}

      {/* 서브 이벤트 카드 그리드 */}
      {subEvents.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>서브 이벤트</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[1, 2, 3].map((order) => {
              const subEvent = subEvents.find((e) => e.subEventOrder === order);
              return (
                <div
                  key={order}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#fff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    minHeight: '200px',
                  }}
                >
                  {subEvent ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          서브 {order}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <Link
                            href={`/admin/event/${subEvent.id}`}
                            style={{
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#666',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              textDecoration: 'none',
                              fontSize: '0.75rem',
                            }}
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => handleDelete(subEvent.id!)}
                            style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                            type="button"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                      {subEvent.thumbnailImage && (
                        <img
                          src={subEvent.thumbnailImage}
                          alt="서브 이벤트 썸네일"
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '0.75rem' }}
                        />
                      )}
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>{subEvent.title?.ko || '-'}</h4>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                        {subEvent.oneLiner?.ko || '-'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {subEvent.eventStartAt && subEvent.eventEndAt ? `${new Date(subEvent.eventStartAt).toLocaleDateString()} ~ ${new Date(subEvent.eventEndAt).toLocaleDateString()}` : '-'}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#ccc', padding: '2rem 0' }}>
                      <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>서브 이벤트 {order}</div>
                      <div style={{ fontSize: '0.875rem' }}>비어있음</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 일반 이벤트 아코디언 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>일반 이벤트</h3>
        {normalEvents.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb', color: '#666' }}>
            일반 이벤트가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {normalEvents.map((event) => {
              const isExpanded = expandedEvents.has(event.id!);
              return (
                <div
                  key={event.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '1rem',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? '#f9fafb' : '#fff',
                    }}
                    onClick={() => {
                      const newExpanded = new Set(expandedEvents);
                      if (isExpanded) {
                        newExpanded.delete(event.id!);
                      } else {
                        newExpanded.add(event.id!);
                      }
                      setExpandedEvents(newExpanded);
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {event.thumbnailImage && (
                        <img
                          src={event.thumbnailImage}
                          alt="썸네일"
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.25rem' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{event.title?.ko || '-'}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                          {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : '-'} | 
                          {event.published ? <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>발행</span> : <span style={{ color: '#666', marginLeft: '0.5rem' }}>초안</span>} |
                          조회수: {event.views !== undefined ? event.views.toLocaleString() : '0'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.25rem', color: '#666' }}>{isExpanded ? '−' : '+'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        <div>한 줄 문구: {event.oneLiner?.ko || '-'}</div>
                        <div>이벤트 기간: {event.eventStartAt && event.eventEndAt ? `${new Date(event.eventStartAt).toLocaleDateString()} ~ ${new Date(event.eventEndAt).toLocaleDateString()}` : '-'}</div>
                        <div>배너 노출: {event.showInBanner ? <span style={{ color: '#28a745' }}>노출</span> : <span style={{ color: '#666' }}>미노출</span>}</div>
                        <div>CTA 버튼: {event.hasCtaButton ? <span style={{ color: '#28a745' }}>있음</span> : <span style={{ color: '#666' }}>없음</span>}</div>
                        <div>작성자: {event.createdBy ? admins.get(event.createdBy)?.name || '알 수 없음' : '-'}</div>
                        <div>
                          참가자: {event.hasCtaButton && event.id ? (
                            <Link
                              href={`/admin/event/${event.id}/participants`}
                              style={{ color: '#0070f3', textDecoration: 'none' }}
                            >
                              {participantCounts.get(event.id) || 0}명
                            </Link>
                          ) : '-'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          href={`/admin/event/${event.id}/view`}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#0070f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                          }}
                        >
                          상세보기
                        </Link>
                        <Link
                          href={`/admin/event/${event.id}`}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                          }}
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id!)}
                          style={{ padding: '0.5rem 1rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.875rem' }}
                          type="button"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              void loadEvents({ page: Math.max(1, currentPage - 1) });
            }}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === 1 ? '#e5e5e5' : '#0070f3',
              color: currentPage === 1 ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            이전
          </button>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pageNum);
                    void loadEvents({ page: pageNum });
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: currentPage === pageNum ? '#0070f3' : '#fff',
                    color: currentPage === pageNum ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    minWidth: '2.5rem',
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              void loadEvents({ page: Math.min(totalPages, currentPage + 1) });
            }}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: currentPage === totalPages ? '#e5e5e5' : '#0070f3',
              color: currentPage === totalPages ? '#999' : 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

