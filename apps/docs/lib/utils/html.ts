/**
 * HTML 엔티티를 디코딩합니다 (서버/클라이언트 모두 지원)
 * DB에 이스케이프된 상태로 저장된 HTML을 표시할 때 사용합니다.
 */
export function decodeHtmlEntities(html: string): string {
  if (!html) return html;
  
  // 브라우저 환경
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }
  
  // 서버 환경 (Node.js) - 기본적인 HTML 엔티티 디코딩
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&');
}

