import { NextRequest, NextResponse } from 'next/server'
import type { CoinMarket, GlobalMarketData } from '@/types/coingecko'

const COINGECKO = 'https://api.coingecko.com/api/v3'
const CACHE_MS = 45_000

export const dynamic = 'force-dynamic'

type CacheEntry = {
  at: number
  payload: { coins: CoinMarket[]; global: GlobalMarketData | null }
}

const memoryCache = new Map<string, CacheEntry>()

function geckoHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
  }
  const key = process.env.COINGECKO_API_KEY?.trim()
  if (key) {
    // Demo / Pro keys both accepted via this header on current CoinGecko API
    headers['x-cg-demo-api-key'] = key
  }
  return headers
}

async function geckoFetch(url: string, revalidate = 45): Promise<Response> {
  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: geckoHeaders(),
    next: { revalidate },
  }

  let last: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    last = await fetch(url, init)
    if (last.ok) return last
    if (last.status !== 429 && last.status < 500) return last
    await new Promise(r => setTimeout(r, 350 * (attempt + 1)))
  }
  return last!
}

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get('page') ?? '1'
  const perPage = request.nextUrl.searchParams.get('per_page') ?? '50'
  const search = request.nextUrl.searchParams.get('search')?.trim()
  const cacheKey = search ? `search:${search.toLowerCase()}` : `markets:${page}:${perPage}`

  const hit = memoryCache.get(cacheKey)
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json(hit.payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=120',
        'X-Cache': 'HIT',
      },
    })
  }

  try {
    if (search) {
      const searchRes = await geckoFetch(
        `${COINGECKO}/search?query=${encodeURIComponent(search)}`,
        60,
      )
      if (!searchRes.ok) throw new Error('Search failed')
      const searchData = await searchRes.json()
      const ids = (searchData.coins ?? [])
        .slice(0, 10)
        .map((c: { id: string }) => c.id)
        .join(',')

      if (!ids) {
        return NextResponse.json({ coins: [], global: null })
      }

      const coinsRes = await geckoFetch(
        `${COINGECKO}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d`,
        45,
      )
      const coinsJson = coinsRes.ok ? await coinsRes.json() : []
      const coins: CoinMarket[] = Array.isArray(coinsJson) ? coinsJson : []
      const payload = { coins, global: null }
      memoryCache.set(cacheKey, { at: Date.now(), payload })
      return NextResponse.json(payload)
    }

    const [coinsRes, globalRes] = await Promise.all([
      geckoFetch(
        `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=1h,24h,7d`,
        45,
      ),
      geckoFetch(`${COINGECKO}/global`, 45),
    ])

    if (!coinsRes.ok) {
      // Serve stale cache on upstream failure when available
      if (hit) {
        return NextResponse.json(hit.payload, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
            'X-Cache': 'STALE',
          },
        })
      }
      throw new Error(`Markets fetch failed (${coinsRes.status})`)
    }

    const coinsJson = await coinsRes.json()
    const coins: CoinMarket[] = Array.isArray(coinsJson) ? coinsJson : []
    const global: GlobalMarketData | null = globalRes.ok ? await globalRes.json() : null

    const payload = { coins, global }
    memoryCache.set(cacheKey, { at: Date.now(), payload })

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    })
  } catch {
    if (hit) {
      return NextResponse.json(hit.payload, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
          'X-Cache': 'STALE',
        },
      })
    }
    return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 502 })
  }
}
