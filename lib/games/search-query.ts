const MAX_LEN = 48

export function normalizeSearchQueryParam(raw: string | null): string {
  if (!raw) return ''
  return raw.trim().slice(0, MAX_LEN)
}

export function searchQueryToParam(value: string): string | null {
  const q = value.trim()
  if (!q) return null
  return q.slice(0, MAX_LEN)
}
