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
  { id: 'tip-0011', text: 'Share Sudoku with ?mode=sudoku in the URL.', gameId: 'sudoku' },
  { id: 'tip-0012', text: 'After Higher or Lower, hit Esc to compare scores on another table.', gameId: 'higherlower' },
  { id: 'tip-0013', text: 'Rock Paper Scissors rounds are tuned for short breaks — no account needed.', gameId: 'rps' },
  { id: 'tip-0014', text: 'Mood filters sync to ?mood= in the address bar.' },
  { id: 'tip-0015', text: 'Trivia: tap a card or press 2 on the picker.', gameId: 'trivia' },
  { id: 'tip-0016', text: 'Share Who\'s That Pokémon with ?mode=pokemon in the URL.', gameId: 'pokemon' },
  { id: 'tip-0017', text: 'After Chess Puzzle, hit Esc to compare scores on another table.', gameId: 'chess' },
  { id: 'tip-0018', text: 'Sudoku rounds are tuned for short breaks — no account needed.', gameId: 'sudoku' },
  { id: 'tip-0019', text: 'R picks a random table when the grid is visible.' },
  { id: 'tip-0020', text: 'Rock Paper Scissors: tap a card or press 7 on the picker.', gameId: 'rps' },
  { id: 'tip-0021', text: 'Share Portal Faces with ?mode=portal in the URL.', gameId: 'portal' },
  { id: 'tip-0022', text: 'After Trivia, hit Esc to compare scores on another table.', gameId: 'trivia' },
]

export function pickArcadeTip(seed?: number): ArcadeTip | null {
  if (!ARCADE_TIPS.length) return null
  const i = seed !== undefined ? Math.abs(seed) % ARCADE_TIPS.length : Math.floor(Math.random() * ARCADE_TIPS.length)
  return ARCADE_TIPS[i] ?? null
}
