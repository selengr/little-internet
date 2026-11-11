import { GAMES, type GameMood } from '@/lib/games-catalog'

const MOODS: GameMood[] = ['quick', 'think', 'guess']

export function moodTableCounts(): Record<GameMood, number> {
  const counts: Record<GameMood, number> = { quick: 0, think: 0, guess: 0 }
  for (const game of GAMES) counts[game.mood] += 1
  return counts
}
