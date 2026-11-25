/** Client-safe helpers for PoetryDB search queries. */

export type PoetrySearchField = 'author' | 'title'

const MAX = 80

export function normalizePoetrySearchQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX)
}

export function isPoetrySearchQueryValid(q: string): boolean {
  return normalizePoetrySearchQuery(q).length >= 2
}

/** PoetryDB path segment after /author/ or /title/ */
export function poetryDbSearchPath(field: PoetrySearchField, query: string): string {
  const q = normalizePoetrySearchQuery(query)
  const enc = encodeURIComponent(q)
  return field === 'author' ? `/author/${enc}` : `/title/${enc}`
}