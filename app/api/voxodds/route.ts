import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VOX = 'https://voxodds.com/api/v1'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action') || 'trending'
  const limit = Math.min(Number(searchParams.get('limit') || 8) || 8, 20)
  const category = searchParams.get('category') || ''
  const q = searchParams.get('q') || ''

  try {
    let url = `${VOX}/trending`
    if (action === 'markets') {
      const params = new URLSearchParams({ limit: String(limit) })
      if (category) params.set('category', category)
      if (q) params.set('q', q)
      url = `${VOX}/markets?${params}`
    } else if (action === 'trending') {
      url = `${VOX}/trending`
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return NextResponse.json(
        { error: 'VoxOdds unavailable', detail: json },
        { status: 502 },
      )
    }
    return NextResponse.json(json)
  } catch (err) {
    console.error('[voxodds]', err)
    return NextResponse.json({ error: 'VoxOdds failed' }, { status: 502 })
  }
}
