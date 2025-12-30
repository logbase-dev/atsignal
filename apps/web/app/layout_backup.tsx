import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getMenusByLocale } from "@/lib/cms/getMenus";
import { buildMenuTreeFromFirestore } from "@/utils/menuTree";
import { defaultLocale } from "@/lib/i18n/getLocale";

export const metadata: Metadata = {
  title: "AtSignal - 통합 행동데이터 플랫폼",
  description: "Nethru가 보유한 데이터 분석 기술력과 경험을 집약한 통합 행동데이터 플랫폼",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Firestore에서 메뉴 가져오기 (기본 locale 사용)
  let menus: any[] = [];
  try {
    menus = await getMenusByLocale('web', defaultLocale);
  } catch (error) {
    console.error('메뉴를 불러오는 중 오류가 발생했습니다. fallback 메뉴를 사용합니다.', error);
  }

  const fallbackMenus = [
    // Product
    { id: 'product', labels: { ko: 'Product', en: 'Product' }, label: 'Product', path: 'product', depth: 1, parentId: '0', order: 1, pageType: 'dynamic' },
    { id: 'product-signal', labels: { ko: '@signal', en: '@signal' }, label: '@signal', path: 'product/product-atsignal', depth: 2, parentId: 'product', order: 1, pageType: 'dynamic' },
    { id: 'product-log-collecting', labels: { ko: 'Log Collecting', en: 'Log Collecting' }, label: 'Log Collecting', path: 'product/product-atsignal/log-collecting', depth: 3, parentId: 'product-signal', order: 1, pageType: 'dynamic' },
    { id: 'product-analytics', labels: { ko: 'Analytics', en: 'Analytics' }, label: 'Analytics', path: 'product/product-atsignal/analytics', depth: 3, parentId: 'product-signal', order: 2, pageType: 'dynamic' },
    { id: 'product-integrations', labels: { ko: 'Integrations', en: 'Integrations' }, label: 'Integrations', path: 'product/product-atsignal/integrations', depth: 3, parentId: 'product-signal', order: 3, pageType: 'dynamic' },
    { id: 'product-overview', labels: { ko: 'atsignal Overview', en: 'atsignal Overview' }, label: 'atsignal Overview', path: 'product/atsignal-overview', depth: 2, parentId: 'product', order: 2, pageType: 'dynamic' },
    { id: 'product-docs', labels: { ko: 'Docs@signal', en: 'Docs@signal' }, label: 'Docs@signal', path: 'https://atsignal-dev-docs.vercel.app/', depth: 2, parentId: 'product', order: 3, pageType: 'links' },
    { id: 'product-security', labels: { ko: 'Security & Privacy', en: 'Security & Privacy' }, label: 'Security & Privacy', path: 'product/security-privacy', depth: 2, parentId: 'product', order: 4, pageType: 'dynamic' },
    { id: 'product-whats-new', labels: { ko: "What's New", en: "What's New" }, label: "What's New", path: 'product/whats-new', depth: 2, parentId: 'product', order: 5, pageType: 'dynamic' },

    // Solutions
    { id: 'solutions', labels: { ko: 'Solutions', en: 'Solutions' }, label: 'Solutions', path: 'solution', depth: 1, parentId: '0', order: 2, pageType: 'dynamic' },
    { id: 'solutions-industry', labels: { ko: 'By Industry', en: 'By Industry' }, label: 'By Industry', path: 'solution/by-industry', depth: 2, parentId: 'solutions', order: 1, pageType: 'dynamic' },
    { id: 'solutions-industry-ecommerce', labels: { ko: 'eCommerce', en: 'eCommerce' }, label: 'eCommerce', path: 'solution/by-industry/ecommerce', depth: 3, parentId: 'solutions-industry', order: 1, pageType: 'dynamic' },
    { id: 'solutions-industry-financial', labels: { ko: 'Financial', en: 'Financial' }, label: 'Financial', path: 'solution/by-industry/financial', depth: 3, parentId: 'solutions-industry', order: 2, pageType: 'dynamic' },
    { id: 'solutions-industry-community', labels: { ko: 'Community & Fandom', en: 'Community & Fandom' }, label: 'Community & Fandom', path: 'solution/by-industry/community-fandom', depth: 3, parentId: 'solutions-industry', order: 3, pageType: 'dynamic' },
    { id: 'solutions-industry-media', labels: { ko: 'Media & Entertainment', en: 'Media & Entertainment' }, label: 'Media & Entertainment', path: 'solution/by-industry/media-entertainment', depth: 3, parentId: 'solutions-industry', order: 4, pageType: 'dynamic' },
    { id: 'solutions-industry-mobility', labels: { ko: 'Mobility', en: 'Mobility' }, label: 'Mobility', path: 'solution/by-industry/mobility', depth: 3, parentId: 'solutions-industry', order: 5, pageType: 'dynamic' },
    { id: 'solutions-industry-healthcare', labels: { ko: 'Healthcare', en: 'Healthcare' }, label: 'Healthcare', path: 'solution/by-industry/healthcare', depth: 3, parentId: 'solutions-industry', order: 6, pageType: 'dynamic' },

    { id: 'solutions-team', labels: { ko: 'By Team', en: 'By Team' }, label: 'By Team', path: 'solution/by-team', depth: 2, parentId: 'solutions', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-product', labels: { ko: 'Product', en: 'Product' }, label: 'Product', path: 'solution/by-team/product', depth: 3, parentId: 'solutions-team', order: 1, pageType: 'dynamic' },
    { id: 'solutions-team-product-funnel', labels: { ko: 'Funnel', en: 'Funnel' }, label: 'Funnel', path: 'solution/by-team/product/funnel', depth: 4, parentId: 'solutions-team-product', order: 1, pageType: 'dynamic' },
    { id: 'solutions-team-product-abtest', labels: { ko: 'AB test', en: 'AB test' }, label: 'AB test', path: 'solution/by-team/product/ab-test', depth: 4, parentId: 'solutions-team-product', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-product-ux', labels: { ko: 'UX & Usability', en: 'UX & Usability' }, label: 'UX & Usability', path: 'solution/by-team/product/ux-usability', depth: 4, parentId: 'solutions-team-product', order: 3, pageType: 'dynamic' },
    { id: 'solutions-team-product-feature-launch', labels: { ko: 'Feature Launch', en: 'Feature Launch' }, label: 'Feature Launch', path: 'solution/by-team/product/feature-launch', depth: 4, parentId: 'solutions-team-product', order: 4, pageType: 'dynamic' },
    { id: 'solutions-team-product-kpi', labels: { ko: 'KPI', en: 'KPI' }, label: 'KPI', path: 'solution/by-team/management/kpi', depth: 4, parentId: 'solutions-team-product', order: 5, pageType: 'dynamic' },

    { id: 'solutions-team-marketing', labels: { ko: 'Marketing', en: 'Marketing' }, label: 'Marketing', path: 'solution/by-team/marketing', depth: 3, parentId: 'solutions-team', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-aarrr', labels: { ko: 'AARRR', en: 'AARRR' }, label: 'AARRR', path: 'solution/by-team/marketing/aarrr', depth: 4, parentId: 'solutions-team-marketing', order: 1, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-cohort', labels: { ko: 'Cohort', en: 'Cohort' }, label: 'Cohort', path: 'solution/by-team/marketing/cohort', depth: 4, parentId: 'solutions-team-marketing', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-promo', labels: { ko: 'Promotion Uplift', en: 'Promotion Uplift' }, label: 'Promotion Uplift', path: 'solution/by-team/marketing/promotion-uplift', depth: 4, parentId: 'solutions-team-marketing', order: 3, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-ltv', labels: { ko: 'LTV', en: 'LTV' }, label: 'LTV', path: 'solution/by-team/marketing/ltv', depth: 4, parentId: 'solutions-team-marketing', order: 4, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-engagement', labels: { ko: 'Engagement', en: 'Engagement' }, label: 'Engagement', path: 'solution/by-team/marketing/engagement', depth: 4, parentId: 'solutions-team-marketing', order: 5, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-attribution', labels: { ko: 'Attribution', en: 'Attribution' }, label: 'Attribution', path: 'solution/by-team/marketing/attribution', depth: 4, parentId: 'solutions-team-marketing', order: 6, pageType: 'dynamic' },
    { id: 'solutions-team-marketing-segment', labels: { ko: 'Segment&Profiling', en: 'Segment&Profiling' }, label: 'Segment&Profiling', path: 'solution/by-team/marketing/segment-profiling', depth: 4, parentId: 'solutions-team-marketing', order: 7, pageType: 'dynamic' },

    { id: 'solutions-team-data', labels: { ko: 'Data', en: 'Data' }, label: 'Data', path: 'solution/by-team/data', depth: 3, parentId: 'solutions-team', order: 3, pageType: 'dynamic' },
    { id: 'solutions-team-data-cdp', labels: { ko: 'CDP', en: 'CDP' }, label: 'CDP', path: 'solution/by-team/data/cdp', depth: 4, parentId: 'solutions-team-data', order: 1, pageType: 'dynamic' },
    { id: 'solutions-team-data-feature-store', labels: { ko: 'Feature Stroe', en: 'Feature Stroe' }, label: 'Feature Stroe', path: 'solution/by-team/data/feature-stroe', depth: 4, parentId: 'solutions-team-data', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-data-mlops', labels: { ko: 'MLops', en: 'MLops' }, label: 'MLops', path: 'solution/by-team/data/mlops', depth: 4, parentId: 'solutions-team-data', order: 3, pageType: 'dynamic' },
    { id: 'solutions-team-data-bi', labels: { ko: 'BI', en: 'BI' }, label: 'BI', path: 'solution/by-team/data/bi', depth: 4, parentId: 'solutions-team-data', order: 4, pageType: 'dynamic' },

    { id: 'solutions-team-engineering', labels: { ko: 'Engineering', en: 'Engineering' }, label: 'Engineering', path: 'solution/by-team/engineering', depth: 3, parentId: 'solutions-team', order: 4, pageType: 'dynamic' },
    { id: 'solutions-team-engineering-log', labels: { ko: 'Log Monitoring', en: 'Log Monitoring' }, label: 'Log Monitoring', path: 'solution/by-team/engineering/log-monitoring', depth: 4, parentId: 'solutions-team-engineering', order: 1, pageType: 'dynamic' },
    { id: 'solutions-team-engineering-crash', labels: { ko: 'Crash', en: 'Crash' }, label: 'Crash', path: 'solution/by-team/engineering/crash', depth: 4, parentId: 'solutions-team-engineering', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-engineering-cwv', labels: { ko: 'Core Web Vitals', en: 'Core Web Vitals' }, label: 'Core Web Vitals', path: 'solution/by-team/engineering/core-web-vitals', depth: 4, parentId: 'solutions-team-engineering', order: 3, pageType: 'dynamic' },
    { id: 'solutions-team-engineering-error', labels: { ko: 'Error', en: 'Error' }, label: 'Error', path: 'solution/by-team/engineering/error', depth: 4, parentId: 'solutions-team-engineering', order: 4, pageType: 'dynamic' },

    { id: 'solutions-team-ops', labels: { ko: 'Operation/Support', en: 'Operation/Support' }, label: 'Operation/Support', path: 'solution/by-team/operation-support', depth: 3, parentId: 'solutions-team', order: 5, pageType: 'dynamic' },
    { id: 'solutions-team-ops-cj', labels: { ko: 'Customer Journey', en: 'Customer Journey' }, label: 'Customer Journey', path: 'solution/by-team/operation-support/customer-journey', depth: 4, parentId: 'solutions-team-ops', order: 1, pageType: 'dynamic' },
    { id: 'solutions-team-ops-optimization', labels: { ko: 'Optimization', en: 'Optimization' }, label: 'Optimization', path: 'solution/by-team/operation-support/optimization', depth: 4, parentId: 'solutions-team-ops', order: 2, pageType: 'dynamic' },
    { id: 'solutions-team-ops-merchant', labels: { ko: 'Merchant Analysis', en: 'Merchant Analysis' }, label: 'Merchant Analysis', path: 'solution/by-team/operation-support/merchant-analysis', depth: 4, parentId: 'solutions-team-ops', order: 3, pageType: 'dynamic' },
    { id: 'solutions-team-ops-regional', labels: { ko: 'Regional Analysis', en: 'Regional Analysis' }, label: 'Regional Analysis', path: 'solution/by-team/operation-support/regional-analysis', depth: 4, parentId: 'solutions-team-ops', order: 4, pageType: 'dynamic' },
    { id: 'solutions-team-ops-user', labels: { ko: 'User-focus View', en: 'User-focus View' }, label: 'User-focus View', path: 'solution/by-team/operation-support/user-focus-view', depth: 4, parentId: 'solutions-team-ops', order: 5, pageType: 'dynamic' },

    { id: 'solutions-team-management', labels: { ko: 'Management', en: 'Management' }, label: 'Management', path: 'solution/by-team/management', depth: 3, parentId: 'solutions-team', order: 6, pageType: 'dynamic' },
    { id: 'solutions-team-management-kpi', labels: { ko: 'KPI', en: 'KPI' }, label: 'KPI', path: 'solution/by-team/management/kpi', depth: 4, parentId: 'solutions-team-management', order: 1, pageType: 'dynamic' },

    { id: 'solutions-size', labels: { ko: 'By Size', en: 'By Size' }, label: 'By Size', path: 'solution/by-size', depth: 2, parentId: 'solutions', order: 3, pageType: 'dynamic' },
    { id: 'solutions-size-enterprise', labels: { ko: 'Enterprise', en: 'Enterprise' }, label: 'Enterprise', path: 'solution/by-size/enterprise', depth: 3, parentId: 'solutions-size', order: 1, pageType: 'dynamic' },
    { id: 'solutions-size-mid', labels: { ko: 'Mid-size', en: 'Mid-size' }, label: 'Mid-size', path: 'solution/by-size/mid-size', depth: 3, parentId: 'solutions-size', order: 2, pageType: 'dynamic' },
    { id: 'solutions-size-startup', labels: { ko: 'Startup', en: 'Startup' }, label: 'Startup', path: 'solution/by-size/startup', depth: 3, parentId: 'solutions-size', order: 3, pageType: 'dynamic' },
    { id: 'solutions-size-small', labels: { ko: 'Small-size', en: 'Small-size' }, label: 'Small-size', path: 'solution/by-size/small-size', depth: 3, parentId: 'solutions-size', order: 4, pageType: 'dynamic' },

    // Resources
    { id: 'resources', labels: { ko: 'Resources', en: 'Resources' }, label: 'Resources', path: 'resources', depth: 1, parentId: '0', order: 3, pageType: 'dynamic' },
    { id: 'resources-onboarding', labels: { ko: 'Onboarding@signal', en: 'Onboarding@signal' }, label: 'Onboarding@signal', path: 'resources/onboarding-atsignal', depth: 2, parentId: 'resources', order: 1, pageType: 'dynamic' },
    { id: 'resources-customers', labels: { ko: 'Customers@signal', en: 'Customers@signal' }, label: 'Customers@signal', path: 'resources/customers-atsignal', depth: 2, parentId: 'resources', order: 2, pageType: 'dynamic' },
    { id: 'resources-faq', labels: { ko: 'FAQ', en: 'FAQ' }, label: 'FAQ', path: 'resources/faq', depth: 2, parentId: 'resources', order: 3, pageType: 'dynamic' },
    { id: 'resources-glossary', labels: { ko: 'Glossary', en: 'Glossary' }, label: 'Glossary', path: 'resources/glossary', depth: 2, parentId: 'resources', order: 4, pageType: 'dynamic' },

    // Pricing
    { id: 'pricing', labels: { ko: 'Pricing', en: 'Pricing' }, label: 'Pricing', path: 'pricing', depth: 1, parentId: '0', order: 4, pageType: 'dynamic' },
    { id: 'pricing-contact', labels: { ko: 'Contact Sales', en: 'Contact Sales' }, label: 'Contact Sales', path: 'pricing/contact-sales', depth: 2, parentId: 'pricing', order: 1, pageType: 'dynamic' },
    { id: 'pricing-info', labels: { ko: 'Information', en: 'Information' }, label: 'Information', path: 'pricing/information', depth: 2, parentId: 'pricing', order: 2, pageType: 'dynamic' },
    { id: 'pricing-comparison', labels: { ko: 'Comparison', en: 'Comparison' }, label: 'Comparison', path: 'pricing/comparison', depth: 2, parentId: 'pricing', order: 3, pageType: 'dynamic' },

    // Company
    { id: 'company', labels: { ko: 'Company', en: 'Company' }, label: 'Company', path: 'company', depth: 1, parentId: '0', order: 5, pageType: 'dynamic' },
    { id: 'company-about', labels: { ko: 'About us', en: 'About us' }, label: 'About us', path: 'company/about-us', depth: 2, parentId: 'company', order: 1, pageType: 'dynamic' },
  ];

  if (!menus || menus.length === 0) {
    menus = fallbackMenus;
  }

  const menuTree = buildMenuTreeFromFirestore(menus, defaultLocale);

  // Footer용: 전체 메뉴를 전달 (depth2의 자식을 찾기 위해)
  const footerMenus = menus.map((menu: any) => ({
    id: menu.id,
    labels: menu.labels,
    label: menu.label,
    path: menu.path,
    depth: menu.depth,
    parentId: menu.parentId,
    order: menu.order || 0,
    pageType: menu.pageType, // 추가
    url: menu.url, // 추가
  }));

  return (
    <html lang="ko">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header menuTree={menuTree} />
          <main className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{ flex: 1 }}>
            {children}
          </main>
          <Footer menus={footerMenus} />
        </div>
      </body>
    </html>
  );
}
