'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getEventById } from '@/lib/admin/eventService';
import type { Event } from '@/lib/admin/types';

export default function EventViewPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const eventId = params?.id as string;

  useEffect(() => {
    if (eventId) {
      void loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventData = await getEventById(eventId);
      if (!eventData) {
        setError('이벤트를 찾을 수 없습니다.');
        return;
      }
      setEvent(eventData);
    } catch (err: any) {
      console.error('Failed to load event:', err);
      setError(err.message || '이벤트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatDateOnly = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ko', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getEventStatus = () => {
    if (!event) return 'unknown';
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

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px' }}>
        <div style={{
          padding: '2rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '0.5rem',
          color: '#856404',
          marginBottom: '2rem',
        }}>
          <strong>오류:</strong> {error || '이벤트를 찾을 수 없습니다.'}
        </div>
        <Link
          href="/admin/event"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            display: 'inline-block',
          }}
        >
          이벤트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const eventStatus = getEventStatus();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <Link
            href="/admin/event"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#0070f3',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '0.5rem',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이벤트 목록으로
          </Link>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>이벤트 상세보기</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            href={`/admin/event/${event.id}`}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
            }}
          >
            수정하기
          </Link>
          <Link
            href={`/admin/event/${event.id}/participants`}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.5rem',
            }}
          >
            참가신청자 보기
          </Link>
        </div>
      </div>

      {/* 메인 이미지 */}
      <div style={{
        position: 'relative',
        height: '400px',
        marginBottom: '2rem',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f8f9fa',
      }}>
        {event.featuredImage && !imageError ? (
          <Image
            src={event.featuredImage}
            alt={event.title?.ko || '이벤트 이미지'}
            fill
            style={{ objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
          }}>
            <div style={{ textAlign: 'center' }}>
              <svg style={{ width: '4rem', height: '4rem', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>이미지 없음</span>
            </div>
          </div>
        )}
        
        {/* 이벤트 상태 배지 */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          gap: '0.5rem',
        }}>
          {/* 발행 상태 */}
          <span style={{
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: '500',
            backgroundColor: event.published ? '#d1f2eb' : '#fff3cd',
            color: event.published ? '#155724' : '#856404',
            border: `1px solid ${event.published ? '#c3e6cb' : '#ffeaa7'}`,
          }}>
            {event.published ? '발행됨' : '초안'}
          </span>
          
          {/* 이벤트 진행 상태 */}
          {eventStatus !== 'active' && (
            <span style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '500',
              backgroundColor: eventStatus === 'ended' ? '#f8d7da' : '#d4edda',
              color: eventStatus === 'ended' ? '#721c24' : '#155724',
              border: `1px solid ${eventStatus === 'ended' ? '#f5c6cb' : '#c3e6cb'}`,
            }}>
              {eventStatus === 'ended' ? '종료됨' : '예정됨'}
            </span>
          )}
        </div>
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
          {event.title?.ko || '제목 없음'}
        </h1>

        {/* 한 줄 설명 */}
        {event.oneLiner?.ko && (
          <p style={{
            fontSize: '1.25rem',
            color: '#666',
            marginBottom: '2rem',
            lineHeight: '1.5',
          }}>
            {event.oneLiner.ko}
          </p>
        )}

        {/* 이벤트 메타 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
                <div style={{
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '0.25rem',
                }}>
                  이벤트 기간
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.4' }}>
                  {event.eventStartAt && formatDate(event.eventStartAt)}
                  {event.eventEndAt && (
                    <>
                      <br />
                      ~ {formatDate(event.eventEndAt)}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 장소 */}
          {event.location?.ko && (
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
                  장소
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem' }}>
                  {event.location.ko}
                </div>
              </div>
            </div>
          )}

          {/* 조회수 */}
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <svg style={{
              width: '1.25rem',
              height: '1.25rem',
              color: '#9ca3af',
              marginTop: '0.125rem',
              marginRight: '0.75rem',
              flexShrink: 0,
            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div>
              <div style={{
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: '0.25rem',
              }}>
                조회수
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>
                {event.views !== undefined ? event.views.toLocaleString() : '0'}회
              </div>
            </div>
          </div>

          {/* 생성일 */}
          {event.createdAt && (
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <svg style={{
                width: '1.25rem',
                height: '1.25rem',
                color: '#9ca3af',
                marginTop: '0.125rem',
                marginRight: '0.75rem',
                flexShrink: 0,
              }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '0.25rem',
                }}>
                  생성일
                </div>
                <div style={{ color: '#666', fontSize: '0.875rem' }}>
                  {formatDate(event.createdAt)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 상세 내용 */}
        {event.content?.ko && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '1rem',
            }}>
              상세 내용
            </h2>
            <div 
              style={{
                color: '#374151',
                lineHeight: '1.7',
                fontSize: '1rem',
                padding: '1.5rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
              }}
              dangerouslySetInnerHTML={{ 
                __html: event.content.ko.replace(/\n/g, '<br />') 
              }}
            />
          </div>
        )}

        {/* 설정 정보 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>메인 이벤트</div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>
              {event.isMainEvent ? '예' : '아니오'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>서브 이벤트 순서</div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>
              {event.subEventOrder || '-'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>배너 노출</div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>
              {event.showInBanner ? '예' : '아니오'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>CTA 버튼</div>
            <div style={{ color: '#666', fontSize: '0.875rem' }}>
              {event.hasCtaButton ? '있음' : '없음'}
            </div>
          </div>
          {event.hasCtaButton && event.ctaButtonText?.ko && (
            <div>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>CTA 버튼 텍스트</div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>
                {event.ctaButtonText.ko}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}