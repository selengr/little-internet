import { NextRequest, NextResponse } from 'next/server'
import {
  deezerFetch,
  type DzAlbum,
  type DzArtist,
  type DzPlaylist,
  type DzTrack,
} from '@/lib/deezer'
import { itunesArt, itunesFetch, type ItArtist, type ItItem } from '@/lib/itunes'
import type {
  MusicAlbumView,
  MusicArtistView,
  MusicExplorerPayload,
  MusicPlaylistView,
  MusicTrackView,
} from '@/types/spotify'

// The route keeps its old path (/api/spotify) and response shapes so the page did not have to change,
// but the data now comes from Deezer.
export const dynamic = 'force-dynamic'

/** 10M fans is about 100; a few thousand is about 50. */
function fanPopularity(fans: number) {
  return Math.max(0, Math.min(100, Math.round((Math.log10(fans + 1) / 7) * 100)))
}

function mapArtist(a: DzArtist, genres: string[] = []): MusicArtistView {
  const fans = a.nb_fan ?? 0
  return {
    id: String(a.id),
    name: a.name,
    genres,
    popularity: fanPopularity(fans),
    followers: fans,
    image: a.picture_xl ?? a.picture_big ?? a.picture_medium ?? null,
    url: a.link ?? `https://www.deezer.com/artist/${a.id}`,
  }
}

function mapTrack(t: DzTrack): MusicTrackView {
  const names = (t.contributors ?? []).map(c => c.name)
  return {
    id: String(t.id),
    name: t.title_short || t.title,
    durationMs: t.duration * 1000,
    previewUrl: t.preview || null,
    popularity: Math.max(0, Math.min(100, Math.round((t.rank ?? 0) / 10000))),
    albumName: t.album?.title ?? '',
    albumImage: t.album?.cover_big ?? t.album?.cover_medium ?? null,
    artists: names.length ? names.join(', ') : (t.artist?.name ?? ''),
    url: t.link ?? `https://www.deezer.com/track/${t.id}`,
  }
}

function mapAlbum(a: DzAlbum): MusicAlbumView {
  return {
    id: String(a.id),
    name: a.title,
    year: (a.release_date ?? '').slice(0, 4),
    type: a.record_type ?? 'album',
    tracks: a.nb_tracks ?? 0,
    image: a.cover_big ?? a.cover_medium ?? null,
    url: a.link ?? `https://www.deezer.com/album/${a.id}`,
  }
}

function mapPlaylist(p: DzPlaylist): MusicPlaylistView {
  return {
    id: String(p.id),
    name: p.title,
    description: '',
    image: p.picture_big ?? p.picture_medium ?? null,
    owner: p.user?.name ?? 'Deezer',
    tracks: p.nb_tracks ?? 0,
    url: p.link ?? `https://www.deezer.com/playlist/${p.id}`,
  }
}

/** Deezer lists genres on albums, not artists, so borrow them from the artist's latest album. */
async function genresFrom(album?: DzAlbum): Promise<string[]> {
  if (!album) return []
  try {
    const full = await deezerFetch<DzAlbum>(`/album/${album.id}`)
    return (full.genres?.data ?? []).map(g => g.name.toLowerCase()).slice(0, 4)
  } catch {
    return []
  }
}

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]/g, '')
/** Deezer matches with fewer fans than this are treated as a namesake, not the artist people mean. */
const WELL_KNOWN_FANS = 20000

function mapItunesArtist(a: ItArtist, image: string | null = null): MusicArtistView {
  return {
    id: `it:${a.artistId}`,
    name: a.artistName,
    genres: a.primaryGenreName ? [a.primaryGenreName.toLowerCase()] : [],
    popularity: 0,
    followers: 0,
    image,
    url: '',
  }
}

