import { NextRequest, NextResponse } from 'next/server'
import { fetchUpcomingLaunches } from '@/lib/launches'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const limit = Math.min(
    12,
    Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 6) || 6),
  )
  const launches = await fetchUpcomingLaunches(limit)
  return NextResponse.json(
    { launches },
    { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800' } },
  )
}
