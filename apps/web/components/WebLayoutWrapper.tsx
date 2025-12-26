'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface WebLayoutWrapperProps {
  children: React.ReactNode;
  menuTree: any;
  footerMenus: any[];
}

export default function WebLayoutWrapper({ children, menuTree, footerMenus }: WebLayoutWrapperProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin') ?? false;

  if (isAdminPage) {
    // 관리자 페이지는 Header/Footer 없이 children만 렌더링
    return <>{children}</>;
  }

  // 일반 웹 페이지는 Header/Footer 포함
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header menuTree={menuTree} />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ flex: 1 }}>
        {children}
      </main>
      <Footer menus={footerMenus} />
    </div>
  );
}

