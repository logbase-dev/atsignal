export interface MenuOption {
  id: string;
  depth: number;
  path: string;
  label: string;
  enabled: boolean;
  hasPage?: boolean; // 추가
  hasChildren?: boolean; // 하위 메뉴 존재 여부
}

export interface PageFormValues {
  id?: string;
  menuId: string;
  slug: string;
  labels: {
    ko: string;
    en?: string;
  };
  content: {
    ko: string;
    en?: string;
  };
  editorType?: 'nextra' | 'toast';
  saveFormat?: 'markdown' | 'html';
}

