'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPublicGlossaries, getPublicGlossaryCategories } from '@/lib/resources/glossary/glossaryService';
import type { Glossary, GlossaryCategory } from '@/lib/admin/types';
import { GlossarySearch } from '@/components/resources/glossary/GlossarySearch';
import { GlossaryList } from '@/components/resources/glossary/GlossaryList';

interface PageProps {
  params: Promise<{
    locale: string;
  }> | {
    locale: string;
  };
}

export default function GlossaryPage({ params }: PageProps) {
  const [locale, setLocale] = useState<string>('ko');
  const [glossaries, setGlossaries] = useState<Glossary[]>([]);
  const [categories, setCategories] = useState<GlossaryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    // params가 Promise인지 확인
    if (params && typeof (params as any).then === 'function') {
      (params as Promise<{ locale: string }>)
        .then((p) => {
          setLocale(p.locale);
        })
        .catch((err) => {
          console.error('Failed to get locale from params:', err);
        });
    } else if (params && typeof params === 'object' && 'locale' in params) {
      setLocale((params as { locale: string }).locale);
    }
  }, [params]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getPublicGlossaryCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const loadGlossaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const enabled = {
        ko: locale === 'ko',
        en: locale === 'en',
      };

      const result = await getPublicGlossaries({
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        search: searchQuery || undefined,
        initialLetter: selectedLetter !== 'all' ? selectedLetter : undefined,
        orderBy: 'term',
        orderDirection: 'asc',
        page: 1,
        limit: 1000, // 모든 용어를 가져와서 클라이언트에서 처리
        enabled,
      });

      setGlossaries(result.glossaries);
    } catch (err: any) {
      console.error('Failed to load glossaries:', err);
      setError(err.message || '용어사전을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [locale, selectedCategoryId, searchQuery, selectedLetter]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadGlossaries();
  }, [loadGlossaries]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9f9f9',
      padding: '2rem 1rem',
      paddingTop: '6rem',
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
      }}>
        {/* 검색 및 필터 */}
        <GlossarySearch
          locale={locale}
          categories={categories}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          searchQuery={searchQuery}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          selectedLetter={selectedLetter}
          setSelectedLetter={setSelectedLetter}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
        />

        {/* 용어사전 목록 */}
        <GlossaryList
          locale={locale}
          glossaries={glossaries}
          categories={categories}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}