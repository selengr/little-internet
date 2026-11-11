import { GAMES, GAME_MOOD_LABEL, type GameEntry, type GameId, type GameMood } from '@/lib/games-catalog'

export function normalizePickerSearch(raw: string) {
  return raw.trim().toLowerCase()
}

export function isGameMood(value: string | null): value is GameMood {
  return value === 'quick' || value === 'think' || value === 'guess'
}

export function filterPickerGames(opts: {
  mood: GameMood | null
  search: string
  pinnedOnly?: boolean
  pinnedIds?: GameId[]
}): GameEntry[] {
  const q = normalizePickerSearch(opts.search)
  const pinned = opts.pinnedIds ?? []
  return GAMES.filter(entry => {
    if (opts.pinnedOnly && !pinned.includes(entry.id)) return false
    if (opts.mood && entry.mood !== opts.mood) return false
    if (!q) return true
    if (entry.id.includes(q)) return true
    if (/^[1-7]$/.test(q)) {
      const index = GAMES.findIndex(g => g.id === entry.id)
      return index + 1 === Number(q)
    }
    const haystack = `${entry.name} ${entry.tag} ${entry.duration} ${GAME_MOOD_LABEL[entry.mood]}`.toLowerCase()
    return haystack.includes(q)
  })
}
