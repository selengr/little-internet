import { NextRequest, NextResponse } from 'next/server'
import { lookupEntry, normalizeWord, WordNotFoundError } from '@/lib/dictionary-lookup'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const UA = 'LittleInternet/1.0 (https://rezakarbakhsh.ir)'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const endpoint = searchParams.get('endpoint')

  // Autocomplete: a failure here must never show the visitor an error, so it just returns nothing.
  if (endpoint === 'suggest') {
    const q = (searchParams.get('q') ?? '').trim()
    if (q.length < 2) return NextResponse.json({ suggestions: [] })
    try {
      const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(q)}&max=8`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(3500),
        next: { revalidate: 3600 },
      })
      const json = res.ok ? await res.json() : []
      return NextResponse.json({ suggestions: json }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
    } catch {
      return NextResponse.json({ suggestions: [] })
    }
  }

  const word = normalizeWord(searchParams.get('word') ?? '')
  if (!word) return NextResponse.json({ error: 'Type a word to look up.' }, { status: 400 })

  try {
    const entry = await lookupEntry(word)
    // The same array shape the page always received.
    return NextResponse.json([entry], {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
    })
  } catch (err) {
    if (err instanceof WordNotFoundError) {
      return NextResponse.json({ error: err.message, suggestions: err.suggestions }, { status: 404 })
    }
    return NextResponse.json({ error: 'The dictionary is slow right now. Please try again.' }, { status: 502 })
  }
}
