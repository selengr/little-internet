import { NextRequest, NextResponse } from 'next/server'
import { goldFetch } from '@/lib/goldprice'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action =
    searchParams.get('action') || searchParams.get('endpoint') || 'snapshot'

  try {
    if (action === 'snapshot') {
      const currency = (searchParams.get('currency') || 'USD').toUpperCase()
      const [pricesRes, caratRes, forwardRes] = await Promise.all([
        goldFetch('/prices?symbol=XAU-USD-SPOT&include=karat,stats'),
        goldFetch(`/carat?currency=${encodeURIComponent(currency)}`),
        goldFetch('/forward-view/XAU'),
      ])

      const pricesJson = pricesRes.ok ? await pricesRes.json() : null
      const caratJson = caratRes.ok ? await caratRes.json() : null
      const forwardJson = forwardRes.ok ? await forwardRes.json() : null

      // Silver is nice-to-have; ignore plan gates
      let silver: unknown = null
      try {
        const silRes = await goldFetch('/prices?symbol=XAG-USD-SPOT')
        if (silRes.ok) {
          const j = await silRes.json()
          silver = Array.isArray(j?.symbols) ? j.symbols[0] : j
        }
      } catch {
        /* ignore */
      }

      const gold = Array.isArray(pricesJson?.symbols) ? pricesJson.symbols[0] : null

      return NextResponse.json({
        gold,
        silver,
        carat: caratJson,
        forward: forwardJson,
        fetchedAt: new Date().toISOString(),
      })
    }

    if (action === 'bars') {
      const to = new Date()
      const from = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      const res = await goldFetch(
        `/bars?symbol=XAU-USD-SPOT&interval=1d&from=${ymd(from)}&to=${ymd(to)}&limit=32`,
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return NextResponse.json(
          { error: json?.error || json?.message || 'Bars unavailable' },
          { status: res.status === 403 ? 403 : 502 },
        )
      }
      return NextResponse.json(json)
    }

    if (action === 'convert') {
      const amount = searchParams.get('amount') || '1'
      const unit = searchParams.get('unit') || 'oz'
      const to = (searchParams.get('to') || 'USD').toUpperCase()
      const res = await goldFetch(
        `/convert?from=XAU&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}&unit=${encodeURIComponent(unit)}`,
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        return NextResponse.json(
          { error: json?.error || 'Convert failed' },
          { status: 502 },
        )
      }
      return NextResponse.json(json)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[gold]', err)
    return NextResponse.json({ error: 'Gold API failed' }, { status: 502 })
  }
}
