import type { Artwork, MetObjectRaw } from '@/types/met'

export const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1'
// The v1 /search endpoint was retired on 2026-10-01; searching now uses v1.1 (paginated). Objects stay on v1.
export const MET_SEARCH_API = 'https://collectionapi.metmuseum.org/public/collection/v1.1'
export const MET_UA = 'FunApis/1.0 (https://github.com; educational)'

export const FEATURED_SEARCHES = [
  'Vincent van Gogh',
  'Claude Monet',
  'Rembrandt',
  'Egyptian',
  'Japanese prints',
  'Armor',
  'Impressionism',
  'Sculpture',
]

/** Seed when the gallery first opens. */
export const OPENING_QUERY = 'van Gogh'

export const RECENT_KEY = 'met-explorer-recent'

export function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveRecent(q: string) {
  const next = [q, ...loadRecent().filter(x => x !== q)].slice(0, 6)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function mapArtwork(o: MetObjectRaw): Artwork | null {
  const image = o.primaryImageSmall || o.primaryImage
  if (!image) return null

  const country =
    o.country ||
    o.culture ||
    o.region ||
    o.city ||
    o.artistNationality ||
    ''

  const style =
    o.classification ||
    o.period ||
    o.objectName ||
    o.tags?.[0]?.term ||
    ''

  return {
    id: o.objectID,
    title: o.title || 'Untitled',
    artist: o.artistDisplayName || 'Unknown artist',
    artistBio: o.artistDisplayBio || '',
    year: o.objectDate || '',
    museum: o.repository || 'The Metropolitan Museum of Art',
    medium: o.medium || '',
    country,
    style,
    culture: o.culture || '',
    department: o.department || '',
    classification: o.classification || '',
    dimensions: o.dimensions || '',
    creditLine: o.creditLine || '',
    image,
    imageLarge: o.primaryImage || o.primaryImageSmall || '',
    objectURL: o.objectURL || '',
    isPublicDomain: Boolean(o.isPublicDomain),
    isHighlight: Boolean(o.isHighlight),
    tags: (o.tags ?? []).map(t => t.term).filter(Boolean),
  }
}
