import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await db.collection('blogCategories')
      .orderBy('name.ko', 'asc')
      .get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any)); // 타입 단언 추가

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Failed to fetch blog categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog categories' },
      { status: 500 }
    );
  }
}