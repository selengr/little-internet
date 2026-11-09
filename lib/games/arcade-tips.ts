import type { GameId } from '@/lib/games-catalog'

export type ArcadeTip = {
  id: string
  text: string
  gameId?: GameId
}

/** Bite-sized hints for the arcade help sheet — one tip per git commit in the expansion batch. */
export const ARCADE_TIPS: ArcadeTip[] = [
  { id: 'tip-0001', text: 'Share Trivia with ?mode=trivia in the URL.', gameId: 'trivia' },
  { id: 'tip-0002', text: 'After Who\'s That Pokémon, hit Esc to compare scores on another table.', gameId: 'pokemon' },
  { id: 'tip-0003', text: 'Chess Puzzle rounds are tuned for short breaks — no account needed.', gameId: 'chess' },
  { id: 'tip-0004', text: 'R picks a random table when the grid is visible.' },
  { id: 'tip-0005', text: 'Higher or Lower: tap a card or press 6 on the picker.', gameId: 'higherlower' },
  { id: 'tip-0006', text: 'Share Rock Paper Scissors with ?mode=rps in the URL.', gameId: 'rps' },
  { id: 'tip-0007', text: 'After Portal Faces, hit Esc to compare scores on another table.', gameId: 'portal' },
  { id: 'tip-0008', text: 'Trivia rounds are tuned for short breaks — no account needed.', gameId: 'trivia' },
  { id: 'tip-0009', text: 'Try Pricier duel on /games-v2 for a card-battle table.' },
  { id: 'tip-0010', text: 'Chess Puzzle: tap a card or press 4 on the picker.', gameId: 'chess' },
]

export function pickArcadeTip(seed?: number): ArcadeTip | null {
  if (!ARCADE_TIPS.length) return null
  const i = seed !== undefined ? Math.abs(seed) % ARCADE_TIPS.length : Math.floor(Math.random() * ARCADE_TIPS.length)
  return ARCADE_TIPS[i] ?? null
}
