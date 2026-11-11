import { GAMES, GAME_MOOD_LABEL, type GameEntry, type GameMood } from '@/lib/games-catalog'

export function normalizePickerSearch(raw: string) {
  return raw.trim().toLowerCase()
}

export function isGameMood(value: string | null): value is GameMood {
  return value === 'quick' || value === 'think' || value === 'guess'
}

export function filterPickerGames(opts: {
  mood: GameMood | null
  search: string
}): GameEntry[] {
  const q = normalizePickerSearch(opts.search)
  return GAMES.filter(entry => {
    if (opts.mood && entry.mood !== opts.mood) return false
    if (!q) return true
    if (entry.id.includes(q)) return true
    const haystack = `${entry.name} ${entry.tag} ${entry.duration} ${GAME_MOOD_LABEL[entry.mood]}`.toLowerCase()
    return haystack.includes(q)
  })
}
