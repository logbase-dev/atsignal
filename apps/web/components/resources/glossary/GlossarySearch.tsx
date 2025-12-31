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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
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
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' }}>
          <input 
            type="text" 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            placeholder={locale === 'en' ? 'Search terms...' : '용어 검색...'}
            style={{ 
              flex: 1, 
              padding: '0.75rem 1rem', 
              border: '2px solid #e5e5e5', 
              borderRadius: '8px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#20BDFF';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e5e5';
            }}
          />
          <button 
            onClick={onSearch}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#20BDFF', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a9de6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#20BDFF';
            }}
          >
            {locale === 'en' ? 'Search' : '검색'}
          </button>
          {searchQuery && (
            <button 
              onClick={onClearSearch}
              style={{ 
                padding: '0.75rem 1rem', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              {locale === 'en' ? 'Clear' : '초기화'}
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#1a1a1a',
        }}>
          {locale === 'en' ? 'Browse by Category' : '카테고리별 보기'}
        </h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.75rem', 
          justifyContent: 'center',
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
      <div>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          marginBottom: '1rem',
          textAlign: 'center',
          color: '#1a1a1a',
        }}>
          {locale === 'en' ? 'A–Z Index' : 'A–Z 색인'}
        </h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '0.5rem', 
          justifyContent: 'center',
        }}>
          <button
            onClick={() => setSelectedLetter('all')}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: selectedLetter === 'all' ? '#20BDFF' : '#f5f5f5',
              color: selectedLetter === 'all' ? 'white' : '#666',
              border: '1px solid',
              borderColor: selectedLetter === 'all' ? '#20BDFF' : '#ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: selectedLetter === 'all' ? '600' : '400',
              minWidth: '40px',
              transition: 'all 0.2s ease',
            }}
          >
            {locale === 'en' ? 'All' : '전체'}
          </button>
          {alphabets.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: selectedLetter === letter ? '#20BDFF' : '#f5f5f5',
                color: selectedLetter === letter ? 'white' : '#666',
                border: '1px solid',
                borderColor: selectedLetter === letter ? '#20BDFF' : '#ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: selectedLetter === letter ? '600' : '400',
                minWidth: '40px',
                transition: 'all 0.2s ease',
              }}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}