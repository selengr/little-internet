export interface LyricsResponse {
  lyrics: string
}

export interface LyricsSearch {
  artist: string
  title: string
  /** Album art, when the song came from a search result. */
  cover?: string
  coverBig?: string
  duration?: number
}

export interface SongHit extends LyricsSearch {
  id: number
  cover: string
  coverBig: string
  duration: number
}

export interface LyricsResult {
  artist: string
  title: string
  lyrics: string
  lines: string[]
}
