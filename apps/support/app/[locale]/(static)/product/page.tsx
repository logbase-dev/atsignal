import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product - AtSignal Support",
  description: "AtSignal 제품 지원",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div>
      <h1>Product Support - {locale}</h1>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

