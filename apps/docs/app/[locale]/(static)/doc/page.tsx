import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation - AtSignal Docs",
  description: "AtSignal 문서",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function DocPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div>
      <h1>Documentation - {locale}</h1>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

