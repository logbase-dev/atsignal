import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/cms/getPage";
import PageRenderer from "@/components/cms/PageRenderer";

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string[];
  }>;
}

export const dynamicParams = false;

export default async function DynamicPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const slugPath = Array.isArray(slug) ? slug.join("/") : slug || "";

  const pageData = await getPageBySlug(slugPath, locale);

  if (!pageData) {
    notFound();
  }

  return <PageRenderer data={pageData} locale={locale} />;
}

export async function generateStaticParams() {
  return [
    { locale: "ko", slug: [] },
    { locale: "en", slug: [] },
  ];
}

