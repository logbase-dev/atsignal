import { MenuItem, MenuNode } from '@/types/menu';
import { menuData } from '@/data/menu';
import { defaultLocale, isValidLocale } from '@/lib/i18n/getLocale';

function normalizePath(input: string): string {
  if (!input) return '/';
  // URL 디코딩
  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    decoded = input;
  }
  // 공백 처리: 공백을 그대로 유지 (URL에서는 %20으로 인코딩되지만 매칭은 원본 기준)
  const trimmed = decoded.trim();
  // 끝/앞 슬래시 정리 후 다시 앞에 슬래시 하나만 유지
  const withoutExtraSlashes = trimmed.replace(/\/{2,}/g, '/').replace(/\/+$/g, '');
  const withLeadingSlash = withoutExtraSlashes.startsWith('/')
    ? withoutExtraSlashes
    : `/${withoutExtraSlashes}`;
  return withLeadingSlash;
}

// URL 경로를 메뉴 경로로 변환 (공백 처리)
function urlPathToMenuPath(urlPath: string): string {
  // URL에서 %20을 공백으로 변환
  const decoded = decodeURIComponent(urlPath);
  return normalizePath(decoded);
}

export function buildMenuTree(): MenuNode[] {
  const tree: Map<string, MenuNode> = new Map();
  const rootNodes: MenuNode[] = [];

  // "Direct link"는 홈이므로 제외
  const filteredMenuData = menuData.filter((item) => item.depth1 !== 'Direct link');

  filteredMenuData.forEach((item) => {
    const pathParts = [
      item.depth1,
      item.depth2,
      item.depth3,
      item.depth4,
    ].filter(Boolean) as string[];

    let currentPath = '';
    let parentNode: MenuNode | null = null;

    pathParts.forEach((part, index) => {
      const isLast = index === pathParts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;

      if (!tree.has(currentPath)) {
        // 중간 경로에 대한 노드 생성
        const intermediatePath = currentPath;
        const node: MenuNode = {
          name: isLast ? item.name : part,
          path: isLast ? normalizePath(item.fullPath) : intermediatePath,
          url: isLast ? item.url : undefined,
          description: isLast ? item.description : undefined,
          children: [],
          pageType: isLast ? item.pageType : undefined,
          markdown: isLast ? item.markdown : undefined,
          category: isLast ? item.category : undefined,
          checkPoint: isLast ? item.checkPoint : undefined,
        };

        tree.set(currentPath, node);

        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = [];
          }
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }

        parentNode = node;
      } else {
        parentNode = tree.get(currentPath) || null;
      }
    });
  });

  return rootNodes;
}

export function getMenuByPath(path: string): MenuItem | undefined {
  if (!path) return undefined;
  
  // URL 경로를 메뉴 경로로 변환
  const target = urlPathToMenuPath(path);
  
  // 정확히 일치하는 항목 찾기
  let found = menuData.find((item) => {
    const itemPath = normalizePath(item.fullPath);
    return itemPath === target;
  });
  
  // 정확히 일치하지 않으면 다양한 형태로 시도
  if (!found) {
    // 공백을 다른 형태로도 시도
    const variations = [
      target,
      target.replace(/ /g, '%20'),
      target.replace(/%20/g, ' '),
      target.replace(/ /g, '+'),
      target.replace(/\+/g, ' '),
    ];
    
    for (const variant of variations) {
      found = menuData.find((item) => {
        const itemPath = normalizePath(item.fullPath);
        const itemVariations = [
          itemPath,
          itemPath.replace(/ /g, '%20'),
          itemPath.replace(/%20/g, ' '),
          itemPath.replace(/ /g, '+'),
          itemPath.replace(/\+/g, ' '),
        ];
        return itemVariations.some(iv => variations.some(v => {
          // 대소문자 무시 비교
          return iv.toLowerCase() === v.toLowerCase();
        }));
      });
      if (found) break;
    }
  }
  
  // 여전히 찾지 못했으면 중간 경로도 확인 (예: /Product, /Product/Product@signal)
  if (!found) {
    // 중간 경로에 해당하는 첫 번째 하위 항목을 찾기
    const matchingItems = menuData.filter((item) => {
      const itemPath = normalizePath(item.fullPath);
      return itemPath.startsWith(target + '/') || itemPath === target;
    });
    
    if (matchingItems.length > 0) {
      // 가장 가까운 하위 항목 반환 (경로 길이가 가장 짧은 것)
      found = matchingItems.sort((a, b) => {
        const aPath = normalizePath(a.fullPath);
        const bPath = normalizePath(b.fullPath);
        return aPath.length - bPath.length;
      })[0];
    }
  }
  
  return found;
}

export function getBreadcrumbs(path: string): MenuNode[] {
  const breadcrumbs: MenuNode[] = [];
  const normalized = normalizePath(path);
  const pathParts = normalized.split('/').filter(Boolean);
  
  let currentPath = '';
  pathParts.forEach((part) => {
    currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
    const item = menuData.find((m) => normalizePath(m.fullPath) === currentPath);
    if (item) {
      breadcrumbs.push({
        name: item.name,
        path: normalizePath(item.fullPath),
        url: item.url,
        description: item.description,
      });
    }
  });

  return breadcrumbs;
}

export function getChildrenByPrefix(prefixPath: string): MenuItem[] {
  const normalizedPrefix = normalizePath(prefixPath);
  return menuData.filter((m) => normalizePath(m.fullPath).startsWith(`${normalizedPrefix}/`));
}

// 경로를 URL-safe한 형태로 변환 (Next.js Link에서 사용)
export function pathToUrl(path: string, locale?: string): string {
  const normalized = normalizePath(path);
  const parts = normalized.split('/').filter(Boolean);
  const localeToUse = locale && isValidLocale(locale) ? locale : defaultLocale;

  const hasLocalePrefix = parts.length > 0 && isValidLocale(parts[0]);
  const finalParts =
    parts.length === 0
      ? [localeToUse]
      : hasLocalePrefix
      ? parts
      : [localeToUse, ...parts];

  return '/' + finalParts.map((part) => encodeURIComponent(part)).join('/');
}

