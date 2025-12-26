import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Site = 'web' | 'docs';

export interface LocalizedField {
  ko: string;
  en?: string;
}

export interface CmsPage {
  id: string;
  site: Site;
  slug: string;
  labelsLive: LocalizedField;
  labelsDraft?: LocalizedField;
  contentLive: LocalizedField;
  contentDraft?: LocalizedField;
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
  updatedAt?: Date;
  draftUpdatedAt?: Date;
}

const pagesRef = collection(db, 'pages');

function normalizeLocalizedField(field?: { ko?: string; en?: string } | null): LocalizedField {
  if (!field) {
    return { ko: '', en: '' };
  }
  return {
    ko: field.ko ?? '',
    ...(field.en ? { en: field.en } : {}),
  };
}

function normalizeTimestamp(value: any) {
  return value?.toDate?.() || value || undefined;
}

function mapSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): CmsPage {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    site: data.site,
    slug: data.slug,
    labelsLive: normalizeLocalizedField(data.labelsLive ?? data.labels),
    labelsDraft: data.labelsDraft ? normalizeLocalizedField(data.labelsDraft) : undefined,
    contentLive: normalizeLocalizedField(data.contentLive ?? data.content),
    contentDraft: data.contentDraft ? normalizeLocalizedField(data.contentDraft) : undefined,
    editorType: data.editorType || 'toast',
    saveFormat: data.saveFormat || 'markdown',
    updatedAt: normalizeTimestamp(data.updatedAt),
    draftUpdatedAt: normalizeTimestamp(data.draftUpdatedAt),
  };
}

export async function getPageBySlug(site: Site, slug: string): Promise<CmsPage | null> {
  const slugPath = slug.replace(/^\/+/, '');
  const q = query(pagesRef, where('site', '==', site), where('slug', '==', slugPath), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return mapSnapshot(snapshot.docs[0]);
}

export async function getPageById(id: string): Promise<CmsPage | null> {
  const pageRef = doc(db, 'pages', id);
  const snapshot = await getDoc(pageRef);
  if (!snapshot.exists()) {
    return null;
  }
  return mapSnapshot(snapshot as QueryDocumentSnapshot<DocumentData>);
}
