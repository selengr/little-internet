/** Iran free-market FX via TGJU (bazaar rates — not ECB/official). */

export const TGJU_AJAX = 'https://call1.tgju.org/ajax.json'
export const TGJU_HISTORY =
  'https://api.tgju.org/v1/market/indicator/summary-table-data'

/** TGJU instrument key → ISO currency quoted as IRR per 1 unit (JPY is per 100). */
export const TGJU_IRR_INSTRUMENTS: Record<string, { key: string; units?: number }> = {
  USD: { key: 'price_dollar_rl' },
  EUR: { key: 'price_eur' },
  GBP: { key: 'price_gbp' },
  AED: { key: 'price_aed' },
  TRY: { key: 'price_try' },
  CNY: { key: 'price_cny' },
  CAD: { key: 'price_cad' },
  AUD: { key: 'price_aud' },
  CHF: { key: 'price_chf' },
  SAR: { key: 'price_sar' },
  // TGJU quotes yen in batches of 100
  JPY: { key: 'price_jpy', units: 100 },
}

export type TgjuQuote = {
  rate: number
  date: string
  high?: number
  low?: number
  changePct?: number
  source: 'tgju-free-market'
}

function parseTgjuNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return null
  const cleaned = raw.replace(/,/g, '').replace(/[^\d.-]/g, '').trim()
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function tsToDate(ts?: string): string {
  if (!ts) return new Date().toISOString().slice(0, 10)
  // "2026-09-20 19:59:59" or ISO
  return ts.slice(0, 10)
}

type TgjuCurrent = Record<
  string,
  { p?: string; h?: string; l?: string; dp?: number; ts?: string }
>

let cache: { at: number; current: TgjuCurrent } | null = null
const CACHE_MS = 60_000

export async function fetchTgjuCurrent(): Promise<TgjuCurrent> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.current

  const res = await fetch(TGJU_AJAX, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'fun-apis/1.0 (forex-irr)',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`TGJU request failed (${res.status})`)
  const json = await res.json()
  const current = (json?.current ?? {}) as TgjuCurrent
  cache = { at: Date.now(), current }
  return current
}

/** IRR per 1 unit of `code` on the free market. */
export async function getIrrPerUnit(code: string): Promise<TgjuQuote | null> {
  const iso = code.toUpperCase()
  const instrument = TGJU_IRR_INSTRUMENTS[iso]
  if (!instrument) return null

  const current = await fetchTgjuCurrent()
  const row = current[instrument.key]
  if (!row) return null

  const raw = parseTgjuNumber(row.p)
  if (raw == null || raw <= 0) return null

  const units = instrument.units ?? 1
  const rate = raw / units

  return {
    rate,
    date: tsToDate(row.ts),
    high: parseTgjuNumber(row.h) ?? undefined,
    low: parseTgjuNumber(row.l) ?? undefined,
    changePct: typeof row.dp === 'number' ? row.dp : undefined,
    source: 'tgju-free-market',
  }
}

/** Daily close series for a TGJU instrument (IRR per instrument unit). */
export async function fetchTgjuHistory(
  instrumentKey: string,
  days: number,
): Promise<{ date: string; rate: number }[]> {
  const res = await fetch(`${TGJU_HISTORY}/${instrumentKey}?length=${Math.max(days + 5, 14)}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'fun-apis/1.0 (forex-irr)',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`TGJU history failed (${res.status})`)
  const json = await res.json()
  const rows: unknown[] = Array.isArray(json?.data) ? json.data : []

  const points: { date: string; rate: number }[] = []
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 7) continue
    // [open, low, high, close, changeHtml, pctHtml, gregorian, jalali]
    const close = parseTgjuNumber(row[3])
    const dateRaw = String(row[6] ?? '').replace(/\//g, '-')
    if (close == null || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) continue
    points.push({ date: dateRaw, rate: close })
  }

  // API returns newest-first
  return points.sort((a, b) => a.date.localeCompare(b.date)).slice(-days)
}

/**
 * Free-market rate for base→quote when either side is IRR.
 * Returns null if the pair cannot be priced from TGJU.
 */
export async function getFreeMarketRate(
  base: string,
  quote: string,
): Promise<TgjuQuote | null> {
  const b = base.toUpperCase()
  const q = quote.toUpperCase()
  if (b === q) return null
  if (b !== 'IRR' && q !== 'IRR') return null

  if (q === 'IRR') {
    const direct = await getIrrPerUnit(b)
    if (direct) return direct
    return null
  }

  // base === IRR → quote foreign
  const perUnit = await getIrrPerUnit(q)
  if (!perUnit) return null
  return {
    ...perUnit,
    rate: 1 / perUnit.rate,
  }
}
