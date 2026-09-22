import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GOLD = 'https://api.goldprice.dev/v1'
const DINO_TAPE = 'https://dino.markets/api/tape'

function authHeaders(): HeadersInit {
  const key = process.env.GOLDPRICE_API_KEY?.trim()
  const headers: HeadersInit = { Accept: 'application/json' }
  if (key) headers.Authorization = `Bearer ${key}`
  return headers
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function goldGet(path: string) {
  const res = await fetch(`${GOLD}${path}`, {
    headers: authHeaders(),
    cache: 'no-store',
  })
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, json }
}

export async function GET(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get('endpoint') ?? 'snapshot'

  try {
    if (endpoint === 'tape') {
      const res = await fetch(DINO_TAPE, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Dino morning tape unavailable' },
          { status: res.status === 404 ? 404 : 502 },
        )
      }
      return NextResponse.json(json)
    }

    if (endpoint === 'forward') {
      const { ok, status, json } = await goldGet('/forward-view/XAU')
      if (!ok) {
        return NextResponse.json(
          { error: (json as { message?: string })?.message ?? 'Forward view failed' },
          { status: status >= 400 ? status : 502 },
        )
      }
      return NextResponse.json(json)
    }

    // Full page snapshot: spot + karat + recent bars
    const to = new Date()
    const from = new Date()
    from.setUTCDate(from.getUTCDate() - 28)

    const [spotRes, caratRes, barsRes] = await Promise.all([
      goldGet('/prices?symbol=XAU-USD-SPOT&include=karat,sources'),
      goldGet('/carat?currency=USD'),
      goldGet(
        `/bars?symbol=XAU-USD-SPOT&interval=1d&from=${isoDate(from)}&to=${isoDate(to)}&limit=40`,
      ),
    ])

    if (!spotRes.ok) {
      return NextResponse.json(
        { error: 'Gold spot unavailable' },
        { status: spotRes.status >= 400 ? spotRes.status : 502 },
      )
    }

    const spotPayload = spotRes.json as {
      symbols?: Array<Record<string, unknown>>
    }
    const spot = Array.isArray(spotPayload.symbols) ? spotPayload.symbols[0] ?? null : null

    return NextResponse.json({
      spot,
      carat: caratRes.ok ? caratRes.json : null,
      bars: barsRes.ok ? barsRes.json : null,
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[gold]', err)
    return NextResponse.json({ error: 'Gold API failed' }, { status: 502 })
  }
}
