import { NextRequest, NextResponse } from 'next/server'
import { mapArtwork, MET_API, MET_SEARCH_API, MET_UA } from '@/lib/met'
import type { MetObjectRaw, MetSearchRaw } from '@/types/met'

export const dynamic = 'force-dynamic'

const MAX_RESULTS = 24

async function metFetch(path: string, base: string = MET_API) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MET_UA,
    },
    signal: AbortSignal.timeout(9000),
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text ? 'The Met is not answering right now.' : `Met API error ${res.status}`)
  }
  return res.json()
}

/**
 * Turns object ids into artworks, all requested at once (they used to be fetched in small batches one
 * after another, which made every search slow). A few extra ids are asked for because some objects
 * have no usable image and are skipped; the order of the search results is kept.
 */
const CHUNK = 10

/**
 * Turns object ids into artworks, ten at a time and only until there are enough. The Met's firewall
 * blocks clients that send dozens of requests at once (a blocked server gets a 403 page), and many
 * objects have no public image and are skipped, so this goes through the ids in small steps.
 */
async function hydrateIds(ids: number[], limit: number) {
  const out: NonNullable<ReturnType<typeof mapArtwork>>[] = []
  const pool = ids.slice(0, limit * 3)
  for (let i = 0; i < pool.length && out.length < limit; i += CHUNK) {
    const results = await Promise.all(
      pool.slice(i, i + CHUNK).map(id =>
        metFetch(`/objects/${id}`)
          .then(o => mapArtwork(o as MetObjectRaw))
          .catch(() => null),
      ),
    )
    for (const a of results) if (a && out.length < limit) out.push(a)
  }
  return out
}

async function searchIds(q: string, count: number, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ q, hasImages: 'true', limit: String(count), offset: '0', ...extra })
  const res = (await metFetch(`/search?${params}`, MET_SEARCH_API)) as MetSearchRaw
  return { ids: res.objectIDs ?? [], total: res.total ?? 0 }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action') ?? 'search'

  try {
    if (action === 'object') {
      const id = searchParams.get('id')
      if (!id || !/^\d+$/.test(id)) {
        return NextResponse.json({ error: 'Valid object id required' }, { status: 400 })
      }
      const raw = (await metFetch(`/objects/${id}`)) as MetObjectRaw
      const artwork = mapArtwork(raw)
      if (!artwork) {
        return NextResponse.json({ error: 'No image available for this object' }, { status: 404 })
      }
      return NextResponse.json({ artwork })
    }

    if (action === 'search' || action === 'featured' || action === 'suggest') {
      const q =
        action === 'featured'
          ? (searchParams.get('q') ?? 'van Gogh').trim() || 'van Gogh'
          : (searchParams.get('q') ?? '').trim()

      if (!q) return NextResponse.json({ artworks: [], total: 0, q: '' })

      const defaultLimit = action === 'suggest' ? 6 : MAX_RESULTS
      const limit = Math.min(
        Number(searchParams.get('limit') ?? defaultLimit) || defaultLimit,
        MAX_RESULTS,
      )

      // The museum's highlights first: they are the works people actually mean.
      const hl = await searchIds(q, limit * 2, { isHighlight: 'true' })
      let artworks = await hydrateIds(hl.ids, limit)
      let total = hl.total

      // Not enough highlights with a usable image: add works from the rest of the collection.
      if (artworks.length < Math.min(limit, 8)) {
        const plain = await searchIds(q, limit * 3)
        const seen = new Set(artworks.map(a => a.id))
        const more = (await hydrateIds(plain.ids.filter(id => !hl.ids.includes(id)), limit - artworks.length)).filter(a => !seen.has(a.id))
        artworks = [...artworks, ...more].slice(0, limit)
        total = plain.total
      }

      return NextResponse.json({
        artworks,
        total,
        q,
      })
    }

    if (action === 'departments') {
      const data = await metFetch('/departments')
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Met Museum request failed' },
      { status: 502 },
    )
  }
}
