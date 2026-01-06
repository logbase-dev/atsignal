'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MenuNode } from '@/utils/menuTree';
import type { Menu, Site, Page } from '@/lib/admin/types';

interface MenuTreeProps {
  nodes: MenuNode[];
  onEdit: (menu: MenuNode) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onToggleEnabled: (id: string, locale: 'ko' | 'en') => void;
  onDragEnd: (activeId: string, overId: string | null, activeIndex: number, overIndex: number) => void;
  canDrop: (draggedId: string, targetParentId: string) => boolean;
  menus: Menu[];
  pages?: Page[];
  level?: number;
  site?: Site;
}

export function MenuTree({ 
  nodes, 
  onEdit, 
  onDelete, 
  onAddChild,
  onToggleEnabled,
  onDragEnd,
  canDrop,
  menus,
  pages = [],
  level = 0,
  site
}: MenuTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = nodes.findIndex(n => n.id === active.id);
    const overIndex = nodes.findIndex(n => n.id === over.id);

    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    const activeNode = nodes[activeIndex];
    const overNode = nodes[overIndex];

    // 드롭 가능 여부 확인
    if (overNode && !canDrop(active.id as string, overNode.parentId)) {
      alert('자기 자신의 하위 메뉴로 이동할 수 없습니다.');
      return;
    }

    onDragEnd(
      active.id as string,
      over.id as string,
      activeIndex,
      overIndex
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={nodes.map(n => n.id!).filter(Boolean)}
        strategy={verticalListSortingStrategy}
      >
        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
          {nodes.map((node) => (
            <SortableMenuTreeNode
              key={node.id}
              node={node}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onToggleEnabled={onToggleEnabled}
              onDragEnd={onDragEnd}
              canDrop={canDrop}
              menus={menus}
              pages={pages}
              level={level}
              site={site}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

interface MenuTreeNodeProps {
  node: MenuNode;
  onEdit: (menu: MenuNode) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onToggleEnabled: (id: string, locale: 'ko' | 'en') => void;
  onDragEnd: (activeId: string, overId: string | null, activeIndex: number, overIndex: number) => void;
  canDrop: (draggedId: string, targetParentId: string) => boolean;
  menus: Menu[];
  pages: Page[];
  level: number;
  site?: Site;
}

function SortableMenuTreeNode({ 
  node, 
  onEdit, 
  onDelete, 
  onAddChild,
  onToggleEnabled,
  onDragEnd,
  canDrop,
  menus,
  pages,
  level,
  site
}: MenuTreeNodeProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // localStorage 키 생성 (site별로 구분)
  const getStorageKey = (menuId: string) => {
    const sitePrefix = site ? `${site}-` : '';
    return `menu-expanded-${sitePrefix}${menuId}`;
  };

  // localStorage에서 초기값 가져오기 (없으면 false - 접힌 상태)
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined' && node.id) {
      const saved = localStorage.getItem(getStorageKey(node.id));
      return saved === 'true';
    }
    return false; // 기본값은 접힌 상태
  });

  // 확장/축소 핸들러
  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // localStorage에 저장
    if (typeof window !== 'undefined' && node.id) {
      localStorage.setItem(getStorageKey(node.id), String(newExpanded));
    }
  };

  // 하위메뉴가 없는지 확인
  const hasNoChildren = !node.children || node.children.length === 0;
  
  // 해당 메뉴에 연결된 페이지 찾기
  const connectedPage = node.id ? pages.find(p => p.menuId === node.id) : null;
  
  // 페이지 작성/수정 버튼 핸들러
  const handlePageEdit = () => {
    if (!site || !node.id) return;
    
    if (connectedPage?.id) {
      // 페이지가 있으면 수정 페이지로 이동
      router.push(`/pages/${site}/${connectedPage.id}`);
    } else {
      // 페이지가 없으면 새 페이지 작성 페이지로 이동 (menuId를 쿼리로 전달)
      router.push(`/pages/${site}/new?menuId=${node.id}`);
    }
  };

  return (
    <li ref={setNodeRef} style={{ marginBottom: '0.5rem', ...style }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0.75rem',
        backgroundColor: isDragging 
          ? '#e3f2fd' 
          : (level % 2 === 0 ? '#f8f9fa' : '#fff'),
        borderRadius: '0.25rem',
        border: isDragging ? '2px solid #2196f3' : '1px solid #e5e5e5',
        marginLeft: `${level * 24}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}>
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            padding: '0.25rem',
            marginRight: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            color: '#666',
            userSelect: 'none',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            style={{ display: 'block' }}
          >
            <circle cx="2" cy="2" r="1" />
            <circle cx="6" cy="2" r="1" />
            <circle cx="10" cy="2" r="1" />
            <circle cx="2" cy="6" r="1" />
            <circle cx="6" cy="6" r="1" />
            <circle cx="10" cy="6" r="1" />
            <circle cx="2" cy="10" r="1" />
            <circle cx="6" cy="10" r="1" />
            <circle cx="10" cy="10" r="1" />
          </svg>
        </div>
        {/* 확장/축소 아이콘 */}
        {node.children && node.children.length > 0 ? (
          <button
            onClick={handleToggleExpand}
            style={{ 
              marginRight: '0.5rem', 
              border: 'none', 
              background: 'none', 
              cursor: 'pointer',
              fontSize: '0.75rem',
              width: '20px',
              textAlign: 'center',
              padding: 0
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <span style={{ width: '20px', display: 'inline-block' }} />
        )}

        {/* 메뉴 정보 */}
        <div style={{ flex: 1 }}>
          <strong style={{ fontSize: '1rem' }}>
            {node.labels.ko}
            {node.labels.en && <span style={{ color: '#666', fontWeight: 'normal' }}> / {node.labels.en}</span>}
          </strong>
          <span style={{ color: '#666', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
            {node.path}
          </span>
          {(() => {
            const statusTexts: string[] = [];
            if (!node.enabled.ko) statusTexts.push('[한글 비활성화]');
            if (!node.enabled.en) statusTexts.push('[영문 비활성화]');
            
            return statusTexts.length > 0 ? (
              <span style={{ 
                color: '#dc3545', 
                marginLeft: '0.5rem', 
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {statusTexts.join(' ')}
              </span>
            ) : null;
          })()}
          <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
            (Depth: {node.depth}, Order: {node.order})
          </span>
        </div>

        {/* 액션 버튼 */}
        <div>

         {/* 페이지 작성/수정 버튼 - 하위메뉴가 없고 외부 링크가 아닌 경우에만 표시 */}
         {hasNoChildren && node.pageType !== 'links' && (
            <button 
              onClick={handlePageEdit}
              style={{ 
                marginRight: '0.5rem', 
                padding: '0.25rem 0.5rem', 
                backgroundColor: connectedPage ? '#28a745' : '#0070f3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.25rem', 
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
              title={connectedPage ? '페이지 수정' : '페이지 작성'}
            >
              {connectedPage ? '페이지 수정' : '페이지 작성'}
            </button>
          )}

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.id!);
            }}
            style={{ 
              marginRight: '0.5rem', 
              padding: '0.35rem 0.75rem', 
              backgroundColor: '#0070f3', // 파란색으로 변경
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            title="하위 메뉴 추가"
          >
            + 하위 추가
          </button>
          <button
            onClick={() => onToggleEnabled(node.id!, 'ko')}
            style={{
              marginRight: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: node.enabled.ko ? '#ffc107' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            title={`한글 메뉴 ${node.enabled.ko ? '비활성화' : '활성화'}`}
          >
            {node.enabled.ko ? 'KO 비활성화' : 'KO 활성화'}
          </button>
          <button
            onClick={() => onToggleEnabled(node.id!, 'en')}
            style={{
              marginRight: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: node.enabled.en ? '#ffc107' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            title={`영문 메뉴 ${node.enabled.en ? '비활성화' : '활성화'}`}
          >
            {node.enabled.en ? 'EN 비활성화' : 'EN 활성화'}
          </button>
          <button 
            onClick={() => onEdit(node)}
            style={{ 
              marginRight: '0.5rem', 
              padding: '0.25rem 0.5rem', 
              backgroundColor: '#666', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem', 
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            수정
          </button>
          <button 
            onClick={() => {
              onDelete(node.id!); // confirm 제거, 모든 확인 로직은 MenuManagement의 handleDelete에서 처리
            }}
            style={{ 
              padding: '0.25rem 0.5rem', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.25rem', 
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 자식 메뉴 */}
      {isExpanded && node.children && node.children.length > 0 && (
        <MenuTree
          nodes={node.children}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onToggleEnabled={onToggleEnabled}
          onDragEnd={onDragEnd}
          canDrop={canDrop}
          menus={menus}
          pages={pages}
          level={level + 1}
          site={site}
        />
      )}
    </li>
  );
}

