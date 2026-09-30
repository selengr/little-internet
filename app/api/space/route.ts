import { NextResponse } from 'next/server'
import { fetchPosition } from '@/lib/space'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// The crew has its own cached endpoint (/api/space/crew), so a slow position source never holds
// up the head-count. The position is shared for a few seconds: the ISS moves ~7.7 km/s, so that is
// invisible on the map, and it keeps every visitor from hitting the upstream API separately.
export async function GET() {
  const position = await fetchPosition()

  if (!position) {
    return NextResponse.json(
      { error: 'upstream unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    { position },
    { headers: { 'Cache-Control': 'public, s-maxage=4, stale-while-revalidate=30' } },
  )
}
