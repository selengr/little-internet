import { NextResponse } from 'next/server'
import { fetchGoldBundle } from '@/lib/goldprice'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await fetchGoldBundle()
    if (!data.ok || !data.spot) {
      return NextResponse.json({ error: 'Gold price unavailable' }, { status: 502 })
    }
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('[gold]', err)
    return NextResponse.json({ error: 'Gold price failed' }, { status: 502 })
  }
}
