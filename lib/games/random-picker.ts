import type { GameEntry } from '@/lib/games-catalog'

export function pickRandomGame(pool: GameEntry[]): GameEntry | null {
  if (!pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}
