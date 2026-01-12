'use client';

interface WhatsNewSearchProps {
  locale: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  searchQuery: string;
  onSearch: () => void;
  onClearSearch: () => void;
}

export function WhatsNewSearch({
  locale,
  searchInput,
  setSearchInput,
  searchQuery,
  onSearch,
  onClearSearch,
}: WhatsNewSearchProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    }}>
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
            placeholder={locale === 'en' ? 'Search by title or content' : '제목이나 내용을 검색하세요'}
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
  );
}