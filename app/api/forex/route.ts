import { NextRequest, NextResponse } from 'next/server'
import { FRANKFURTER_API, dateRangeForPeriod } from '@/lib/frankfurter'
import {
  TGJU_IRR_INSTRUMENTS,
  fetchTgjuHistory,
  getFreeMarketRate,
  getIrrPerUnit,
} from '@/lib/tgju-irr'
import type { ForexPeriod, FrankfurterCurrency, FrankfurterRate, FrankfurterRatePoint } from '@/types/frankfurter'

export const dynamic = 'force-dynamic'

const UA = 'fun-apis/1.0 (forex; contact: github.com)'

async function frankfurterFetch(path: string) {
  const res = await fetch(`${FRANKFURTER_API}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.message ?? 'Frankfurter request failed')
  }
  return json
}

function involvesIrr(base: string, quote: string) {
  return base === 'IRR' || quote === 'IRR'
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action') ?? 'rate'

  try {
    if (action === 'currencies') {
      const data = await frankfurterFetch('/v2/currencies')
      const currencies: FrankfurterCurrency[] = Array.isArray(data) ? [...data] : []
      if (!currencies.some(c => c.iso_code === 'IRR')) {
        currencies.push({ iso_code: 'IRR', name: 'Iranian Rial (free market)', symbol: '﷼' })
      }
      return NextResponse.json({ currencies })
    }

    const base = (searchParams.get('base') ?? 'USD').toUpperCase()
    const quote = (searchParams.get('quote') ?? 'EUR').toUpperCase()

    if (base === quote) {
      return NextResponse.json({ error: 'Base and quote must differ' }, { status: 400 })
    }

    if (action === 'rate') {
      if (involvesIrr(base, quote)) {
        const market = await getFreeMarketRate(base, quote)
        if (!market) {
          return NextResponse.json(
            { error: `No free-market rate for ${base}/${quote}` },
            { status: 404 },
          )
        }
        const rate: FrankfurterRate = {
          date: market.date,
          base,
          quote,
          rate: market.rate,
        }
        return NextResponse.json(
          {
            rate,
            meta: {
              source: market.source,
              note: 'Iran free-market (bazaar) rate via TGJU — not ECB/official.',
              changePct: market.changePct ?? null,
            },
          },
          { headers: { 'Cache-Control': 'no-store' } },
        )
      }

      const data: FrankfurterRate = await frankfurterFetch(`/v2/rate/${base}/${quote}`)
      return NextResponse.json({ rate: data, meta: { source: 'frankfurter' } })
    }

    if (action === 'latest') {
      const quotes = searchParams.get('quotes') ?? 'EUR,GBP,JPY,CHF,CAD,AUD'
      const params = new URLSearchParams({ base, quotes })

      const from = new Date()
      from.setDate(from.getDate() - 2)
      params.set('from', from.toISOString().slice(0, 10))

      const data: FrankfurterRatePoint[] = await frankfurterFetch(`/v2/rates?${params}`)
      const rows = Array.isArray(data) ? data : []

      const grouped = new Map<string, FrankfurterRatePoint[]>()
      for (const row of rows) {
        const list = grouped.get(row.quote) ?? []
        list.push(row)
        grouped.set(row.quote, list)
      }

      const rates = [...grouped.entries()].map(([q, points]) => {
        const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
        const first = sorted[0]
        const last = sorted[sorted.length - 1]
        return {
          quote: q,
          rate: last.rate,
          date: last.date,
          change: sorted.length > 1 ? ((last.rate - first.rate) / first.rate) * 100 : 0,
        }
      })

      const latestDate = rates.reduce((max, r) => (r.date > max ? r.date : max), '')

      return NextResponse.json(
        { base, date: latestDate, rates, fetchedAt: new Date().toISOString() },
        { headers: { 'Cache-Control': 'no-store' } },
      )
    }

    if (action === 'series') {
      const days = (searchParams.get('days') ?? 'today') as ForexPeriod
      const { from, to, group } = dateRangeForPeriod(days)

      if (involvesIrr(base, quote)) {
        const foreign = base === 'IRR' ? quote : base
        const instrument = TGJU_IRR_INSTRUMENTS[foreign]
        if (!instrument) {
          return NextResponse.json(
            { error: `No free-market history for ${base}/${quote}` },
            { status: 404 },
          )
        }

        const lookback =
          days === 'today' ? 7 : days === '7' ? 14 : days === '30' ? 45 : days === '90' ? 120 : 400

        const raw = await fetchTgjuHistory(instrument.key, lookback)
        const units = instrument.units ?? 1
        let series = raw.map(p => ({
          date: p.date,
          // History rows are in instrument units; normalize to per-1 currency, then invert if IRR is base
          rate: base === 'IRR' ? units / p.rate : p.rate / units,
        }))

        const latest = await getFreeMarketRate(base, quote)
        if (latest) {
          series = [...series.filter(p => p.date !== latest.date), { date: latest.date, rate: latest.rate }]
            .sort((a, b) => a.date.localeCompare(b.date))
        }

        if (days === 'today' && series.length > 2) {
          series = series.slice(-2)
        } else if (days !== 'today') {
          const keep = Number(days)
          series = series.slice(-keep)
        }

        return NextResponse.json({
          series,
          base,
          quote,
          from,
          to,
          latestDate: latest?.date ?? series[series.length - 1]?.date ?? null,
          period: days,
          meta: {
            source: 'tgju-free-market',
            note: 'Iran free-market (bazaar) history via TGJU.',
          },
        })
      }

      const params = new URLSearchParams({
        base,
        quotes: quote,
        from,
        to,
      })
      if (group) params.set('group', group)

      const [data, latest] = await Promise.all([
        frankfurterFetch(`/v2/rates?${params}`) as Promise<FrankfurterRatePoint[]>,
        frankfurterFetch(`/v2/rate/${base}/${quote}`) as Promise<FrankfurterRate>,
      ])

      const map = new Map<string, number>()
      for (const p of Array.isArray(data) ? data : []) {
        if (p.quote === quote) map.set(p.date, p.rate)
      }
      if (latest?.date && typeof latest.rate === 'number') {
        map.set(latest.date, latest.rate)
      }

      let series = [...map.entries()]
        .map(([date, rate]) => ({ date, rate }))
        .sort((a, b) => a.date.localeCompare(b.date))

      if (days === 'today' && series.length > 2) {
        series = series.slice(-2)
      }

      return NextResponse.json({
        series,
        base,
        quote,
        from,
        to,
        latestDate: latest?.date ?? series[series.length - 1]?.date ?? null,
        period: days,
        meta: { source: 'frankfurter' },
      })
    }

    // Optional debug helper — current USD free-market snapshot
    if (action === 'irr-usd') {
      const usd = await getIrrPerUnit('USD')
      return NextResponse.json({ usd })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Forex fetch failed' },
      { status: 502 },
    )
  }
}