/** The same payload as the Deezer one, built from Apple's catalogue (no photos, fans, playlists or similar artists). */
async function buildItunesPayload(id: string): Promise<MusicExplorerPayload> {
  const [songs, albums] = await Promise.all([
    itunesFetch<{ results: ItItem[] }>(`/lookup?id=${id}&entity=song&limit=40`),
    itunesFetch<{ results: ItItem[] }>(`/lookup?id=${id}&entity=album&limit=40`).catch(() => ({ results: [] as ItItem[] })),
  ])
  const artistRow = songs.results.find(r => r.wrapperType === 'artist')
  if (!artistRow) throw new Error('No artist found')

  const seenTrack = new Set<string>()
  const tracks: MusicTrackView[] = []
  for (const t of songs.results) {
    if (t.wrapperType !== 'track' || !t.trackName || !t.previewUrl) continue
    // Only songs that are really his: skip other people's tracks that merely feature him.
    if (t.artistId && String(t.artistId) !== id) continue
    const key = t.trackName.toLowerCase().replace(/\s*[(\[].*?[)\]]/g, '').trim()
    if (seenTrack.has(key)) continue
    seenTrack.add(key)
    tracks.push({
      id: String(t.trackId),
      name: t.trackName,
      durationMs: t.trackTimeMillis ?? 0,
      previewUrl: t.previewUrl,
      popularity: 0,
      albumName: t.collectionName ?? '',
      albumImage: itunesArt(t.artworkUrl100, 300),
      artists: t.artistName ?? artistRow.artistName ?? '',
      url: '',
    })
    if (tracks.length >= 10) break
  }

  const seenAlbum = new Set<string>()
  const albumViews: MusicAlbumView[] = []
  // Newest first, so the artist photo (taken from the first cover) is a recent release.
  const newestFirst = [...albums.results].sort((x, y) => (y.releaseDate ?? '').localeCompare(x.releaseDate ?? ''))
  for (const a of newestFirst) {
    if (a.wrapperType !== 'collection' || !a.collectionName) continue
    const key = a.collectionName.toLowerCase().replace(/\s*-\s*(single|ep)$/i, '').trim()
    if (seenAlbum.has(key)) continue
    seenAlbum.add(key)
    albumViews.push({
      id: String(a.collectionId),
      name: a.collectionName.replace(/\s*-\s*(single|ep)$/i, ''),
      year: (a.releaseDate ?? '').slice(0, 4),
      type: /single/i.test(a.collectionName) ? 'single' : /\bep\b/i.test(a.collectionName) ? 'ep' : 'album',
      tracks: a.trackCount ?? 0,
      image: itunesArt(a.artworkUrl100, 500),
      url: '',
    })
    if (albumViews.length >= 8) break
  }

  const cover = itunesArt(newestFirst.find(a => a.artworkUrl100)?.artworkUrl100 ?? songs.results.find(t => t.artworkUrl100)?.artworkUrl100, 800)
  return {
    artist: mapItunesArtist(artistRow as ItArtist, cover),
    topTracks: tracks,
    albums: albumViews,
    similar: [],
    playlists: [],
  }
}

/** Which source and id to use for a typed name: Deezer for well-known artists, Apple when Deezer has only a namesake. */
async function pickArtistId(q: string): Promise<string> {
  const [dz, it] = await Promise.all([
    deezerFetch<{ data: DzArtist[] }>(`/search/artist?q=${encodeURIComponent(q)}&limit=3`).catch(() => ({ data: [] as DzArtist[] })),
    itunesFetch<{ results: ItArtist[] }>(`/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=8`).catch(() => ({ results: [] as ItArtist[] })),
  ])
  const d = dz.data?.[0]
  if (d && norm(d.name) === norm(q) && (d.nb_fan ?? 0) >= WELL_KNOWN_FANS) return String(d.id)
  const exact = it.results.find(a => norm(a.artistName) === norm(q))
  if (exact) return `it:${exact.artistId}`
  if (d) return String(d.id)
  return it.results[0] ? `it:${it.results[0].artistId}` : ''
}

