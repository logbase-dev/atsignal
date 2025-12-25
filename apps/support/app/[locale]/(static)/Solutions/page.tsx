import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions - AtSignal Support",
  description: "AtSignal 솔루션 지원",
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
      <h1>Solutions Support - {locale}</h1>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

