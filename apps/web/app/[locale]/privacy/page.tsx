import { Metadata } from "next";
import Link from "next/link";
import { validLocales } from '@/lib/i18n/getLocale';
import koMessages from '@/locales/ko.json';
import enMessages from '@/locales/en.json';

export function generateStaticParams() {
  return validLocales.map((locale) => ({
    locale,
  }));
}

export const dynamicParams = false;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const translations = {
    ko: koMessages,
    en: enMessages,
  } as const;
  
  const t = translations[locale as keyof typeof translations]?.privacy ?? translations.ko.privacy;
  
  return {
    title: `${t.title} - AtSignal`,
    description: t.intro,
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;

  const translations = {
    ko: koMessages,
    en: enMessages,
  } as const;

  const t = translations[locale as keyof typeof translations]?.privacy ?? translations.ko.privacy;

  // 다국어 파일의 sections 객체를 배열로 변환 (순서 유지)
  const sectionsArray = [
    t.sections.collectedInfo,
    t.sections.purpose,
    t.sections.retention,
    t.sections.protection,
    t.sections.thirdParty,
    t.sections.rights,
    t.sections.officer,
    t.sections.changes,
    t.sections.inquiry,
  ];

  const content = {
    title: t.title,
    intro: t.intro,
    lastUpdated: t.lastUpdated,
    sections: sectionsArray,
  };

  return (
    <div className="main dark-mode">
      {/* Privacy Policy Section */}
      <section className="section section-white">
        <div className="section-container">
          <div className="privacy-page">
            {/* Breadcrumb */}
            <nav className="privacy-breadcrumb" aria-label="Breadcrumb">
              <Link href={`/${locale}`} className="breadcrumb-link">
                {t.home || (locale === 'ko' ? '홈' : 'Home')}
              </Link>
              <span className="breadcrumb-separator">|</span>
              <span className="breadcrumb-current">
                {content.title}
              </span>
            </nav>

            {/* Title */}
            <h1 className="privacy-title">{content.title}</h1>
            <p className="privacy-intro">{content.intro}</p>
            <p className="privacy-updated">{content.lastUpdated}</p>

            {/* Sections */}
            <div className="privacy-sections">
              {content.sections.map((section, index) => (
                <div key={index} className="privacy-section">
                  <h2 className="privacy-section-title">{section.title}</h2>
                  {'content' in section && section.content && (
                    <p className="privacy-section-content">{section.content}</p>
                  )}
                  {'subContent' in section && section.subContent && (
                    <p className="privacy-section-subcontent">{String(section.subContent)}</p>
                  )}
                  {'items' in section && section.items && section.items.length > 0 && (
                    <ul className="privacy-list">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="privacy-list-item">
                          {String(item)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {'footer' in section && section.footer && (
                    <p className="privacy-section-footer">{String(section.footer)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

