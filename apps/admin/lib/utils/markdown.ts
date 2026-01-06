function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(text: string) {
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:0.1rem 0.35rem;border-radius:0.35rem;">$1</code>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:#2563eb;">$1</a>');
  // 이미지 마크다운 처리: ![alt](url)
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:0.5rem;margin:0.5rem 0;" loading="lazy" />');
  return formatted;
}

export function markdownToHtml(markdown: string) {
  if (!markdown.trim()) {
    return '';
  }

  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n{2,}/).map((block) => block.trim());

  const html = blocks
    .map((block) => {
      if (!block) {
        return '';
      }

      if (/^```/.test(block)) {
        const code = block.replace(/^```.*\n?/, '').replace(/```$/, '');
        return `<pre style="background:#f3f4f6;border:1px solid #d1d5db;color:#111827;padding:1rem;border-radius:0.75rem;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:0.875rem;line-height:1.5;"><code>${escapeHtml(
          code,
        )}</code></pre>`;
      }

      if (/^#{1,6}\s/.test(block)) {
        const level = (block.match(/^#+/)?.[0].length ?? 1).toString();
        const text = block.replace(/^#{1,6}\s*/, '');
        return `<h${level} style="margin:1rem 0 0.5rem;font-weight:700;">${formatInline(text)}</h${level}>`;
      }

      if (block.split('\n').every((line) => /^[-*]\s+/.test(line))) {
        const items = block
          .split('\n')
          .map((line) => line.replace(/^[-*]\s+/, '').trim())
          .map((item) => `<li>${formatInline(item)}</li>`)
          .join('');
        return `<ul style="padding-left:1.25rem;margin:0.5rem 0;">${items}</ul>`;
      }

      if (block.split('\n').every((line) => /^\d+\.\s+/.test(line))) {
        const items = block
          .split('\n')
          .map((line) => line.replace(/^\d+\.\s+/, '').trim())
          .map((item) => `<li>${formatInline(item)}</li>`)
          .join('');
        return `<ol style="padding-left:1.25rem;margin:0.5rem 0;">${items}</ol>`;
      }

      if (/^>\s?/.test(block)) {
        const text = block.replace(/^>\s?/, '');
        return `<blockquote style="border-left:4px solid #dbeafe;padding-left:1rem;margin:0.75rem 0;color:#475569;">${formatInline(
          text,
        )}</blockquote>`;
      }

      return `<p style="margin:0.5rem 0;line-height:1.6;">${formatInline(block).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');

  return html;
}

