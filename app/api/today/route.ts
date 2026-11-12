import { NextRequest, NextResponse } from 'next/server'
import { fetchApod } from '@/lib/apod'

export const dynamic = 'force-dynamic'

const UA = 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)'

type Quote = { content: string; author: string }
type NumberFact = { number: number; text: string }

async function fetchQuote(): Promise<Quote | null> {
  try {
    const res = await fetch('https://api.quotable.io/random', {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    const j = (await res.json()) as { content?: string; author?: string }
    if (!j.content) return null
    return { content: j.content, author: j.author ?? 'Unknown' }
  } catch {
    return null
  }
}

async function fetchNumberFact(): Promise<NumberFact | null> {
  try {
    const res = await fetch('https://numbersapi.com/random/trivia?json', {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    const j = (await res.json()) as { number?: number; text?: string }
    if (!j.text) return null
    return { number: j.number ?? 0, text: j.text }
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

  const [apod, quote, number, holidays] = await Promise.all([
    fetchApod(),
    fetchQuote(),
    fetchNumberFact(),
    fetchNextHolidays(countryCode),
  ])

  const fallbackQuote: Quote = {
    content: 'The sky is the daily bread of the eyes.',
    author: 'Ralph Waldo Emerson',
  }

  const fallbackNumber: NumberFact = {
    number: new Date().getDate(),
    text: `Day ${new Date().getDate()} of the month — still counting.`,
  }

  return NextResponse.json(
    {
      date: new Date().toISOString(),
      countryCode: countryCode.toUpperCase().slice(0, 2),
      apod,
      quote: quote ?? fallbackQuote,
      number: number ?? fallbackNumber,
      holidays,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900' } },
  )
}
