import { notFound } from 'next/navigation';
import { draftMode } from 'next/headers';
import PageRenderer from '@/components/cms/PageRenderer';
import { Sidebar } from '@/components/cms/Sidebar';
import { getPageById, getPageBySlug } from '@/lib/cms/getPage';
import { getMenusByLocale } from '@/lib/cms/getMenus';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
  searchParams?: Promise<{
    draftId?: string;
    preview?: string;
  }>;
}

export const dynamic = 'force-dynamic';

// 메뉴 트리 구조 생성 헬퍼 함수
function buildMenuTree(menus: any[]): any[] {
  const menuMap = new Map<string, any>();
  const roots: any[] = [];

  // Timestamp를 Date로 변환하는 헬퍼 함수
  const sanitizeMenu = (menu: any) => {
    const sanitized = { ...menu };
    // Firestore Timestamp를 Date로 변환
    if (sanitized.createdAt && typeof sanitized.createdAt.toDate === 'function') {
      sanitized.createdAt = sanitized.createdAt.toDate();
    }
    if (sanitized.updatedAt && typeof sanitized.updatedAt.toDate === 'function') {
      sanitized.updatedAt = sanitized.updatedAt.toDate();
    }
    return sanitized;
  };

  // 모든 메뉴를 맵에 저장
  menus.forEach(menu => {
    if (menu.id) {
      menuMap.set(menu.id, { ...sanitizeMenu(menu), children: [] });
    }
  });

  // 트리 구조 생성
  menus.forEach(menu => {
    if (!menu.id) return;
    
    const node = menuMap.get(menu.id)!;
    
    if (menu.parentId && menu.parentId !== '0' && menuMap.has(menu.parentId)) {
      const parent = menuMap.get(menu.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 정렬
  const sortNodes = (nodes: any[]) => {
    nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };
  
  sortNodes(roots);
  return roots;
}

export default async function DynamicPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const slugPath = slug.map(decodeURIComponent).join('/');
  // draftId가 있으면 미리보기 모드로 간주 (draftMode 쿠키가 없어도 작동)
  const preview = (draftMode().isEnabled || resolvedSearchParams?.draftId) && resolvedSearchParams?.draftId;

  let page =
    preview && resolvedSearchParams?.draftId
      ? await getPageById(resolvedSearchParams.draftId)
      : await getPageBySlug('docs', slugPath);

  if (!page) {
    notFound();
  }

  // 메뉴 가져오기
  const menus = await getMenusByLocale('docs', locale as 'ko' | 'en');
  const menuTree = buildMenuTree(menus);

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
    <div className={`page-renderer-wrapper ${page.saveFormat === 'html' ? 'no-toc' : ''}`}>
      <Sidebar 
        menus={menuTree} 
        locale={locale as 'ko' | 'en'} 
        currentPath={slugPath}
      />
      <PageRenderer
        title={localizedTitle || page.slug}
        content={finalContent}
        updatedAt={preview ? page.draftUpdatedAt : page.updatedAt}
        isPreview={Boolean(preview)}
        editorType={page.editorType}
        saveFormat={page.saveFormat}
        showFallback={!hasContentDraft}
      />
    </div>
  );
}
