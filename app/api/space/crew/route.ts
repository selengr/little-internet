import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { fetchCrew } from '@/lib/space'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 20

// Launches and landings are days apart, so the roster is cached for 30 minutes across all
// serverless instances. A failed lookup throws and is therefore never cached.
const getCrew = unstable_cache(fetchCrew, ['space-crew-v1'], { revalidate: 1800 })

export async function GET() {
  try {
    const crew = await getCrew()
    return NextResponse.json(
      { crew },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=86400' } },
    )
  } catch (err) {
    console.error('[space] crew unavailable', err)
    return NextResponse.json(
      { error: 'crew unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
