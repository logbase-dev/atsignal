import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - AtSignal Docs",
  description: "AtSignal 문서 관리",
};

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminPage({ params }: PageProps) {
  const { locale } = await params;

  return (
    <div>
      <h1>Admin - {locale}</h1>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

