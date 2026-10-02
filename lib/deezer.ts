// Deezer's public API: no key, no account, and it answers from Vercel's servers. It replaced Spotify
// on the music page because Spotify now refuses apps whose owner doesn't have a Premium account.
const DEEZER = 'https://api.deezer.com'

export async function deezerFetch<T>(path: string, opts: { fresh?: boolean } = {}): Promise<T> {
  const res = await fetch(`${DEEZER}${path}`, {
    headers: { Accept: 'application/json', 'Accept-Language': 'en' }, // genre names come back in English
    signal: AbortSignal.timeout(8000),
    // Track previews are signed links that expire within minutes, so those are never cached.
    ...(opts.fresh ? { cache: 'no-store' as const } : { next: { revalidate: 3600 } }),
  })
  if (!res.ok) throw new Error(`Deezer error ${res.status}`)
  const json = (await res.json()) as T & { error?: { message?: string } }
  if (json && typeof json === 'object' && 'error' in json && json.error) {
    throw new Error(json.error.message ?? 'Deezer request failed')
  }
  return json
}

export type DzArtist = {
  id: number
  name: string
  link?: string
  nb_fan?: number
  picture_medium?: string
  picture_big?: string
  picture_xl?: string
}

export type DzAlbum = {
  id: number
  title: string
  link?: string
  cover_medium?: string
  cover_big?: string
  record_type?: string
  release_date?: string
  nb_tracks?: number
  genres?: { data?: { name: string }[] }
}

export type DzTrack = {
  id: number
  title: string
  title_short?: string
  link?: string
  duration: number
  rank?: number
  preview?: string
  artist?: { name: string }
  contributors?: { name: string }[]
  album?: { title?: string; cover_medium?: string; cover_big?: string }
}

export type DzPlaylist = {
  id: number
  title: string
  link?: string
  nb_tracks?: number
  picture_medium?: string
  picture_big?: string
  user?: { name?: string }
}
