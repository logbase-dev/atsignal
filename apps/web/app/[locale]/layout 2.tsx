import { notFound } from "next/navigation";
import { validLocales } from "@/lib/i18n/getLocale";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  
  if (!validLocales.includes(locale as any)) {
    notFound();
  }

  // html과 body 제거 - 루트 레이아웃(app/layout.tsx)에만 있어야 함
  // Next.js App Router에서는 중첩된 레이아웃에서 html/body를 사용하면 안 됨
  return (
    <>
      {children}
    </>
  );
}

