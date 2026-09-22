import type {
  SayItVidAccent,
  SayItVidQuotaResponse,
  SayItVidSearchResponse,
} from '@/types/sayitvid'

const SAYITVID_BASE = 'https://sayitvid.com'

export function getSayItVidApiKey(): string | null {
  const key = process.env.SAYITVID_API_KEY?.trim()
  return key || null
}

async function sayitvidFetch(path: string, init?: RequestInit) {
  const key = getSayItVidApiKey()
  if (!key) {
    return { ok: false as const, status: 503, body: null, missingKey: true as const }
  }

  const res = await fetch(`${SAYITVID_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'X-API-Key': key,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  return { ok: res.ok, status: res.status, body, missingKey: false as const }
}

export async function searchPronunciations(opts: {
  q: string
  accent?: SayItVidAccent
  limit?: number
  offset?: number
}) {
  const q = opts.q.trim()
  if (!q) {
    return { ok: false as const, status: 400, error: 'Type a word to search.', body: null }
  }

  const accent = opts.accent ?? 'all'
  const limit = Math.min(Math.max(opts.limit ?? 12, 1), 40)
  const offset = Math.max(opts.offset ?? 0, 0)

  const params = new URLSearchParams({
    q,
    accent,
    limit: String(limit),
    offset: String(offset),
  })

  const result = await sayitvidFetch(`/api/v1/search?${params}`)

  if (result.missingKey) {
    return {
      ok: false as const,
      status: 503,
      error: 'Pronunciation search is not configured yet.',
      code: 'missing_key' as const,
      body: null,
    }
  }

  if (!result.ok) {
    const body = result.body as { error?: string; message?: string; quota?: unknown } | null
    const msg =
      body?.error ??
      body?.message ??
      (result.status === 429
        ? 'Daily search limit reached. Try again tomorrow.'
        : 'Could not search right now. Please try again.')
    return {
      ok: false as const,
      status: result.status === 429 ? 429 : 502,
      error: msg,
      code: (result.status === 429 ? 'quota' : 'upstream') as 'quota' | 'upstream',
      body: result.body as SayItVidSearchResponse | null,
    }
  }

  return {
    ok: true as const,
    status: 200,
    body: result.body as SayItVidSearchResponse,
  }
}

export async function fetchSayItVidQuota() {
  const result = await sayitvidFetch('/api/v1/quota')

  if (result.missingKey) {
    return {
      ok: false as const,
      status: 503,
      error: 'Pronunciation search is not configured yet.',
      code: 'missing_key' as const,
      body: null,
    }
  }

  if (!result.ok) {
    return {
      ok: false as const,
      status: 502,
      error: 'Could not check remaining searches.',
      code: 'upstream' as const,
      body: null,
    }
  }

  return {
    ok: true as const,
    status: 200,
    body: result.body as SayItVidQuotaResponse,
  }
}
