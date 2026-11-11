import { isGameId, type GameId } from '@/lib/games-catalog'

const KEY = 'li-games-recent'
const MAX = 5

export function getRecentTableIds(): GameId[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is GameId => isGameId(id)).slice(0, MAX)
  } catch {
    return []
  }
}

export function pushRecentTableId(id: GameId): GameId[] {
  const prev = getRecentTableIds().filter(x => x !== id)
  const next = [id, ...prev].slice(0, MAX)
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  return next
}
