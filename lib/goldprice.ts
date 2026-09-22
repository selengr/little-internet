const GOLD_BASE = 'https://api.goldprice.dev/v1'

export type GoldSpot = {
  symbol: string
  quote_currency: string
  unit: string
  contract_type: string
  price: string | null
  bid?: string | null
  ask?: string | null
  is_stale: boolean
  computed_at?: string | null
  ch?: string | null
  chp?: string | null
  prev_close_price?: string | null
  price_gram_24k?: string | null
  price_gram_22k?: string | null
  price_gram_21k?: string | null
  price_gram_18k?: string | null
  price_gram_14k?: string | null
}

export type GoldBar = {
  bar_start: string
  open: string | null
  high: string | null
  low: string | null
  close: string | null
  is_closed: boolean
}

export type GoldCarat = {
  currency: string
  timestamp: string
  price_gram_24k: string
  price_gram_22k: string
  price_gram_21k: string
  price_gram_20k: string
  price_gram_18k: string
  price_gram_16k: string
  price_gram_14k: string
  price_gram_10k: string
}

export type GoldHorizon = {
  expiry: string
  futures: { contract: string; settle_usd: string } | null
}

function goldKey() {
  return process.env.GOLDPRICE_API_KEY?.trim() || ''
}

export async function goldFetch(path: string, search?: Record<string, string>) {
  const url = new URL(`${GOLD_BASE}${path}`)
  if (search) {
    for (const [k, v] of Object.entries(search)) {
      if (v) url.searchParams.set(k, v)
    }
  }
  const headers: HeadersInit = { Accept: 'application/json' }
  const key = goldKey()
  if (key) headers.Authorization = `Bearer ${key}`

  const res = await fetch(url.toString(), { headers, cache: 'no-store' })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { error: text || 'Bad response' }
  }
  return { ok: res.ok, status: res.status, json }
}

export async function fetchGoldBundle() {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 28)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  const [spotRes, caratRes, barsRes, forwardRes] = await Promise.all([
    goldFetch('/prices', { symbol: 'XAU-USD-SPOT', include: 'karat,stats' }),
    goldFetch('/carat', { currency: 'USD' }),
    goldFetch('/bars', {
      symbol: 'XAU-USD-SPOT',
      interval: '1d',
      from: iso(from),
      to: iso(to),
      limit: '30',
    }),
    goldFetch('/forward-view/XAU'),
  ])

  const spotJson = spotRes.json as { symbols?: GoldSpot[]; error?: string } | GoldSpot
  const spot: GoldSpot | null = Array.isArray((spotJson as { symbols?: GoldSpot[] }).symbols)
    ? (spotJson as { symbols: GoldSpot[] }).symbols[0] ?? null
    : (spotJson as GoldSpot)?.symbol
      ? (spotJson as GoldSpot)
      : null

  const carat = caratRes.ok ? (caratRes.json as GoldCarat) : null
  const barsJson = barsRes.json as { bars?: GoldBar[] }
  const bars = Array.isArray(barsJson?.bars) ? barsJson.bars.slice().reverse() : []
  const forwardJson = forwardRes.json as {
    spot_usd?: string
    horizons?: GoldHorizon[]
  }
  const horizons = Array.isArray(forwardJson?.horizons)
    ? forwardJson.horizons.filter(h => h.futures?.settle_usd).slice(0, 4)
    : []

  return {
    spot,
    carat,
    bars,
    horizons,
    spot_usd: forwardJson?.spot_usd ?? spot?.price ?? null,
    ok: Boolean(spot?.price),
  }
}
