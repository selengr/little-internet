import { NextResponse } from 'next/server'
import { fetchApod } from '@/lib/apod'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
  const apod = await fetchApod()
  return NextResponse.json(
    { apod },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } },
  )
}
