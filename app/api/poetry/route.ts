import { NextRequest, NextResponse } from 'next/server'
import {
  FEATURED_POETS,
  MOODS,
  POETRYDB,
  normalizePoem,
  pickDailyIndex,
  pickFallbackPoem,
  pickRandomFallback,
  fallbackByMood,
} from '@/lib/poetry'
import {
  isPoetrySearchQueryValid,
  normalizePoetrySearchQuery,
  poetryDbSearchPath,
  type PoetrySearchField,
} from '@/lib/poetry-search'
import type { PoetryMood, PoetryPoem } from '@/types/poetry'

export const dynamic = 'force-dynamic'

const UA = 'fun-apis/1.0 (Daily Poetry; contact@example.com)'

async function poetryFetch(path: string, attempt = 0): Promise<unknown> {
  const res = await fetch(`${POETRYDB}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => null)

  // Retry once on transient upstream failures
  if ((res.status === 503 || res.status === 502 || res.status === 429) && attempt < 1) {
    await new Promise(r => setTimeout(r, 400))
    return poetryFetch(path, attempt + 1)
  }

  if (!res.ok || (json && typeof json === 'object' && 'status' in json && json.status === 404)) {
    const reason =
      json && typeof json === 'object' && 'reason' in json && typeof json.reason === 'string'
        ? json.reason
        : `PoetryDB error ${res.status}`
    throw new Error(reason)
  }
  return json
}

function asPoems(data: unknown): PoetryPoem[] {
  if (!Array.isArray(data)) return []
  return data
    .filter((p): p is PoetryPoem => p && typeof p === 'object' && 'title' in p)
    .map(normalizePoem)
    .filter(p => p.lines.length > 0 && p.lines.length <= 60)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action') ?? 'today'

  try {
    if (action === 'authors') {
      try {
        const data = (await poetryFetch('/author')) as { authors?: string[] }
        return NextResponse.json({ authors: data.authors ?? FEATURED_POETS })
      } catch {
        return NextResponse.json({ authors: FEATURED_POETS, source: 'fallback' })
      }
    }

    if (action === 'today') {
      const poet = FEATURED_POETS[pickDailyIndex(FEATURED_POETS.length, 'poet')]
      try {
        const pool = asPoems(await poetryFetch(`/author/${encodeURIComponent(poet)}`))
        const poem = pool[pickDailyIndex(pool.length, poet)] ?? pool[0]
        if (!poem) {
          const fallback = asPoems(await poetryFetch('/random/1'))
          return NextResponse.json({
            poem: fallback[0] ?? pickFallbackPoem(null, 'today'),
            poet,
            source: fallback[0] ? 'random' : 'fallback',
          })
        }
        return NextResponse.json({ poem, poet, source: 'daily' })
      } catch {
        return NextResponse.json({
          poem: pickFallbackPoem(null, 'today'),
          poet,
          source: 'fallback',
        })
      }
    }

    if (action === 'random' || action === 'next') {
      const mood = searchParams.get('mood') as PoetryMood | null
      try {
        if (mood) {
          const q = MOODS.find(m => m.id === mood)?.query ?? 'love'
          const data = asPoems(
            await poetryFetch(`/lines,poemcount/${encodeURIComponent(q)};12`),
          )
          if (data.length) {
            const poem = data[Math.floor(Math.random() * data.length)]
            return NextResponse.json({ poem, mood })
          }
        }
        const data = asPoems(await poetryFetch('/random/1'))
        return NextResponse.json({
          poem: data[0] ?? pickRandomFallback(mood),
          mood: mood ?? null,
          source: data[0] ? 'poetrydb' : 'fallback',
        })
      } catch {
        return NextResponse.json({
          poem: pickRandomFallback(mood),
          mood: mood ?? null,
          source: 'fallback',
        })
      }
    }

    if (action === 'mood') {
      const mood = (searchParams.get('mood') ?? 'romantic') as PoetryMood
      try {
        const q = MOODS.find(m => m.id === mood)?.query ?? 'love'
        const data = asPoems(
          await poetryFetch(`/lines,poemcount/${encodeURIComponent(q)};16`),
        )
        const poem = data[Math.floor(Math.random() * Math.max(data.length, 1))] ?? null
        if (poem) {
          return NextResponse.json({ poem, poems: data.slice(0, 8), mood })
        }
        throw new Error('empty')
      } catch {
        const poems = fallbackByMood(mood)
        return NextResponse.json({
          poem: poems[Math.floor(Math.random() * poems.length)] ?? pickRandomFallback(mood),
          poems: poems.slice(0, 8),
          mood,
          source: 'fallback',
        })
      }
    }

    if (action === 'discover') {
      const [love, nature, hope, random] = await Promise.all([
        poetryFetch('/lines,poemcount/love;6').then(asPoems).catch(() => fallbackByMood('romantic').slice(0, 6)),
        poetryFetch('/lines,poemcount/nature;6').then(asPoems).catch(() => fallbackByMood('nature').slice(0, 6)),
        poetryFetch('/lines,poemcount/hope;6').then(asPoems).catch(() => fallbackByMood('inspirational').slice(0, 6)),
        poetryFetch('/random/6').then(asPoems).catch(() => fallbackByMood().slice(0, 6)),
      ])
      return NextResponse.json({
        popular: love.slice(0, 6),
        nature: nature.slice(0, 6),
        hope: hope.slice(0, 6),
        trending: random.slice(0, 6),
        poets: FEATURED_POETS,
      })
    }

    if (action === 'search') {
      const q = normalizePoetrySearchQuery(searchParams.get('q') ?? '')
      const field = (searchParams.get('field') === 'title' ? 'title' : 'author') as PoetrySearchField
      if (!isPoetrySearchQueryValid(q)) {
        return NextResponse.json({ error: 'Query too short' }, { status: 400 })
      }
      try {
        const path = poetryDbSearchPath(field, q)
        const poems = asPoems(await poetryFetch(path))
        return NextResponse.json({
          query: q,
          field,
          poems: poems.slice(0, 12),
          count: poems.length,
          source: 'poetrydb',
        })
      } catch {
        const local = fallbackByMood().filter(p =>
          field === 'author'
            ? p.author.toLowerCase().includes(q.toLowerCase())
            : p.title.toLowerCase().includes(q.toLowerCase()),
        )
        return NextResponse.json({
          query: q,
          field,
          poems: local.slice(0, 8),
          count: local.length,
          source: 'fallback',
        })
      }
    }

    if (action === 'author') {
      const name = searchParams.get('name') ?? 'Emily Dickinson'
      try {
        const poems = asPoems(await poetryFetch(`/author/${encodeURIComponent(name)}`))
        return NextResponse.json({
          author: name,
          poems: poems.slice(0, 8),
          count: poems.length,
        })
      } catch {
        const poems = fallbackByMood().filter(p => p.author === name)
        return NextResponse.json({
          author: name,
          poems: (poems.length ? poems : fallbackByMood()).slice(0, 8),
          count: poems.length,
          source: 'fallback',
        })
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    // Last resort — never leave the page empty if we have local verse
    return NextResponse.json({
      poem: pickFallbackPoem(null, 'error'),
      source: 'fallback',
      warning: err instanceof Error ? err.message : 'Poetry fetch failed',
    })
  }
}
