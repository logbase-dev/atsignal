export interface MenuItem {
  depth1: string;
  depth2?: string;
  depth3?: string;
  depth4?: string;
  url?: string;
  fullPath: string;
  name: string;
  description: string;
  pageType?: string;
  markdown?: string;
  category?: string;
  checkPoint?: string;
}

export interface MenuNode {
  name: string;
  path: string;
  url?: string;
  description?: string;
  children?: MenuNode[];
  pageType?: string;
  markdown?: string;
  category?: string;
  checkPoint?: string;
  isExternal?: boolean; // 외부 링크 여부
}





