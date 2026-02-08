'use client';

import { useState } from 'react';
import type { GlossaryCategory } from '@/lib/admin/types';

interface GlossarySearchProps {
  locale: string;
  categories: GlossaryCategory[];
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchQuery: string;
  selectedCategoryId: string;
  setSelectedCategoryId: (value: string) => void;
  selectedLetter: string;
  setSelectedLetter: (value: string) => void;
  onSearch: () => void;
  onClearSearch: () => void;
}

export function GlossarySearch({
  locale,
  categories,
  searchInput,
  setSearchInput,
  searchQuery,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedLetter,
  setSelectedLetter,
  onSearch,
  onClearSearch,
}: GlossarySearchProps) {
  // 알파벳 목록
  const alphabets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  // 카테고리 접기/펼치기 상태
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

//
//  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//    if (e.key === 'Enter') onSearch();
//  };

// 아래는 2/6 20:06경 반영 by 김현득
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
// 2/8 19:20에 김현득이 추가 (확인용 코드)
      e.stopPropagation();
// 2/8 19:20에 김현득이 추가 (여전히 enter 디폴트 submit이 발생하는 것 같아서, 부모 문제인듯)
      onSearch();
// 2/6 20:06경 반영 by 김현득 end
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '3rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
      {/* 검색바 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'flex-end',
          maxWidth: '1200px', 
          margin: '0 auto' 
        }}>
          {/* 검색 */}
          <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151' 
            }}>
              {locale === 'en' ? 'Search' : '검색'}
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={locale === 'en' ? 'Search terms...' : '용어 검색...'}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onSearch}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#20BDFF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {locale === 'en' ? 'Search' : '검색'}
            </button>
            <button
              type="button"
              onClick={onClearSearch}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {locale === 'en' ? 'Clear' : '초기화'}
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          marginBottom: '1rem',
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: '600', 
            margin: 0,
            color: '#1a1a1a',
          }}>
            {locale === 'en' ? 'Browse by Category' : '카테고리별 보기'}
          </h3>
          <button
            onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#666"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isCategoryExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.75rem', 
          justifyContent: 'center',
          maxHeight: isCategoryExpanded ? 'none' : '2.8rem',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}>
          <button
            onClick={() => setSelectedCategoryId('all')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedCategoryId === 'all' ? '#20BDFF' : '#f5f5f5',
              color: selectedCategoryId === 'all' ? 'white' : '#666',
              border: '1px solid',
              borderColor: selectedCategoryId === 'all' ? '#20BDFF' : '#ddd',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: selectedCategoryId === 'all' ? '600' : '400',
              transition: 'all 0.2s ease',
            }}
          >
            {locale === 'en' ? 'All Categories' : '전체 카테고리'}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id!)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedCategoryId === category.id ? '#20BDFF' : '#f5f5f5',
                color: selectedCategoryId === category.id ? 'white' : '#666',
                border: '1px solid',
                borderColor: selectedCategoryId === category.id ? '#20BDFF' : '#ddd',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: selectedCategoryId === category.id ? '600' : '400',
                transition: 'all 0.2s ease',
              }}
            >
              {locale === 'en' && category.name.en ? category.name.en : category.name.ko}
            </button>
          ))}
        </div>
      </div>

      {/* 알파벳 필터 */}
      <div style={{ marginLeft: '4rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          alignItems: 'flex-start',
        }}>
          {/* 전체 버튼 - 두 줄 높이만큼 크게 */}
          <button
            onClick={() => setSelectedLetter('all')}
            style={{
              padding: '0.375rem 0.75rem',
              backgroundColor: selectedLetter === 'all' ? '#20BDFF' : '#f5f5f5',
              color: selectedLetter === 'all' ? 'white' : '#666',
              border: '1px solid',
              borderColor: selectedLetter === 'all' ? '#20BDFF' : '#ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: selectedLetter === 'all' ? '600' : '400',
              minWidth: '40px',
              height: 'calc(2 * (1.1rem + 2 * 0.375rem + 2px) + 1rem)', // 버튼 두 개 높이 + 간격
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {locale === 'en' ? 'All' : '전체'}
          </button>
          
          {/* 영어/한글 버튼들 컨테이너 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1,
          }}>
            {/* 알파벳 버튼들 */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'nowrap', 
              gap: '0.25rem', 
              justifyContent: 'flex-start',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}>
              {alphabets.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(letter)}
                  style={{
                    padding: '0.375rem 0.5rem',
                    backgroundColor: selectedLetter === letter ? '#20BDFF' : '#f5f5f5',
                    color: selectedLetter === letter ? 'white' : '#666',
                    border: '1px solid',
                    borderColor: selectedLetter === letter ? '#20BDFF' : '#ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: selectedLetter === letter ? '600' : '400',
                    minWidth: '32px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {letter}
                </button>
              ))}
            </div>
            
            {/* 한글 자음 버튼들 */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'nowrap', 
              gap: '0.25rem', 
              justifyContent: 'flex-start',
              overflowX: 'auto',
              paddingBottom: '0.25rem',
            }}>
              {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'].map((consonant) => (
                <button
                  key={consonant}
                  onClick={() => setSelectedLetter(consonant)}
                  style={{
                    padding: '0.375rem 0.5rem',
                    backgroundColor: selectedLetter === consonant ? '#20BDFF' : '#f5f5f5',
                    color: selectedLetter === consonant ? 'white' : '#666',
                    border: '1px solid',
                    borderColor: selectedLetter === consonant ? '#20BDFF' : '#ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: selectedLetter === consonant ? '600' : '400',
                    minWidth: '32px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {consonant}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}