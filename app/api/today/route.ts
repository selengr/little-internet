import { NextRequest, NextResponse } from 'next/server'
import { fetchApod } from '@/lib/apod'
import { pickLocalNumberFact, pickLocalQuote, type DayNumber, type DayQuote } from '@/lib/today-fallbacks'

export const dynamic = 'force-dynamic'

const UA = 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)'

async function fetchQuoteFromPoetryDb(): Promise<DayQuote | null> {
  try {
    const res = await fetch('https://poetrydb.org/random/1/author,title,lines', {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as { author?: string; title?: string; lines?: string[] }[]
    const poem = rows?.[0]
    const line = poem?.lines?.find(l => l.trim().length > 8) ?? poem?.lines?.[0]
    if (!line) return null
    const author = poem?.author ?? 'Unknown'
    const title = poem?.title ? ` · ${poem.title}` : ''
    return { content: line.trim(), author: `${author}${title}` }
  } catch {
    return null
  }
}

type Holiday = { date: string; localName: string; name: string; countryCode: string }

async function fetchNextHolidays(countryCode: string): Promise<Holiday[]> {
  const cc = (countryCode || 'US').toUpperCase().slice(0, 2)
  try {
    const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${encodeURIComponent(cc)}`, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return []
    const rows = (await res.json()) as Holiday[]
    return rows.slice(0, 3)
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  const countryCode = request.nextUrl.searchParams.get('country')?.trim() || 'US'
  const seed = Date.now()

  const [apod, quoteFromDb, holidays] = await Promise.all([
    fetchApod(),
    fetchQuoteFromPoetryDb(),
    fetchNextHolidays(countryCode),
  ])

  const quote: DayQuote = quoteFromDb ?? pickLocalQuote(seed)
  const number: DayNumber = pickLocalNumberFact(seed)

  return NextResponse.json(
    {
      date: new Date().toISOString(),
      countryCode: countryCode.toUpperCase().slice(0, 2),
      apod,
      quote,
      number,
      holidays,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } },
  )
}
