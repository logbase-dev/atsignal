'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuNode } from '@/types/menu';
import { buildMenuTree, pathToUrl } from '@/utils/menu';
import { getLocaleFromPath } from '@/lib/i18n/getLocale';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  const menuTree = buildMenuTree();
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);

  const toggleMenu = (path: string) => {
    const newOpenMenus = new Set(openMenus);
    if (newOpenMenus.has(path)) {
      newOpenMenus.delete(path);
    } else {
      newOpenMenus.add(path);
    }
    setOpenMenus(newOpenMenus);
  };

  const renderMenuItems = (nodes: MenuNode[], level: number = 0) => {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isOpen = openMenus.has(node.path);
      const indentClass = level > 0 ? `ml-${level * 4}` : '';

      if (hasChildren) {
        return (
          <div key={node.path} className={indentClass}>
            <button
              onClick={() => toggleMenu(node.path)}
              className="flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <span className="font-medium">{node.name}</span>
              <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
            {isOpen && (
              <div className="ml-4 mt-1">
                {renderMenuItems(node.children!, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={node.path}
          href={pathToUrl(node.path, locale)}
          className={`block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors ${indentClass}`}
        >
          {node.name}
        </Link>
      );
    });
  };

  return (
    <nav className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4">
        <Link href={`/${locale}`} className="block mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AtSignal</h1>
        </Link>
        <div className="space-y-1">
          {renderMenuItems(menuTree)}
        </div>
      </div>
    </nav>
  );
}


