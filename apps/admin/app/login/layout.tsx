import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - atsignal Admin',
  description: 'atsignal Admin 로그인 페이지',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i|Nunito:300,300i,400,400i,600,600i,700,700i|Poppins:300,300i,400,400i,500,500i,600,600i,700,700i"
        rel="stylesheet"
      />

      {/* Vendor CSS Files */}
      <link href="/assets/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
      <link href="/assets/vendor/bootstrap-icons/bootstrap-icons.css" rel="stylesheet" />
      <link href="/assets/vendor/boxicons/css/boxicons.min.css" rel="stylesheet" />
      <link href="/assets/vendor/quill/quill.snow.css" rel="stylesheet" />
      <link href="/assets/vendor/quill/quill.bubble.css" rel="stylesheet" />
      <link href="/assets/vendor/remixicon/remixicon.css" rel="stylesheet" />
      <link href="/assets/vendor/simple-datatables/style.css" rel="stylesheet" />

      {/* Template Main CSS File */}
      <link href="/assets/css/style.css" rel="stylesheet" />

      {children}
    </>
  );
}

