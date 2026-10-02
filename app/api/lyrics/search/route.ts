import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type DeezerTrack = {
  id: number
  title?: string
  duration?: number
  artist?: { name?: string }
  album?: { cover_medium?: string; cover_big?: string }
}

// Not what someone looking for a song's lyrics means.
const SKIP = /karaoke|instrumental|tribute|8[- ]?bit|lullaby|piano version|made famous|in the style of|originally performed/i
const LIVE = /[(\[-]\s*(live|acoustic|remix|demo|radio edit)|\blive\b/i

/** "Yellow (Live in Sydney)" and "Yellow - Remastered 2011" both mean "Yellow". */
function cleanTitle(title: string) {
  return title
    .replace(/\s*[(\[][^)\]]*[)\]]/g, '')
    .replace(/\s+-\s+.*$/, '')
    .trim()
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ hits: [] })

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=25`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return NextResponse.json({ hits: [] })
    const json = (await res.json()) as { data?: DeezerTrack[] }

    const seen = new Set<string>()
    const hits = (json.data ?? [])
      .filter(t => t.title && t.artist?.name && !SKIP.test(t.title))
      // Studio versions first; live and remix versions only if nothing else fills the list.
      .sort((a, b) => Number(LIVE.test(a.title ?? '')) - Number(LIVE.test(b.title ?? '')))
      .flatMap(t => {
        const title = cleanTitle(t.title as string)
        const artist = (t.artist?.name as string).trim()
        const key = `${title.toLowerCase()}|${artist.toLowerCase()}`
        if (!title || seen.has(key)) return []
        seen.add(key)
        return [
          {
            id: t.id,
            title,
            artist,
            cover: t.album?.cover_medium ?? '',
            coverBig: t.album?.cover_big ?? t.album?.cover_medium ?? '',
            duration: t.duration ?? 0,
          },
        ]
      })
      .slice(0, 6)

    return NextResponse.json(
      { hits },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch {
    return NextResponse.json({ hits: [] })
  }
}
