'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/lib/admin/types';
import ContactModal from '@/components/common/ContactModal';

interface Props {
  locale: 'ko' | 'en';
  event: Event;
}

export default function EventDetailPage({ locale, event }: Props) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const texts = {
    ko: {
      backToEvents: '← 목록으로',
      period: '기간',
      location: '장소',
      details: '상세 내용',
      participate: '참여하기',
      learnMore: '자세히 알아보기',
      eventEnded: '종료된 이벤트',
      eventNotStarted: '예정된 이벤트',
    },
    en: {
      backToEvents: '← Back to Events',
      period: 'Period',
      location: 'Location',
      details: 'Details',
      participate: 'Participate',
      learnMore: 'Learn More',
      eventEnded: 'Event Ended',
      eventNotStarted: 'Upcoming Event',
    },
  };

  const t = texts[locale];

  const getLocalizedText = (field: { ko: string; en?: string } | undefined) => {
    if (!field) return '';
    return field[locale] || field.ko || '';
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // 24시간 형식 사용하여 AM/PM 문제 해결
    }).format(new Date(date));
  };

  const formatDateOnly = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getEventStatus = () => {
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

  const eventStatus = getEventStatus();

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      padding: '2rem 1rem',
      paddingTop: '6rem',
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
      }}>
        {/* 뒤로 가기 버튼 */}
        <div style={{ 
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'flex-end', // 우측 정렬
        }}>
          <button
            onClick={() => router.push(`/${locale}/resources/events`)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            {t.backToEvents}
          </button>
        </div>

        {/* 메인 이미지 */}
        <div style={{
          position: 'relative',
          height: '400px',
          marginBottom: '2rem',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}>
          {event.featuredImage && !imageError ? (
            <Image
              src={event.featuredImage}
              alt={getLocalizedText(event.title)}
              fill
              style={{ objectFit: 'cover' }}
              onError={() => setImageError(true)}
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
          {eventStatus !== 'active' && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
            }}>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.875rem',
                fontWeight: '500',
                backgroundColor: eventStatus === 'ended' ? '#fef2f2' : '#fefce8',
                color: eventStatus === 'ended' ? '#dc2626' : '#d97706',
                border: `1px solid ${eventStatus === 'ended' ? '#fecaca' : '#fed7aa'}`,
              }}>
                {eventStatus === 'ended' ? t.eventEnded : t.eventNotStarted}
              </span>
            </div>
          )}
        </div>

        {/* 이벤트 정보 */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}>
          {/* 제목 */}
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '1rem',
            lineHeight: '1.2',
          }}>
            {getLocalizedText(event.title)}
          </h1>

          {/* 한 줄 설명 */}
          {event.oneLiner && (
            <p style={{
              fontSize: '1.25rem',
              color: '#666',
              marginBottom: '2rem',
              lineHeight: '1.5',
            }}>
              {getLocalizedText(event.oneLiner)}
            </p>
          )}

          {/* 이벤트 메타 정보 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            {/* 기간 */}
            {(event.eventStartAt || event.eventEndAt) && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <svg style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: '#9ca3af',
                  marginTop: '0.125rem',
                  marginRight: '0.75rem',
                  flexShrink: 0,
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <span style={{
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginRight: '0.5rem',
                  }}>
                    {t.period} :
                  </span>
                  <span style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.4' }}>
                    {event.eventStartAt && formatDate(event.eventStartAt)}
                    {event.eventEndAt && (
                      <>
                        &nbsp; ~ &nbsp;
                        {formatDate(event.eventEndAt)}
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* 장소 */}
            {event.location && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <svg style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  color: '#9ca3af',
                  marginTop: '0.125rem',
                  marginRight: '0.75rem',
                  flexShrink: 0,
                }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <div style={{
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '0.25rem',
                  }}>
                    {t.location}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.875rem' }}>
                    {getLocalizedText(event.location)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 상세 내용 */}
          {event.content && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '1rem',
              }}>
                {t.details}
              </h2>
              <div 
                style={{
                  color: '#374151',
                  lineHeight: '1.7',
                  fontSize: '1rem',
                }}
                dangerouslySetInnerHTML={{ 
                  __html: getLocalizedText(event.content).replace(/\n/g, '<br />') 
                }}
              />
            </div>
          )}
        </div>

        {/* CTA 버튼 */}
        {event.hasCtaButton && event.ctaButtonText && (
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.125rem',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                transition: 'background-color 0.2s ease',
                cursor: 'pointer',
                backgroundColor: '#20BDFF',
                color: 'white',
                // cursor: eventStatus === 'active' ? 'pointer' : 'not-allowed',
                // backgroundColor: eventStatus === 'active' ? '#20BDFF' : '#e5e7eb',
                // color: eventStatus === 'active' ? 'white' : '#9ca3af',
              }}
              // disabled={eventStatus !== 'active'}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a9de6';
                // if (eventStatus === 'active') {
                //   e.currentTarget.style.backgroundColor = '#1a9de6';
                // }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a9de6';
                // if (eventStatus === 'active') {
                //   e.currentTarget.style.backgroundColor = '#20BDFF';
                // }
              }}
            >
              {getLocalizedText(event.ctaButtonText)}
            </button>
            
            {eventStatus === 'ended' && (
              <p style={{
                color: '#9ca3af',
                marginTop: '1rem',
                fontSize: '0.875rem',
              }}>
                {locale === 'ko' ? '이벤트가 종료되었습니다.' : 'This event has ended.'}
              </p>
            )}
            {eventStatus === 'upcoming' && (
              <p style={{
                color: '#9ca3af',
                marginTop: '1rem',
                fontSize: '0.875rem',
              }}>
                {event.eventStartAt && (
                  locale === 'ko' 
                    ? `${formatDateOnly(event.eventStartAt)}에 시작됩니다.`
                    : `Starts on ${formatDateOnly(event.eventStartAt)}.`
                )}
              </p>
            )}
          </div>
        )}

        {/* 이벤트 참가 신청 모달 */}
        <ContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          locale={locale}
          variant="event"
          eventId={event.id}
          customTitle={getLocalizedText(event.ctaButtonText) || (locale === 'ko' ? '이벤트 참가 신청' : 'Event Registration')}
          customSubmitLabel={locale === 'ko' ? '참가 신청하기' : 'Register'}
        />
      </div>
    </div>
  );
}