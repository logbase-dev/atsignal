'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';
import Script from 'next/script';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

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