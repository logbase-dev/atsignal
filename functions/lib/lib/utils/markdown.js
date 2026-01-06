"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownToHtml = markdownToHtml;
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function formatInline(text) {
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:0.1rem 0.35rem;border-radius:0.35rem;">$1</code>');
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer" style="color:#2563eb;">$1</a>');
    // 이미지 마크다운 처리: ![alt](url)
    formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;border-radius:0.5rem;margin:0.5rem 0;" loading="lazy" />');
    return formatted;
}
// 테이블 파싱 함수
function parseTable(block) {
    const lines = block.split('\n').map((line) => line.trim());
    // 최소 2줄 필요 (헤더 + 구분선)
    if (lines.length < 2) {
        return null;
    }
    // 첫 줄이 테이블 헤더인지 확인 (|로 시작하고 끝남)
    if (!/^\|.+\|$/.test(lines[0])) {
        return null;
    }
    // 두 번째 줄이 구분선인지 확인 (| --- | 또는 |:---:| 형식)
    if (!/^\|[\s:|-]+\|$/.test(lines[1])) {
        return null;
    }
    // 헤더 파싱
    const headerCells = lines[0]
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0);
    // 데이터 행 파싱
    const dataRows = lines.slice(2)
        .filter((line) => /^\|.+\|$/.test(line))
        .map((line) => line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0));
    // 헤더 HTML 생성
    const headerHtml = headerCells
        .map((cell) => `<th style="padding:0.75rem 1rem;text-align:left;font-weight:600;border-right:1px solid #e5e7eb;">${formatInline(cell)}</th>`)
        .join('');
    // 데이터 행 HTML 생성
    const rowsHtml = dataRows
        .map((row) => {
        const cells = row
            .map((cell, index) => {
            // 헤더 개수만큼만 처리
            if (index < headerCells.length) {
                return `<td style="padding:0.75rem 1rem;border-right:1px solid #e5e7eb;">${formatInline(cell)}</td>`;
            }
            return '';
        })
            .join('');
        return `<tr style="border-bottom:1px solid #e5e7eb;">${cells}</tr>`;
    })
        .join('');
    return `<div style="overflow-x:auto;margin:1.5rem 0;"><table style="width:100%;border-collapse:collapse;border:1px solid #d1d5db;font-size:0.95rem;"><thead style="background-color:#f9fafb;border-bottom:2px solid #d1d5db;"><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}
function markdownToHtml(markdown) {
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
        // 테이블 파싱 (먼저 확인)
        const tableHtml = parseTable(block);
        if (tableHtml) {
            return tableHtml;
        }
        if (/^```/.test(block)) {
            const code = block.replace(/^```.*\n?/, '').replace(/```$/, '');
            return `<pre style="background:#f3f4f6;border:1px solid #d1d5db;color:#111827;padding:1rem;border-radius:0.75rem;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:0.875rem;line-height:1.5;"><code>${escapeHtml(code)}</code></pre>`;
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
            return `<blockquote style="border-left:4px solid #dbeafe;padding-left:1rem;margin:0.75rem 0;color:#475569;">${formatInline(text)}</blockquote>`;
        }
        return `<p style="margin:0.5rem 0;line-height:1.6;">${formatInline(block).replace(/\n/g, '<br />')}</p>`;
    })
        .join('');
    return html;
}
//# sourceMappingURL=markdown.js.map