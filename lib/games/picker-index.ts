import { GAMES, type GameId } from '@/lib/games-catalog'

/** Keyboard digit 1–7 on the full picker grid (not filtered order). */
export function gamePickerIndex(id: GameId): number {
  const i = GAMES.findIndex(g => g.id === id)
  return i >= 0 ? i + 1 : 0
}
