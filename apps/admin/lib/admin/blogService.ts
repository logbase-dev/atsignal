'use client';

import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BlogPost } from './types';

// 타임아웃 헬퍼 함수
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
}

// Timestamp를 Date로 변환하는 헬퍼 함수
function convertTimestamp(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return undefined;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다. Firebase 환경 변수를 확인하세요.');
    return [];
  }

  try {
    const postsRef = collection(db, 'blog');
    
    // orderBy를 try-catch로 감싸서 인덱스 문제 해결
    let q;
    try {
      q = query(postsRef, orderBy('createdAt', 'desc'));
    } catch (error) {
      console.warn('orderBy failed, fetching without order:', error);
      q = query(postsRef);
    }
    
    // 타임아웃 추가 (5초)
    const querySnapshot = await withTimeout(getDocs(q), 5000);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, any>;
      const post: BlogPost = {
        id: doc.id,
        title: String(data.title || ''),
        slug: String(data.slug || ''),
        content: String(data.content || ''),
        excerpt: data.excerpt ? String(data.excerpt) : undefined,
        author: data.author ? String(data.author) : undefined,
        published: Boolean(data.published),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        publishedAt: convertTimestamp(data.publishedAt),
      };
      return post;
    });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    
    // 타임아웃 에러인 경우
    if (error.message?.includes('timed out')) {
      console.error('Firestore 쿼리 타임아웃 - Firebase 환경 변수 또는 네트워크 연결을 확인하세요.');
    }
    
    return [];
  }
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  if (!db) {
    console.error('Firestore가 초기화되지 않았습니다.');
    return null;
  }

  try {
    const postRef = doc(db, 'blog', id);
    const postSnap = await withTimeout(getDoc(postRef), 5000);
    
    if (!postSnap.exists()) {
      return null;
    }
    
    const data = postSnap.data() as Record<string, any>;
    const post: BlogPost = {
      id: postSnap.id,
      title: String(data.title || ''),
      slug: String(data.slug || ''),
      content: String(data.content || ''),
      excerpt: data.excerpt ? String(data.excerpt) : undefined,
      author: data.author ? String(data.author) : undefined,
      published: Boolean(data.published),
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
      publishedAt: convertTimestamp(data.publishedAt),
    };
    return post;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function createBlogPost(post: Omit<BlogPost, 'id'>): Promise<string> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const postsRef = collection(db, 'blog');
  const docRef = await withTimeout(addDoc(postsRef, {
    ...post,
    createdAt: new Date(),
    updatedAt: new Date(),
  }), 5000);
  return docRef.id;
}

export async function updateBlogPost(id: string, post: Partial<BlogPost>): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const pageRef = doc(db, 'blog', id);
  await withTimeout(updateDoc(pageRef, {
    ...post,
    updatedAt: new Date(),
  }), 5000);
}

export async function deleteBlogPost(id: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore가 초기화되지 않았습니다.');
  }

  const postRef = doc(db, 'blog', id);
  await withTimeout(deleteDoc(postRef), 5000);
}

