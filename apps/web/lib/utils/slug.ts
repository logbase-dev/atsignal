/**
 * Slug helpers
 * - Only allows lowercase letters, numbers, and hyphens.
 * - Intended for English slugs. For Korean titles, prefer providing an English title
 *   and generating slug from it (per design doc).
 */

export function slugify(input: string): string {
  const raw = (input || '').trim().toLowerCase();
  if (!raw) return '';

  // Replace whitespace/underscore with hyphen
  let s = raw.replace(/[\s_]+/g, '-');

  // Remove invalid chars
  s = s.replace(/[^a-z0-9-]+/g, '');

  // Collapse multiple hyphens
  s = s.replace(/-+/g, '-');

  // Trim hyphens
  s = s.replace(/^-+/, '').replace(/-+$/, '');

  return s;
}

export function isValidSlug(slug: string): boolean {
  const s = (slug || '').trim();
  if (!s) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
}


