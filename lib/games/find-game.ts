import { GAMES, type GameEntry, type GameId } from '@/lib/games-catalog'

export function findGameById(id: GameId): GameEntry | undefined {
  return GAMES.find(g => g.id === id)
}

export function gameAtPickerIndex(index: number): GameEntry | undefined {
  return GAMES[index]
}
