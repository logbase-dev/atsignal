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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

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

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      paddingBottom: '2rem'
    }}>

      <div className="hero-sub">
        <div className="hero-container-sub">
          <h1>atsignal Events</h1>
          <p>설명 문구가 들어가는 곳입니다.</p>
          {/* <p>수집 로그 규모에 따라 가장 적합한 요금제를 선택하세요.</p> */}
        </div>
      </div>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        paddingTop: '2rem',
      }}>

        {/* 메인 이벤트 */}
        {initialMainEvent && (
          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              {t.mainEvent}
            </h2>
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
          </section>
        )}

        {/* 서브 이벤트 */}
        {initialSubEvents.length > 0 && (
          <section style={{ marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              {t.subEvents}
            </h2>
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
          </section>
        )}

        {/* 기타 이벤트 (아코디언) */}
        {otherEvents.length > 0 && (
          <section>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              {t.otherEvents}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {otherEvents.map((event) => (
                <div key={event.id} style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}>
                  <button
                    onClick={() => toggleEventExpansion(event.id!)}
                    style={{
                      width: '100%',
                      padding: '1.5rem',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
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
                      <div style={{ marginLeft: '1rem' }}>
                        <svg
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            color: '#9ca3af',
                            transition: 'transform 0.2s ease',
                            transform: expandedEvents.has(event.id!) ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                  
                  {expandedEvents.has(event.id!) && (
                    <div style={{
                      padding: '0 1.5rem 1.5rem',
                      borderTop: '1px solid #e5e7eb',
                      backgroundColor: '#f8fafc',
                    }}>
                      <div style={{ paddingTop: '1rem' }}>
                        {event.description && (
                          <p style={{
                            color: '#374151',
                            marginBottom: '1rem',
                            lineHeight: '1.6',
                          }}>
                            {getLocalizedText(event.description)}
                          </p>
                        )}
                        {event.location && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            marginBottom: '1rem',
                          }}>
                            <svg style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span style={{ fontWeight: '500', marginRight: '0.5rem' }}>{t.location}:</span>
                            <span>{getLocalizedText(event.location)}</span>
                          </div>
                        )}
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
                  )}
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
          </section>
        )}

        {/* 이벤트가 없는 경우 */}
        {!initialMainEvent && initialSubEvents.length === 0 && otherEvents.length === 0 && (
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
        )}
      </div>
    </div>
  );
}