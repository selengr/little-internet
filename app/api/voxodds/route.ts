import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VOX = 'https://voxodds.com/api/v1'

export type VoxMarket = {
  id: string
  question: string
  category: string
  outcomes?: string[]
  prices: number[]
  volume_24h?: number
  voxodds_url?: string
  polymarket_url?: string
}

/** Crypto-leaning prediction markets — calm, relevant to Markets (skips geopolitics). */
export async function GET() {
  try {
    const res = await fetch(`${VOX}/markets?category=Crypto&limit=8`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return NextResponse.json(
        { error: text || 'VoxOdds unavailable' },
        { status: res.status >= 500 ? 502 : res.status },
      )
    }
    const json = (await res.json()) as { markets?: VoxMarket[] }
    const markets = (json.markets ?? [])
      .filter(m => m?.question && Array.isArray(m.prices) && m.prices.length >= 2)
      .slice(0, 6)
      .map(m => ({
        id: m.id,
        question: m.question,
        category: m.category,
        outcomes: m.outcomes ?? ['Yes', 'No'],
        prices: m.prices,
        volume_24h: m.volume_24h ?? 0,
        url: m.voxodds_url || m.polymarket_url || `https://voxodds.com/market/${m.id}`,
      }))

    return NextResponse.json(
      { markets, source: 'voxodds.com' },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
    )
  } catch (err) {
    console.error('[voxodds]', err)
    return NextResponse.json({ error: 'VoxOdds failed' }, { status: 502 })
  }
}
