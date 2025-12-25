import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { ReactNode } from 'react';
import ConditionalLayout from '@/components/admin-template/ConditionalLayout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i"
        rel="stylesheet"
      />

      <link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
      <link href="/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet" />
      <link href="/assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet" />
      <link href="/assets/vendor/quill/quill.snow.css" rel="stylesheet" />
      <link href="/assets/vendor/quill/quill.bubble.css" rel="stylesheet" />
      <link href="/assets/vendor/remixicon/remixicon.css" rel="stylesheet" />
      <link href="/assets/vendor/simple-datatables/style.css" rel="stylesheet" />
      <link href="/assets/css/style.css" rel="stylesheet" />
      <link href="/assets/css/admin-mode.css" rel="stylesheet" />

      <div className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </div>
    </>
  );
}


