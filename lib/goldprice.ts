const GOLD_BASE = 'https://api.goldprice.dev/v1'

export type GoldSpot = {
  symbol: string
  quote: string
  unit: string
  contract: string
  price: number | null
  bid: number | null
  ask: number | null
  isStale: boolean
  computedAt: string | null
  changePct: number | null
  gram24k: number | null
  gram22k: number | null
  gram18k: number | null
}

export type GoldPayload = {
  gold: GoldSpot | null
  silver: GoldSpot | null
  carat: Record<string, string> | null
  updatedAt: string
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(String(v))
  return Number.isFinite(n) ? n : null
}

function mapRow(row: Record<string, unknown> | undefined): GoldSpot | null {
  if (!row) return null
  return {
    symbol: String(row.symbol ?? ''),
    quote: String(row.quote_currency ?? 'USD'),
    unit: String(row.unit ?? 'troy_ounce'),
    contract: String(row.contract_type ?? 'spot'),
    price: num(row.price),
    bid: num(row.bid),
    ask: num(row.ask),
    isStale: Boolean(row.is_stale),
    computedAt: typeof row.computed_at === 'string' ? row.computed_at : null,
    changePct: num(row.chp),
    gram24k: num(row.price_gram_24k),
    gram22k: num(row.price_gram_22k),
    gram18k: num(row.price_gram_18k),
  }
}

function headers(): HeadersInit {
  const key = process.env.GOLDPRICE_API_KEY?.trim()
  const h: HeadersInit = { Accept: 'application/json' }
  if (key) h.Authorization = `Bearer ${key}`
  return h
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${GOLD_BASE}${path}`, {
    headers: headers(),
    cache: 'no-store',
    next: { revalidate: 0 },
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { error: text.slice(0, 200) }
  }
  if (!res.ok) {
    const err =
      typeof json === 'object' && json && 'error' in json
        ? String((json as { error?: string }).error)
        : `Goldprice ${res.status}`
    throw new Error(err)
  }
  return json
}

/** Live gold + silver spot (and karat ladder when available). */
export async function fetchGoldMarkets(): Promise<GoldPayload> {
  const [goldSettled, silverSettled, caratSettled] = await Promise.allSettled([
    fetchJson('/prices?symbol=XAU-USD-SPOT&include=karat,stats').catch(() =>
      fetchJson('/prices?symbol=XAU-USD-SPOT&include=karat'),
    ),
    fetchJson('/prices?symbol=XAG-USD-SPOT'),
    fetchJson('/carat?currency=USD'),
  ])

  const goldEnvelope =
    goldSettled.status === 'fulfilled'
      ? (goldSettled.value as { symbols?: Record<string, unknown>[] })
      : null
  const gold = mapRow(goldEnvelope?.symbols?.[0])

  const silverEnvelope =
    silverSettled.status === 'fulfilled'
      ? (silverSettled.value as { symbols?: Record<string, unknown>[] })
      : null
  const silver = mapRow(silverEnvelope?.symbols?.[0])

  const carat =
    caratSettled.status === 'fulfilled' &&
    caratSettled.value &&
    typeof caratSettled.value === 'object'
      ? (caratSettled.value as Record<string, string>)
      : null

  if (gold && carat) {
    gold.gram24k = num(carat.price_gram_24k) ?? gold.gram24k
    gold.gram22k = num(carat.price_gram_22k) ?? gold.gram22k
    gold.gram18k = num(carat.price_gram_18k) ?? gold.gram18k
  }

  return {
    gold,
    silver,
    carat,
    updatedAt: new Date().toISOString(),
  }
}
