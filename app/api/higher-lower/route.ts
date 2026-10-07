import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

const BASE = 'https://www.cheapshark.com/api/1.0/deals'
// CheapShark rejects requests with no (or a generic) User-Agent — browsers
// won't let client code set that header, so this has to be proxied.
const UA = 'little-internet/1.0 (https://rezakarbakhsh.ir)'

export const dynamic = 'force-dynamic'

interface CheapSharkDeal {
  dealID: string
  title: string
  thumb: string
  steamRatingPercent: string
  steamRatingText: string
}

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, { key: 'higher-lower', limit: 20, windowMs: 60_000 })
  if (limited) return limited

  const url = new URL(BASE)
  url.searchParams.set('pageSize', '60')
  url.searchParams.set('sortBy', 'Recent')
  url.searchParams.set('onSale', '0')

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'CheapShark error' }, { status: 502 })
    }

    const deals: CheapSharkDeal[] = await res.json()

    const cards = deals
      .filter(d => d.steamRatingPercent && Number(d.steamRatingPercent) > 0 && d.thumb)
      .map(d => ({
        id: d.dealID,
        title: d.title,
        thumb: d.thumb,
        ratingPercent: Number(d.steamRatingPercent),
        ratingText: d.steamRatingText || '',
      }))
      // De-dupe by title — the deals list can repeat the same game across stores.
      .filter((card, index, all) => all.findIndex(c => c.title === card.title) === index)

    return NextResponse.json({ cards })
  } catch {
    return NextResponse.json({ error: 'Failed to reach CheapShark' }, { status: 502 })
  }
}
