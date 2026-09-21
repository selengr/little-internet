import { NextRequest, NextResponse } from 'next/server'
import {
  buildTapeRead,
  computeIndicators,
  type OhlcBar,
} from '@/lib/desk-indicators'
import { fetchOnchainTape } from '@/lib/bitquery'
import { fetchNetworkPulse } from '@/lib/etherscan'
import { fetchDefiDeskSignal } from '@/lib/defillama'

const COINGECKO = 'https://api.coingecko.com/api/v3'
const CACHE_MS = 45_000

export const dynamic = 'force-dynamic'

const ASSETS: Record<string, { id: string; symbol: string; name: string }> = {
  bitcoin: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  solana: { id: 'solana', symbol: 'SOL', name: 'Solana' },
  binancecoin: { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  ripple: { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  cardano: { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  dogecoin: { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  'avalanche-2': { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  polkadot: { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  chainlink: { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  litecoin: { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  'matic-network': { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
}

const WATCHLIST_IDS = Object.keys(ASSETS).join(',')

type CacheEntry = { at: number; payload: unknown }
const memoryCache = new Map<string, CacheEntry>()

function cacheKeyFor(assetId: string, interval: string, days: number) {
  return `desk:v3:${assetId}:${interval}:${days}`
}

function findAnyCachedPayload(assetId: string, preferInterval?: string): unknown | null {
  if (preferInterval) {
    for (const days of [daysForInterval(preferInterval), 90, 14, 1, 180]) {
      const hit = memoryCache.get(cacheKeyFor(assetId, preferInterval, days))
      if (hit?.payload) return hit.payload
    }
  }
  for (const iv of ['1d', '4h', '1h', '1w']) {
    for (const days of [daysForInterval(iv), 90, 14, 1, 180]) {
      const hit = memoryCache.get(cacheKeyFor(assetId, iv, days))
      if (hit?.payload) return hit.payload
    }
  }
  for (const entry of memoryCache.values()) {
    if (entry.payload) return entry.payload
  }
  return null
}

async function fetchBarsForDays(
  assetId: string,
  interval: string,
  days: number,
): Promise<{ bars: OhlcBar[]; prices: [number, number][]; volumes: [number, number][] }> {
  const [ohlcRes, chartRes] = await Promise.all([
    geckoFetch(`${COINGECKO}/coins/${assetId}/ohlc?vs_currency=usd&days=${days}`),
    geckoFetch(`${COINGECKO}/coins/${assetId}/market_chart?vs_currency=usd&days=${days}`),
  ])

  const chartJson = chartRes.ok ? await chartRes.json() : null
  const prices = (Array.isArray(chartJson?.prices) ? chartJson.prices : []) as [number, number][]
  const volumes = (Array.isArray(chartJson?.total_volumes)
    ? chartJson.total_volumes
    : []) as [number, number][]

  let bars: OhlcBar[] = []
  if (ohlcRes.ok) {
    const raw = (await ohlcRes.json()) as number[][]
    bars = (Array.isArray(raw) ? raw : [])
      .filter(row => Array.isArray(row) && row.length >= 5)
      .map(([t, o, h, l, c]) => ({
        t: Number(t),
        o: Number(o),
        h: Number(h),
        l: Number(l),
        c: Number(c),
      }))
      .filter(b => [b.o, b.h, b.l, b.c].every(n => Number.isFinite(n)))
  }

  const bucketMs = bucketMsForInterval(interval)
  const synthetic = synthesizeOhlc(prices, volumes, bucketMs)
  if (synthetic.length > bars.length * 1.3 || bars.length < 40) {
    bars = synthetic.length ? synthetic : bars
  } else {
    bars = attachVolumes(bars, volumes)
  }

  if (!bars.length && prices.length >= 4) {
    const finer = synthesizeOhlc(prices, volumes, Math.max(bucketMs / 4, 15 * 60 * 1000))
    if (finer.length) bars = finer
  }

  return { bars, prices, volumes }
}

function geckoHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' }
  const key = process.env.COINGECKO_API_KEY?.trim()
  if (key) headers['x-cg-demo-api-key'] = key
  return headers
}

async function geckoFetch(url: string): Promise<Response> {
  let last: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    last = await fetch(url, {
      headers: geckoHeaders(),
      next: { revalidate: 45 },
    })
    if (last.ok) return last
    if (last.status !== 429 && last.status < 500) return last
    await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
  }
  return last!
}

function daysForInterval(interval: string): number {
  switch (interval) {
    case '15m':
    case '1h':
      return 1
    case '4h':
      return 14
    case '1w':
      return 180
    case '1d':
    default:
      return 90
  }
}

function bucketMsForInterval(interval: string): number {
  switch (interval) {
    case '1h':
      return 60 * 60 * 1000
    case '4h':
      return 4 * 60 * 60 * 1000
    case '1w':
      return 7 * 24 * 60 * 60 * 1000
    case '1d':
    default:
      return 24 * 60 * 60 * 1000
  }
}

function attachVolumes(bars: OhlcBar[], volumes: [number, number][]): OhlcBar[] {
  if (!volumes.length) return bars
  return bars.map(bar => {
    let best = volumes[0]
    let bestDist = Math.abs(volumes[0][0] - bar.t)
    for (let i = 1; i < volumes.length; i++) {
      const d = Math.abs(volumes[i][0] - bar.t)
      if (d < bestDist) {
        best = volumes[i]
        bestDist = d
      }
    }
    return { ...bar, v: best[1] }
  })
}

/** Build denser OHLC from market_chart price ticks when CoinGecko OHLC is sparse. */
function synthesizeOhlc(
  prices: [number, number][],
  volumes: [number, number][],
  bucketMs: number,
): OhlcBar[] {
  if (prices.length < 4) return []
  const buckets = new Map<
    number,
    { o: number; h: number; l: number; c: number; v: number; t: number }
  >()

  for (const [t, p] of prices) {
    if (!Number.isFinite(t) || !Number.isFinite(p)) continue
    const key = Math.floor(t / bucketMs) * bucketMs
    const cur = buckets.get(key)
    if (!cur) {
      buckets.set(key, { o: p, h: p, l: p, c: p, v: 0, t: key })
    } else {
      cur.h = Math.max(cur.h, p)
      cur.l = Math.min(cur.l, p)
      cur.c = p
    }
  }

  for (const [t, v] of volumes) {
    if (!Number.isFinite(t) || !Number.isFinite(v)) continue
    const key = Math.floor(t / bucketMs) * bucketMs
    const cur = buckets.get(key)
    if (cur) cur.v = v
  }

  return [...buckets.values()]
    .sort((a, b) => a.t - b.t)
    .map(b => ({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v || undefined }))
}

export async function GET(request: NextRequest) {
  const assetKey = (request.nextUrl.searchParams.get('asset') ?? 'bitcoin').toLowerCase()
  const interval = (request.nextUrl.searchParams.get('interval') ?? '1d').toLowerCase()
  const asset = ASSETS[assetKey] ?? ASSETS.bitcoin
  const days = daysForInterval(interval)
  const cacheKey = cacheKeyFor(asset.id, interval, days)

  const hit = memoryCache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json(hit.payload, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=45' },
    })
  }

  try {
    const marketsRes = await geckoFetch(
      `${COINGECKO}/coins/markets?vs_currency=usd&ids=${WATCHLIST_IDS}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`,
    )

    type MarketRow = {
      id: string
      symbol: string
      name: string
      image?: string
      current_price?: number
      high_24h?: number
      low_24h?: number
      total_volume?: number
      market_cap?: number
      price_change_percentage_1h_in_currency?: number
      price_change_percentage_24h?: number
      price_change_percentage_7d_in_currency?: number
      sparkline_in_7d?: { price?: number[] }
    }

    const markets: MarketRow[] = marketsRes.ok
      ? ((await marketsRes.json()) as MarketRow[]).filter(Boolean)
      : []

    const dayCandidates = [...new Set([days, 90, 14, 1, 180])]
    let bars: OhlcBar[] = []
    for (const d of dayCandidates) {
      const fetched = await fetchBarsForDays(asset.id, interval, d)
      if (fetched.bars.length) {
        bars = fetched.bars
        break
      }
    }

    if (!bars.length) {
      const stale =
        hit?.payload ??
        findAnyCachedPayload(asset.id, interval)
      if (stale) {
        return NextResponse.json(stale, { headers: { 'X-Cache': 'STALE' } })
      }
    }

    if (!bars.length) {
      const spot = markets.find(m => m.id === asset.id)?.current_price
      if (spot != null && Number.isFinite(spot) && spot > 0) {
        const t = Date.now()
        bars = [
          { t: t - 86_400_000, o: spot, h: spot, l: spot, c: spot },
          { t, o: spot, h: spot, l: spot, c: spot },
        ]
      } else {
        const anyStale = findAnyCachedPayload(asset.id, interval)
        if (anyStale) {
          return NextResponse.json(anyStale, { headers: { 'X-Cache': 'STALE' } })
        }
        return NextResponse.json({ error: 'No candle data' }, { status: 502 })
      }
    }

    // Keep chart readable — cap very long series
    if (bars.length > 180) bars = bars.slice(-180)

    const indicators = computeIndicators(bars)
    const tape = buildTapeRead(bars, indicators)
    const [onchain, network, defi] = await Promise.all([
      fetchOnchainTape(asset.id),
      fetchNetworkPulse(asset.id),
      fetchDefiDeskSignal(asset.id),
    ])

    const selected = markets.find(m => m.id === asset.id)
    const first = bars[0]
    const lastBar = bars[bars.length - 1]
    const sessionChange =
      first && lastBar && first.c > 0 ? ((lastBar.c - first.c) / first.c) * 100 : null

    const watchlist = markets.map(m => {
      const spark = m.sparkline_in_7d?.price ?? []
      return {
        id: m.id,
        symbol: (m.symbol ?? '').toUpperCase(),
        name: m.name,
        image: m.image ?? null,
        price: m.current_price ?? null,
        change1h: m.price_change_percentage_1h_in_currency ?? null,
        change24h: m.price_change_percentage_24h ?? null,
        change7d: m.price_change_percentage_7d_in_currency ?? null,
        sparkline: spark.length > 24 ? spark.slice(-48) : spark,
      }
    })

    const payload = {
      asset: {
        ...asset,
        image: selected?.image ?? null,
      },
      interval,
      days,
      updatedAt: Date.now(),
      price: selected?.current_price ?? lastBar?.c ?? null,
      change1h: selected?.price_change_percentage_1h_in_currency ?? null,
      change24h: selected?.price_change_percentage_24h ?? null,
      change7d: selected?.price_change_percentage_7d_in_currency ?? null,
      high24h: selected?.high_24h ?? null,
      low24h: selected?.low_24h ?? null,
      volume24h: selected?.total_volume ?? null,
      marketCap: selected?.market_cap ?? null,
      sessionChange,
      sessionHigh: Math.max(...bars.map(b => b.h)),
      sessionLow: Math.min(...bars.map(b => b.l)),
      barCount: bars.length,
      bars,
      watchlist,
      indicators: {
        ema20: indicators.ema20,
        ema50: indicators.ema50,
        rsi: indicators.rsi,
        macd: indicators.macd,
        macdSignal: indicators.macdSignal,
        macdHist: indicators.macdHist,
        atr: indicators.atr,
      },
      tape,
      onchain,
      network,
      defi,
      disclaimer:
        'Desk is an analysis aid for education — not financial advice. Crypto is volatile; never risk money you cannot afford to lose.',
    }

    memoryCache.set(cacheKey, { at: Date.now(), payload })
    return NextResponse.json(payload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    const stale = hit?.payload ?? findAnyCachedPayload(asset.id, interval)
    if (stale) return NextResponse.json(stale, { headers: { 'X-Cache': 'STALE' } })
    console.error('[desk]', error)
    return NextResponse.json({ error: 'Failed to load desk data' }, { status: 502 })
  }
}
