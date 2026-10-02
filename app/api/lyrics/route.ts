import { NextRequest, NextResponse } from 'next/server'
import { LYRICS_API } from '@/lib/lyrics'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const artist = (request.nextUrl.searchParams.get('artist') ?? '').trim()
  const title = (request.nextUrl.searchParams.get('title') ?? '').trim()

  if (!artist || !title) {
    return NextResponse.json({ error: 'Artist and title are required' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${LYRICS_API}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(9000),
        next: { revalidate: 86400 },
      },
    )

    const json = await res.json().catch(() => null)

    if (res.status === 404 || json?.error) {
      return NextResponse.json({ error: 'No lyrics found for this song' }, { status: 404 })
    }

    if (!res.ok || !json?.lyrics) {
      return NextResponse.json(
        { error: json?.error ?? 'Lyrics request failed' },
        { status: 502 },
      )
    }

    return NextResponse.json({
      artist,
      title,
      lyrics: json.lyrics as string,
    })
  } catch {
    return NextResponse.json({ error: 'Could not reach Lyrics.ovh' }, { status: 502 })
  }
}
