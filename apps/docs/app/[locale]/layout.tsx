import { notFound } from "next/navigation";
import { validLocales } from "@/lib/i18n/getLocale";
import { getMenusByLocale } from "@/lib/cms/getMenus";
import { getSearchIndex } from "@/lib/cms/getSearchIndex";
import Header from "@/components/Header";

export function generateStaticParams() {
  return [
    { locale: 'ko' },
    { locale: 'en' },
  ];
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

// 메뉴 트리 구조 생성 헬퍼 함수
function buildMenuTree(menus: any[]): any[] {
  const menuMap = new Map<string, any>();
  const roots: any[] = [];

  // 모든 메뉴를 맵에 저장
  menus.forEach(menu => {
    if (menu.id) {
      menuMap.set(menu.id, { ...menu, children: [] });
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

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  
  if (!validLocales.includes(locale as any)) {
    notFound();
  }

  // Firestore에서 모든 메뉴 가져오기
  const menus = await getMenusByLocale('docs', locale as 'ko' | 'en');
  
  // 트리 구조로 변환
  const menuTree = buildMenuTree(menus);
  
  // 검색 인덱스 가져오기
  const searchIndex = await getSearchIndex('docs');
  
  // 최상위 메뉴만 추출하고 하위 메뉴 정보 포함
  const navItems = menuTree.map((menu: any) => ({
    label: menu.label || menu.labels?.[locale] || menu.labels?.ko || '',
    href: menu.isExternal ? menu.path : `/${locale}/${menu.path || ''}`,
    isExternal: menu.isExternal,
    children: menu.children && menu.children.length > 0 
      ? menu.children.map((child: any) => ({
          label: child.label || child.labels?.[locale] || child.labels?.ko || '',
          href: child.isExternal ? child.path : `/${locale}/${child.path || ''}`,
          isExternal: child.isExternal,
        }))
      : undefined,
  }));

  return (
    <>
      <Header 
        navItems={navItems} 
        locale={locale as 'ko' | 'en'} 
        searchIndex={searchIndex}
      />
      {children}
    </>
  );
}

