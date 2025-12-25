import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "../globals.css";
import { notFound } from "next/navigation";
import { validLocales } from "@/lib/i18n/getLocale";

export const metadata: Metadata = {
  title: "AtSignal Support - 고객지원",
  description: "AtSignal 고객지원 사이트",
};

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

  return (
    <html lang={locale}>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

