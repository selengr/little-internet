const GOLD_BASE = 'https://api.goldprice.dev/v1'

function goldKey() {
  return process.env.GOLDPRICE_API_KEY?.trim() || ''
}

export function goldHeaders(): HeadersInit {
  const key = goldKey()
  const headers: HeadersInit = { Accept: 'application/json' }
  if (key) headers.Authorization = `Bearer ${key}`
  return headers
}

export async function goldFetch(path: string, init?: RequestInit) {
  const url = path.startsWith('http') ? path : `${GOLD_BASE}${path.startsWith('/') ? path : `/${path}`}`
  return fetch(url, {
    ...init,
    headers: { ...goldHeaders(), ...(init?.headers || {}) },
    cache: 'no-store',
  })
}
