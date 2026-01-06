import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import PageRenderer from '@/components/cms/PageRenderer';
import { getPageById, getPageBySlug } from '@/lib/cms/getPage';

interface PageProps {
  params: {
    locale: string;
    slug: string[];
  };
  searchParams?: {
    draftId?: string;
    preview?: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function DynamicPage({ params, searchParams }: PageProps) {
  const { locale, slug } = params;
  const slugPath = slug.map(decodeURIComponent).join('/');
  // draftId가 있으면 미리보기 모드로 간주 (draftMode 쿠키가 없어도 작동)
  const preview = (draftMode().isEnabled || searchParams?.draftId) && searchParams?.draftId;

  let page =
    preview && searchParams?.draftId
      ? await getPageById(searchParams.draftId)
      : await getPageBySlug('web', slugPath);

  if (!page) {
    notFound();
  }

  const labels = preview ? page.labelsDraft ?? page.labelsLive : page.labelsLive;
  const content = preview ? page.contentDraft ?? page.contentLive : page.contentLive;

  const localizedTitle = locale === 'en' ? labels.en || labels.ko : labels.ko;
  const localizedContent = locale === 'en' ? content.en || content.ko : content.ko;

  // preview 모드이고 contentDraft가 있으면, 해당 locale의 내용이 없어도 다른 locale을 사용
  // contentDraft가 존재하고 (ko 또는 en 중 하나라도 있으면) 빈 문자열이 아닌 경우 fallback 표시 안 함
  const hasContentDraft = preview && page.contentDraft && (
    (page.contentDraft.ko && page.contentDraft.ko.trim()) || 
    (page.contentDraft.en && page.contentDraft.en.trim())
  );
  
  const finalContent = hasContentDraft 
    ? (localizedContent || '')  // contentDraft가 있으면 빈 문자열이어도 fallback 표시 안 함
    : (localizedContent || '준비 중입니다.');

  return (
    <PageRenderer
      title={localizedTitle || page.slug}
      content={finalContent}
      updatedAt={preview ? page.draftUpdatedAt : page.updatedAt}
      isPreview={Boolean(preview)}
      editorType={page.editorType}
      saveFormat={page.saveFormat}
      showFallback={!hasContentDraft}
    />
  );
}

