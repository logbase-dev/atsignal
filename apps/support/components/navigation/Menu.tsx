import { getMenusByLocale } from "@/lib/cms/getMenus";
import Link from "next/link";

interface MenuProps {
  locale: string;
}

export default async function Menu({ locale }: MenuProps) {
  const menus = await getMenusByLocale(locale);

  return (
    <nav>
      {menus.map((menu: any) => 
        menu.isExternal ? (
          <a 
            key={menu.id} 
            href={menu.path} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {menu.label}
          </a>
        ) : (
          <Link key={menu.id} href={`/${locale}/${menu.path}`}>
            {menu.label}
          </Link>
        )
      )}
    </nav>
  );
}

