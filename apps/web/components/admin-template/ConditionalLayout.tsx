'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Script from 'next/script';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Scope NiceAdmin fixes to admin pages only.
    // 즉시 추가하여 FOUC 방지
    if (typeof document !== 'undefined') {
      document.body.classList.add('admin-mode');
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('admin-mode');
      }
    };
  }, []);

  if (isLoginPage) {
    return (
      <>
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
          __html: `
            if (typeof document !== 'undefined' && !document.body.classList.contains('admin-mode')) {
              document.body.classList.add('admin-mode');
            }
          `,
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


