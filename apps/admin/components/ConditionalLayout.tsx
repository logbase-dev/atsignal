'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  // CSS는 루트 레이아웃에서 로드됨

  if (isLoginPage) {
    return (
      <>
        {children}
        {/* 로그인 페이지용 JS */}
        <Script src="/assets/vendor/bootstrap/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/vendor/php-email-form/validate.js" strategy="afterInteractive" />
        <Script src="/assets/js/main.js" strategy="afterInteractive" />
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />
      <main id="main" className="main">
        {children}
      </main>
      <Footer />
      <a href="#" className="back-to-top d-flex align-items-center justify-content-center">
        <i className="bi bi-arrow-up-short"></i>
      </a>

      {/* Vendor JS Files */}
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

