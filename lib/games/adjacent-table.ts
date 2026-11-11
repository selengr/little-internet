import { GAMES, type GameId } from '@/lib/games-catalog'

export function adjacentGameId(current: GameId, direction: 'prev' | 'next'): GameId {
  const index = GAMES.findIndex(g => g.id === current)
  if (index < 0) return current
  const delta = direction === 'next' ? 1 : -1
  const next = (index + delta + GAMES.length) % GAMES.length
  return GAMES[next]!.id
}
