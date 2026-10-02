export function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

export function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const FEATURED_ARTISTS = [
  'Novan',
  'Hamin',
  'Imagine Dragons',
  'Radiohead',
  'Billie Eilish',
  'The Weeknd',
  'Daft Punk',
  'Arctic Monkeys',
]
