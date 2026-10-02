// Apple's public iTunes Search API: no key. It is the second music source (after Deezer) and covers
// artists Deezer lacks, such as many Iranian singers. It has no artist photos or fan counts.
const ITUNES = 'https://itunes.apple.com'

export async function itunesFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${ITUNES}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Apple Music search error ${res.status}`)
  return (await res.json()) as T
}

export type ItArtist = {
  wrapperType?: string
  artistId: number
  artistName: string
  primaryGenreName?: string
}

export type ItItem = {
  wrapperType?: string
  kind?: string
  artistId?: number
  artistName?: string
  trackId?: number
  trackName?: string
  trackTimeMillis?: number
  previewUrl?: string
  collectionId?: number
  collectionName?: string
  collectionType?: string
  trackCount?: number
  releaseDate?: string
  artworkUrl100?: string
  primaryGenreName?: string
}

/** Artwork comes as a 100px thumbnail; the same URL serves larger sizes. */
export function itunesArt(url: string | undefined, size = 600): string | null {
  return url ? url.replace(/\/\d+x\d+bb\./, `/${size}x${size}bb.`) : null
}
