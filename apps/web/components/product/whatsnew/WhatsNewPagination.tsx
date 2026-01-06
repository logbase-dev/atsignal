'use client';

interface WhatsNewPaginationProps {
  locale: string;
  currentPage: number;
  totalPages: number;
  total: number;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
}

export function WhatsNewPagination({
  locale,
  currentPage,
  totalPages,
  total,
  loading,
  error,
  onPageChange,
}: WhatsNewPaginationProps) {
  if (loading || error || total === 0) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      gap: '0.5rem', 
      marginTop: '3rem' 
    }}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || totalPages <= 1}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: currentPage === 1 || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
          color: currentPage === 1 || totalPages <= 1 ? '#999' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: currentPage === 1 || totalPages <= 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          minWidth: '80px',
        }}
      >
        {locale === 'en' ? 'Previous' : '이전'}
      </button>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {/* 첫 페이지 */}
        {currentPage > 3 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '45px',
                fontSize: '0.875rem',
              }}
            >
              1
            </button>
            {currentPage > 4 && (
              <span style={{ 
                padding: '0.75rem 0.5rem', 
                color: '#666',
                fontSize: '0.875rem',
              }}>
                ...
              </span>
            )}
          </>
        )}

        {/* 현재 페이지 주변 */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(page => 
            page >= Math.max(1, currentPage - 2) && 
            page <= Math.min(totalPages, currentPage + 2)
          )
          .map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: page === currentPage ? '#0070f3' : '#fff',
                color: page === currentPage ? 'white' : '#333',
                border: '1px solid',
                borderColor: page === currentPage ? '#0070f3' : '#ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '45px',
                fontSize: '0.875rem',
                fontWeight: page === currentPage ? '600' : '400',
              }}
            >
              {page}
            </button>
          ))}

        {/* 마지막 페이지 */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && (
              <span style={{ 
                padding: '0.75rem 0.5rem', 
                color: '#666',
                fontSize: '0.875rem',
              }}>
                ...
              </span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                minWidth: '45px',
                fontSize: '0.875rem',
              }}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages || totalPages <= 1}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: currentPage >= totalPages || totalPages <= 1 ? '#e5e7eb' : '#0070f3',
          color: currentPage >= totalPages || totalPages <= 1 ? '#999' : 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: currentPage >= totalPages || totalPages <= 1 ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          minWidth: '80px',
        }}
      >
        {locale === 'en' ? 'Next' : '다음'}
      </button>
    </div>
  );
}