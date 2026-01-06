'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLayoutEffect, useEffect, useState } from 'react';
import Script from 'next/script';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { adminFetch } from '@/lib/admin/api';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isLoginPage = pathname === '/admin/login';

  // 인증 체크
  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true); // 로그인 페이지는 인증 체크 안함
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await adminFetch('auth/me');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [pathname, router, isLoginPage]);

  // useLayoutEffect를 사용하여 DOM 업데이트 전에 실행 (hydration 불일치 방지)
  useLayoutEffect(() => {
    // Scope NiceAdmin fixes to admin pages only.
    // DOM 업데이트 전에 실행하여 hydration 불일치 방지
    if (typeof document !== 'undefined') {
      document.body.classList.add('admin-mode');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('admin-mode');
      }
    };
  }, []);

  // 인라인 스크립트 - 서버 사이드에서도 실행되도록 개선
  const adminModeScript = `
    (function() {
      if (typeof document !== 'undefined' && document.body) {
        if (!document.body.classList.contains('admin-mode')) {
          document.body.classList.add('admin-mode');
        }
      }
    })();
  `;

  // 인증 체크 중이면 로딩 표시
  if (isAuthenticated === null && !isLoginPage) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: adminModeScript,
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          인증 확인 중...
        </div>
      </>
    );
  }

  // 인증되지 않았으면 빈 화면 (리다이렉트 중)
  if (isAuthenticated === false && !isLoginPage) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: adminModeScript,
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666'
        }}>
          로그인 페이지로 이동 중...
        </div>
      </>
    );
  }

  if (isLoginPage) {
    return (
      <>
        {/* 로그인 페이지에서도 admin-mode 클래스 추가 */}
        <script
          dangerouslySetInnerHTML={{
            __html: adminModeScript,
          }}
        />
        {children}
        <Script src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/php-email-form/validate.js" strategy="afterInteractive" />
        {/* main.js는 TinyMCE를 사용하므로 로그인 페이지에서는 제외 */}
      </>
    );
  }

  return (
    <>
      {/* FOUC 방지를 위한 인라인 스크립트 - 초기 렌더링 시 즉시 실행 */}
      <script
        dangerouslySetInnerHTML={{
          __html: adminModeScript,
        }}
      />
      <Header />
      <Sidebar />
      <main id="main" className="main">
        {children}
      </main>
      <Footer />
      <a href="#" className="back-to-top d-flex align-items-center justify-content-center">
        <i className="bi bi-arrow-up-short"></i>
      </a>

      <Script src="/assets/vendor/apexcharts/apexcharts.min.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/chart.js/chart.umd.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/echarts/echarts.min.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/quill/quill.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/simple-datatables/simple-datatables.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/tinymce/tinymce.min.js" strategy="afterInteractive" />
      <Script src="/assets/vendor/php-email-form/validate.js" strategy="afterInteractive" />
      <Script src="/assets/js/main.js" strategy="afterInteractive" />
    </>
  );
}