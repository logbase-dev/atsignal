export function generateStaticParams() {
  return [
    { locale: 'ko' },
    { locale: 'en' },
  ];
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export const dynamicParams = false;

export default async function LocalePage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <div>
      <h1>App Home - {locale}</h1>
    </div>
  );
}

