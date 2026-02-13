'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/lib/admin/types';
import { getOtherEvents } from '@/lib/resources/events/eventService';

interface Props {
  locale: 'ko' | 'en';
  initialMainEvent: Event | null;
  initialSubEvents: Event[];
  initialOtherEvents: Event[];
  initialTotal: number;
}

export default function EventsPage({
  locale,
  initialMainEvent,
  initialSubEvents,
  initialOtherEvents,
  initialTotal,
}: Props) {
  const [otherEvents, setOtherEvents] = useState(initialOtherEvents);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);

  const texts = {
    ko: {
      title: '이벤트',
      subtitle: 'AtSignal의 최신 이벤트와 소식을 확인하세요',
      mainEvent: '메인 이벤트',
      subEvents: '주요 이벤트',
      otherEvents: '기타 이벤트',
      loadMore: '더 보기',
      viewDetails: '자세히 보기',
      period: '기간',
      location: '장소',
      noEvents: '진행 중인 이벤트가 없습니다.',
      loading: '이벤트를 불러오는 중...',
    },
    en: {
      title: 'Events',
      subtitle: 'Check out the latest events and news from AtSignal',
      mainEvent: 'Main Event',
      subEvents: 'Featured Events',
      otherEvents: 'Other Events',
      loadMore: 'Load More',
      viewDetails: 'View Details',
      period: 'Period',
      location: 'Location',
      noEvents: 'No events are currently running.',
      loading: 'Loading events...',
    },
  };

  const t = texts[locale];

  const loadPageEvents = async (targetPage: number) => {
    if (loading || targetPage === page) return;
    
    setLoading(true);
    try {
      const response = await getOtherEvents({ page: targetPage, limit: 10 });
      setOtherEvents(response.events);
      setPage(targetPage);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getLocalizedText = (field: { ko: string; en?: string } | undefined) => {
    if (!field) return '';
    return field[locale] || field.ko || '';
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const startDate = event.eventStartAt ? new Date(event.eventStartAt) : null;
    const endDate = event.eventEndAt ? new Date(event.eventEndAt) : null;

    if (endDate && now > endDate) {
      return 'ended';
    } else if (startDate && now < startDate) {
      return 'upcoming';
    }
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return null;
    
    return (
      <span style={{
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '0.875rem',
        fontWeight: '500',
        backgroundColor: status === 'ended' ? '#fef2f2' : '#fefce8',
        color: status === 'ended' ? '#dc2626' : '#d97706',
        border: `1px solid ${status === 'ended' ? '#fecaca' : '#fed7aa'}`,
      }}>
        {status === 'ended' ? '종료된 이벤트' : '예정된 이벤트'}
      </span>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#000000',
      paddingBottom: '2rem'
    }}>

      <div className="hero-page">
        <div className="hero-page-container" style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '2rem',
          flexWrap: 'wrap',
          padding: '8rem 1rem', // padding 줄여서 위로 올림
          paddingTop: '8rem' // 상단 padding 줄임
        }}>
          <div style={{ 
            flexShrink: 0,
            maxWidth: '20%',
            minWidth: '150px',
            position: 'relative',
            marginTop: '-1rem', // 이미지만 더 위로 올림
// 2/12 김현득 마진 조정. 오른 쪽으로 조금 이동
            marginLeft: '1rem'
          }}>
            <Image
              src="/images/event_image.jpg"
              alt="atsignal event"
              width={0}
              height={0}
              sizes="20vw"
              style={{ width: '100%', height: 'auto', borderRadius: '12px' }}
              priority
            />
          </div>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ marginBottom: '0.5rem' }}>atsignal Events</h1>
            <p>atsignal과 관련된 다양한 세미나, 웨비나, 기타 행사 정보를 확인하실 수 있습니다.</p>
            {/* <p>추가문구가 들어갑니다.</p> */}
          </div>
        </div>
      </div>

      <div style={{ 
        maxWidth: '100%', 
        margin: '0 auto',
        paddingTop: initialMainEvent ? '0' : '2rem',
      }}>

        {/* 메인 이벤트 */}
        {initialMainEvent && (
          <section style={{ 
/*            backgroundColor: 'var(--main-500)', */
            backgroundColor: 'white',
            borderRadius: '0 0 60px 60px',
            padding: '5rem 0',
            position: 'relative',
            zIndex: 2,
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto',
              padding: '0 1rem',
            }}>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}>
                <Link href={`/${locale}/resources/events/${initialMainEvent.id}`}>
                  <div style={{ 
                    position: 'relative', 
                    height: '400px', 
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}>
                    {initialMainEvent.featuredImage ? (
                      <Image
                        src={initialMainEvent.featuredImage}
                        alt={getLocalizedText(initialMainEvent.title)}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                          <svg style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>No Image</span>
                        </div>
                      </div>
                    )}
                    
                    {/* 이벤트 상태 배지 */}
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                    }}>
                      {getStatusBadge(getEventStatus(initialMainEvent))}
                    </div>
                    
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3))',
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '2rem',
                      color: 'white',
                    }}>
                      <h3 style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        lineHeight: '1.2',
                      }}>
                        {getLocalizedText(initialMainEvent.title)}
                      </h3>
                      {initialMainEvent.oneLiner && (
                        <p style={{
                          fontSize: '1.125rem',
                          opacity: 0.9,
                          marginBottom: '1rem',
                          lineHeight: '1.4',
                        }}>
                          {getLocalizedText(initialMainEvent.oneLiner)}
                        </p>
                      )}
                      {(initialMainEvent.eventStartAt || initialMainEvent.eventEndAt) && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.875rem',
                          opacity: 0.8,
                        }}>
                          <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {formatDate(initialMainEvent.eventStartAt)}
                            {initialMainEvent.eventEndAt && ` - ${formatDate(initialMainEvent.eventEndAt)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 서브 이벤트 */}
        {initialSubEvents.length > 0 && (
          <section style={{ 
/*            backgroundColor: 'var(--main-400)', */
            backgroundColor: 'var(--gray-200)',
            borderRadius: '0 0 30px 30px',
            padding: '7rem 0',
            marginTop: '-30px',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto',
              padding: '0 1rem',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2rem',
              }}>
                {[1, 2, 3].map((order) => {
                  const subEvent = initialSubEvents.find((e) => e.subEventOrder === order);
                  return (
                    <div key={order} style={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      height: '100%',
                      minHeight: '350px',
                    }}>
                      {subEvent ? (
                        <Link
                          href={`/${locale}/resources/events/${subEvent.id}`}
                          style={{ 
                            textDecoration: 'none',
                            display: 'block',
                            height: '100%',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.parentElement!.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.parentElement!.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                          }}
                          >
                            <div style={{ position: 'relative', height: '200px' }}>
                              {subEvent.thumbnailImage ? (
                                <Image
                                  src={subEvent.thumbnailImage}
                                  alt={getLocalizedText(subEvent.title)}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  backgroundColor: '#e5e7eb',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                    <svg style={{ width: '2rem', height: '2rem', margin: '0 auto 0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span style={{ fontSize: '0.875rem' }}>No Image</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* 이벤트 상태 배지 */}
                              <div style={{
                                position: 'absolute',
                                top: '0.75rem',
                                right: '0.75rem',
                              }}>
                                {getStatusBadge(getEventStatus(subEvent))}
                              </div>
                            </div>
                            <div style={{ 
                              padding: '1.5rem',
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                            }}>
                              <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                color: '#1a1a1a',
                                marginBottom: '0.75rem',
                                lineHeight: '1.3',
                              }}>
                                {getLocalizedText(subEvent.title)}
                              </h3>
                              {subEvent.oneLiner && (
                                <p style={{
                                  color: '#666',
                                  marginBottom: '1rem',
                                  lineHeight: '1.5',
                                  fontSize: '0.875rem',
                                  flex: 1,
                                }}>
                                  {getLocalizedText(subEvent.oneLiner)}
                                </p>
                              )}
                              {(subEvent.eventStartAt || subEvent.eventEndAt) && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  fontSize: '0.75rem',
                                  color: '#9ca3af',
                                  marginTop: 'auto',
                                }}>
                                  <svg style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>
                                    {formatDate(subEvent.eventStartAt)}
                                    {subEvent.eventEndAt && ` - ${formatDate(subEvent.eventEndAt)}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div style={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#d1d5db',
                          backgroundColor: '#f9fafb',
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {locale === 'ko' ? `주요 이벤트 ${order}` : `Featured Event ${order}`}
                            </div>
                            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>
                              {locale === 'ko' ? '준비 중' : 'Coming Soon'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 기타 이벤트 */}
        {otherEvents.length > 0 && (
          <section style={{
/*            backgroundColor: 'var(--main-300)', */
            backgroundColor: 'var(--gray-200)',
            borderRadius: '0 0 30px 30px',
            padding: '7rem 0 4rem',
            marginTop: '-30px',
            position: 'relative',
            zIndex: 0,
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto',
              padding: '0 1rem',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {otherEvents.map((event) => (
                  <div key={event.id} style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1a1a1a',
                          marginBottom: '0.5rem',
                        }}>
                          {getLocalizedText(event.title)}
                        </h3>
                        {event.oneLiner && (
                          <p style={{
                            color: '#666',
                            marginBottom: '0.75rem',
                            fontSize: '0.875rem',
                            lineHeight: '1.4',
                          }}>
                            {getLocalizedText(event.oneLiner)}
                          </p>
                        )}
                        {(event.eventStartAt || event.eventEndAt) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: '#9ca3af',
                          }}>
                            <svg style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {formatDate(event.eventStartAt)}
                              {event.eventEndAt && ` - ${formatDate(event.eventEndAt)}`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ 
                        marginLeft: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.5rem',
                      }}>
                        {/* 이벤트 상태 배지 */}
                        {getStatusBadge(getEventStatus(event))}
                        
                        <Link
                          href={`/${locale}/resources/events/${event.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#20BDFF',
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            borderRadius: '8px',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1a9de6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#20BDFF';
                          }}
                        >
                          {t.viewDetails}
                          <svg style={{ marginLeft: '0.5rem', width: '1rem', height: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 - 항상 표시 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginTop: '2rem' 
              }}>
                <button
                  type="button"
                  onClick={() => loadPageEvents(page - 1)}
                  disabled={loading || page === 1 || Math.ceil(total / 10) <= 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: (loading || page === 1 || Math.ceil(total / 10) <= 1) ? '#e5e7eb' : '#20BDFF',
                    color: (loading || page === 1 || Math.ceil(total / 10) <= 1) ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: (loading || page === 1 || Math.ceil(total / 10) <= 1) ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  이전
                </button>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {Array.from({ length: Math.max(1, Math.ceil(total / 10)) }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => loadPageEvents(pageNum)}
                      disabled={loading || Math.ceil(total / 10) <= 1}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: pageNum === page ? '#20BDFF' : Math.ceil(total / 10) <= 1 ? '#e5e7eb' : '#fff',
                        color: pageNum === page ? 'white' : Math.ceil(total / 10) <= 1 ? '#999' : '#333',
                        border: '1px solid #ddd',
                        borderRadius: '0.25rem',
                        cursor: (loading || Math.ceil(total / 10) <= 1) ? 'not-allowed' : 'pointer',
                        minWidth: '2.5rem',
                        fontSize: '0.875rem',
                        fontWeight: pageNum === page ? '600' : '500',
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => loadPageEvents(page + 1)}
                  disabled={loading || page >= Math.ceil(total / 10) || Math.ceil(total / 10) <= 1}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: (loading || page >= Math.ceil(total / 10) || Math.ceil(total / 10) <= 1) ? '#e5e7eb' : '#20BDFF',
                    color: (loading || page >= Math.ceil(total / 10) || Math.ceil(total / 10) <= 1) ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: (loading || page >= Math.ceil(total / 10) || Math.ceil(total / 10) <= 1) ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  다음
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 이벤트가 없는 경우 */}
        {!initialMainEvent && initialSubEvents.length === 0 && otherEvents.length === 0 && (
          <section style={{
            backgroundColor: '#f9fafb',
            borderRadius: '0 0 12px 12px',
            padding: '2rem 0',
          }}>
            <div style={{ 
              maxWidth: '1200px', 
              margin: '0 auto',
              padding: '0 1rem',
            }}>
              <div style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  color: '#9ca3af',
                  fontSize: '1.125rem',
                  marginBottom: '1rem',
                }}>
                  <svg style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t.noEvents}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}