import { NextRequest, NextResponse } from 'next/server'
import { fetchOpenMeteo } from '@/lib/weather'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: 'lat and lon are required' },
      { status: 400 },
    )
  }

  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  try {
    const city = searchParams.get('city')?.trim() || undefined
    const country = searchParams.get('country')?.trim() || undefined
    const countryCode = searchParams.get('countryCode')?.trim() || undefined

    const bundle = await fetchOpenMeteo(lat, lon)
    return NextResponse.json({
      ...bundle,
      place: {
        ...bundle.place,
        city,
        country,
        countryCode,
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=240, stale-while-revalidate=600' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Forecast unavailable'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
