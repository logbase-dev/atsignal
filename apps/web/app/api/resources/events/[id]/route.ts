import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * 공개 이벤트 상세 API
 * GET /api/resources/events/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('[Events Detail API] Using Firebase Admin SDK for ID:', id);

    // Firebase Admin SDK로 직접 조회
    const doc = await db.collection('events').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    // 공개된 이벤트만 반환
    if (!data?.published) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      publishedAt: data.publishedAt?.toDate(),
      eventStartAt: data.eventStartAt?.toDate(),
      eventEndAt: data.eventEndAt?.toDate(),
      displayStartAt: data.displayStartAt?.toDate(),
      displayEndAt: data.displayEndAt?.toDate(),
    };

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[Events Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}