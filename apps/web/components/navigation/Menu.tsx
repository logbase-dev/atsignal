import { getMenusByLocale } from "@/lib/cms/getMenus";
import Link from "next/link";

interface MenuProps {
  locale: 'ko' | 'en';
}

export default async function Menu({ locale }: MenuProps) {
  const menus = await getMenusByLocale('web', locale);

  return (
    <nav>
      {menus
        .filter((menu: any) => menu.enabled !== false) // 추가 안전장치
        .map((menu: any) => 
          menu.isExternal ? (
            <a 
              key={menu.id} 
              href={menu.path} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {menu.label || menu.labels?.[locale] || menu.labels?.ko}
            </a>
          ) : (
            <Link key={menu.id} href={`/${locale}/${menu.path}`}>
              {menu.label || menu.labels?.[locale] || menu.labels?.ko}
            </Link>
          )
        )}
    </nav>
  );
}

