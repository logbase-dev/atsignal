import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions - atsignal",
  description: "atsignal 솔루션 소개",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function SolutionsPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div>
      <h1>Solutions - {locale}</h1>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

