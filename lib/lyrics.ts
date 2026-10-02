import type { LyricsResult, LyricsSearch } from '@/types/lyrics'

export const LYRICS_API = 'https://api.lyrics.ovh/v1'

export const FEATURED_LYRICS: LyricsSearch[] = [
  { artist: 'Coldplay', title: 'Yellow' },
  { artist: 'Adele', title: 'Hello' },
  { artist: 'Ed Sheeran', title: 'Perfect' },
  { artist: 'Taylor Swift', title: 'Love Story' },
  { artist: 'The Beatles', title: 'Yesterday' },
  { artist: 'Billie Eilish', title: 'Ocean Eyes' },
]

export const RECENT_KEY = 'lyrics-finder-recent'

export function parseLyrics(artist: string, title: string, raw: string): LyricsResult {
  // Lyrics.ovh sometimes starts with a "Paroles de la chanson … par …" line that is not part of the song.
  const body = raw.replace(/^Paroles de la chanson[^\n]*\n+/i, '')
  const lines = body
    .replace(/\r/g, '')
    .split('\n')
    .map(l => l.trimEnd())
    .filter((l, i, arr) => l.length > 0 || (i > 0 && arr[i - 1].length > 0))

  return { artist, title, lyrics: body.trim(), lines }
}

export function loadRecent(): LyricsSearch[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveRecent(entry: LyricsSearch) {
  const key = `${entry.artist}::${entry.title}`
  const prev = loadRecent().filter(
    r => `${r.artist}::${r.title}` !== key,
  )
  const next = [entry, ...prev].slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

export function shareText(result: LyricsResult): string {
  return `${result.title} — ${result.artist}\n\n${result.lyrics.slice(0, 500)}${result.lyrics.length > 500 ? '…' : ''}`
}

/** Groups lines into stanzas (blank lines separate them). */
export function toStanzas(lines: string[]): string[][] {
  const out: string[][] = []
  let cur: string[] = []
  for (const l of lines) {
    if (l.trim() === '') {
      if (cur.length) out.push(cur)
      cur = []
    } else cur.push(l)
  }
  if (cur.length) out.push(cur)
  return out
}

export function formatDuration(sec: number) {
  if (!sec) return ''
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}
