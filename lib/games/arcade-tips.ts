import type { GameId } from '@/lib/games-catalog'

export type ArcadeTip = {
  id: string
  text: string
  gameId?: GameId
}

/** Bite-sized hints for the arcade help sheet — one tip per git commit in the expansion batch. */
export const ARCADE_TIPS: ArcadeTip[] = []

export function pickArcadeTip(seed?: number): ArcadeTip | null {
  if (!ARCADE_TIPS.length) return null
  const i = seed !== undefined ? Math.abs(seed) % ARCADE_TIPS.length : Math.floor(Math.random() * ARCADE_TIPS.length)
  return ARCADE_TIPS[i] ?? null
}
