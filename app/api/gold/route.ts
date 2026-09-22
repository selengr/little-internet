import { NextResponse } from 'next/server'
import { fetchGoldMarkets } from '@/lib/goldprice'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await fetchGoldMarkets()
    if (!data.gold?.price && !data.silver?.price) {
      return NextResponse.json({ error: 'No metal prices available' }, { status: 502 })
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=40',
      },
    })
  } catch (err) {
    console.error('[gold]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load gold prices' },
      { status: 502 },
    )
  }
}
