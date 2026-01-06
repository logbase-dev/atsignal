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
      <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' }}>
        <input 
          type="text" 
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder={locale === 'en' ? 'Search updates...' : '검색...'}
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
  );
}