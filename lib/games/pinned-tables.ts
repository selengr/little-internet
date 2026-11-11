import { isGameId, type GameId } from '@/lib/games-catalog'

const KEY = 'li-games-pinned'

export function getPinnedTableIds(): GameId[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is GameId => isGameId(id))
  } catch {
    return []
  }
}

export function isPinnedTableId(id: GameId): boolean {
  return getPinnedTableIds().includes(id)
}

export function togglePinnedTableId(id: GameId): GameId[] {
  const set = new Set(getPinnedTableIds())
  if (set.has(id)) set.delete(id)
  else set.add(id)
  const next = [...set]
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* private mode */
  }
  return next
}