async function buildArtistPayload(artistId: string): Promise<MusicExplorerPayload> {
  const [artist, top, albums, related] = await Promise.all([
    deezerFetch<DzArtist>(`/artist/${artistId}`),
    deezerFetch<{ data: DzTrack[] }>(`/artist/${artistId}/top?limit=10`, { fresh: true }),
    deezerFetch<{ data: DzAlbum[] }>(`/artist/${artistId}/albums?limit=60`),
    deezerFetch<{ data: DzArtist[] }>(`/artist/${artistId}/related?limit=8`).catch(() => ({ data: [] as DzArtist[] })),
  ])

  const playlists = await deezerFetch<{ data: DzPlaylist[] }>(
    `/search/playlist?q=${encodeURIComponent(artist.name)}&limit=8`,
  ).catch(() => ({ data: [] as DzPlaylist[] }))

  // Deezer also lists songs the artist merely appears on. Full albums come first, then EPs and singles,
  // each newest first, and titles that read like guest spots ("ft.", "feat.") are left out.
  const rank = (t?: string) => (t === 'album' ? 0 : t === 'ep' ? 1 : 2)
  const sorted = [...(albums.data ?? [])]
    .filter(a => !/\b(ft\.?|feat\.?|featuring)\b/i.test(a.title))
    .sort((a, b) => rank(a.record_type) - rank(b.record_type) || (b.release_date ?? '').localeCompare(a.release_date ?? ''))
  const seen = new Set<string>()
  const albumViews: MusicAlbumView[] = []
  for (const a of sorted) {
    const key = a.title.toLowerCase().replace(/\s*[(\[].*?[)\]]/g, '').trim()
    if (seen.has(key)) continue
    seen.add(key)
    albumViews.push(mapAlbum(a))
    if (albumViews.length >= 8) break
  }

  const genres = await genresFrom(sorted.find(a => a.record_type === 'album') ?? sorted[0])

  return {
    artist: mapArtist(artist, genres),
    topTracks: (top.data ?? []).slice(0, 10).map(mapTrack),
    albums: albumViews,
    similar: (related.data ?? []).slice(0, 8).map(a => mapArtist(a)),
    playlists: (playlists.data ?? []).slice(0, 6).map(mapPlaylist),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action') ?? 'search'

  try {
    if (action === 'suggest') {
      const q = (searchParams.get('q') ?? '').trim()
      if (!q) return NextResponse.json({ artists: [] })
      const [dz, it] = await Promise.all([
        deezerFetch<{ data: DzArtist[] }>(`/search/artist?q=${encodeURIComponent(q)}&limit=6`).catch(() => ({ data: [] as DzArtist[] })),
        itunesFetch<{ results: ItArtist[] }>(`/search?term=${encodeURIComponent(q)}&entity=musicArtist&limit=6`).catch(() => ({ results: [] as ItArtist[] })),
      ])
      // Apple's entry replaces a Deezer namesake with few fans (a different artist with the same name),
      // and adds artists Deezer doesn't have at all.
      const byName = new Map<string, MusicArtistView>()
      for (const a of dz.data ?? []) byName.set(norm(a.name), mapArtist(a))
      for (const a of it.results ?? []) {
        const key = norm(a.artistName)
        const have = byName.get(key)
        if (!have || have.followers < WELL_KNOWN_FANS) {
          if (!byName.has(key) && byName.size >= 8) continue
          byName.set(key, mapItunesArtist(a))
        }
      }
      return NextResponse.json({ artists: [...byName.values()].slice(0, 8) })
    }

    if (action === 'search' || action === 'artist') {
      let artistId = searchParams.get('id') ?? ''

      if (!artistId) {
        const q = (searchParams.get('q') ?? '').trim() || 'Novan'
        artistId = await pickArtistId(q)
        if (!artistId) return NextResponse.json({ error: 'No artist found' }, { status: 404 })
      }

      return NextResponse.json(
        artistId.startsWith('it:') ? await buildItunesPayload(artistId.slice(3)) : await buildArtistPayload(artistId),
      )
    }

    if (action === 'new-releases') {
      const data = await deezerFetch<{ data: DzAlbum[] }>('/chart/0/albums?limit=8')
      return NextResponse.json({ albums: (data.data ?? []).map(mapAlbum) })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Music request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
