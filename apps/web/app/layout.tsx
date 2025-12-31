import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { headers } from "next/headers";
import "./globals.css";
import Splash from "@/components/Splash";
import { getMenusByLocale } from "@/lib/cms/getMenus";
import { buildMenuTreeFromFirestore } from "@/utils/menuTree";
import { defaultLocale } from "@/lib/i18n/getLocale";
import { buildMenuTree } from "@/utils/menu";
import { menuData } from "@/data/menu";
import WebLayoutWrapper from "@/components/WebLayoutWrapper";

export const metadata: Metadata = {
  title: "atsignal - 통합 행동데이터 플랫폼",
  description: "Nethru의 데이터분석 기술과 노하우가 집약된 통합 행동데이터 플랫폼",
  icons: {
    icon: '/assets/img/favicon.png', // 또는 '/images/favicon.png'
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const normalizePath = (input: string) => {
    if (!input) return "/";
    const trimmed = input.trim();
    const withoutExtraSlashes = trimmed.replace(/\/{2,}/g, "/").replace(/\/+$/g, "");
    return withoutExtraSlashes.startsWith("/") ? withoutExtraSlashes : `/${withoutExtraSlashes}`;
  };

  const buildFallbackFooterMenus = () => {
    const footerMenus: any[] = [];
    const idMap = new Map<string, string>();

    menuData
      .filter((item) => item.depth1 !== "Direct link")
      .forEach((item) => {
        const parts = [item.depth1, item.depth2, item.depth3, item.depth4].filter(Boolean) as string[];
        let parentId: string | number = "0";
        let currentPath = "";

        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
          const id = normalizePath(currentPath);

          if (!idMap.has(id)) {
            idMap.set(id, id);
            footerMenus.push({
              id,
              labels: { ko: part, en: part },
              label: part,
              path: index === parts.length - 1 ? item.fullPath : currentPath,
              depth: index + 1,
              parentId,
              order: footerMenus.length,
              pageType: index === parts.length - 1 ? item.pageType : undefined,
              url: index === parts.length - 1 ? item.url : undefined,
            });
          }

          parentId = id;
        });
      });

    return footerMenus;
  };

  let menus: any[] = [];

  try {
    menus = await getMenusByLocale("web", defaultLocale);
  } catch (error) {
    console.error("Failed to fetch menus from Firestore, using static menu data.", error);
  }

  const menuTree = menus && menus.length > 0
    ? buildMenuTreeFromFirestore(menus, defaultLocale)
    : buildMenuTree();

  // Footer용: 전체 메뉴를 전달 (depth2의 자식을 찾기 위해)
  const footerMenus = menus && menus.length > 0
    ? menus.map((menu: any) => ({
        id: menu.id,
        labels: menu.labels,
        label: menu.label,
        path: menu.path,
        depth: menu.depth,
        parentId: menu.parentId,
        order: menu.order || 0,
        pageType: menu.pageType,
        url: menu.url,
      }))
    : buildFallbackFooterMenus();

  // Middleware에서 설정한 헤더 확인
  const headersList = await headers();
  const isAdminPath = headersList.get('x-is-admin') === 'true';

  return (
    <html lang="ko">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased${isAdminPath ? ' admin-mode' : ''}`}
      >
        <Splash />
        <WebLayoutWrapper menuTree={menuTree} footerMenus={footerMenus}>
            {children}
        </WebLayoutWrapper>
      </body>
    </html>
  );
}
