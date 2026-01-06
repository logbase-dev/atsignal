import { Metadata } from "next";
import CompanyAboutUs from '@/components/company/CompanyAboutUs';

export const metadata: Metadata = {
  title: "회사 소개 — atsignal",
  description: "AtSignal 회사 소개 및 연혁",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CompanyAboutUsPage({ params }: PageProps) {
  const { locale } = await params;

  return <CompanyAboutUs locale={locale} />;
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

