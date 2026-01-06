import Home from '@/components/Home';
import { validLocales } from '@/lib/i18n/getLocale';

export function generateStaticParams() {
  return validLocales.map((locale) => ({
    locale,
  }));
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamicParams = false;

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;
  return <Home locale={locale} />;
}

