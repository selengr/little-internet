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

  let res: Response
  try {
    res = await fetch(`${SAYITVID_BASE}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        // Cloudflare in front of sayitvid.com tends to challenge Node's default user agent.
        'User-Agent': 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)',
        'X-API-Key': key,
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (err) {
    console.error('[sayitvid] request failed', path.split('?')[0], err)
    return { ok: false as const, status: 0, body: null, missingKey: false as const }
  }

  const text = await res.text().catch(() => '')
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }

  if (!res.ok) {
    // Logged so production failures show their real cause (e.g. 401 bad key, 403 Cloudflare page).
    console.error('[sayitvid] upstream error', path.split('?')[0], res.status, text.slice(0, 300))
  }

  return { ok: res.ok, status: res.status, body, missingKey: false as const }
}

/** sayitvid errors look like { error: { message, code } }; older/other shapes use strings. */
function upstreamErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const b = body as { error?: unknown; message?: unknown }
  if (typeof b.error === 'string') return b.error
  if (b.error && typeof b.error === 'object') {
    const m = (b.error as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return typeof b.message === 'string' ? b.message : null
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
    // Key/access problems (logged above) aren't something a visitor can act on.
    const accessProblem = result.status === 401 || result.status === 403
    const msg =
      (accessProblem
        ? 'Pronunciation search is unavailable right now. Please try again later.'
        : upstreamErrorMessage(result.body)) ??
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
