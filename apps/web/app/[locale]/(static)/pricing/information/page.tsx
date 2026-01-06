import { Metadata } from "next";
import PricingInformation from '@/components/pricing/PricingInformation';

export const metadata: Metadata = {
  title: "Pricing Information - atsignal",
  description: "AtSignal 요금제 정보 및 가격 계산기",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PricingInformationPage({ params }: PageProps) {
  const { locale } = await params;

  return <PricingInformation locale={locale} />;
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

