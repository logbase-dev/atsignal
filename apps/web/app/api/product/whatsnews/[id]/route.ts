import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

/**
 * 공개 WhatsNew 상세 API
 * GET /api/product/whatsnews/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('[WhatsNews Detail API] Using Firebase Admin SDK for ID:', id);

    // Firebase Admin SDK로 직접 조회
    const doc = await db.collection('whatsnew').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'WhatsNew not found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    // 공개된 항목만 반환
    if (!data?.published) {
      return NextResponse.json(
        { error: 'WhatsNew not found' },
        { status: 404 }
      );
    }

    const whatsNew = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      publishedAt: data.publishedAt?.toDate(),
    };

    return NextResponse.json({ whatsNew });
  } catch (error) {
    console.error('[WhatsNews Detail API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}