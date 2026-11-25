import type { GameId } from '@/lib/games-catalog'

export type TableShortcut = { gameId: GameId; name: string; keys: string }

/** Shown in the arcade help sheet — one line per table. */
export const PER_TABLE_SHORTCUTS: TableShortcut[] = [
  { gameId: 'portal', name: 'Portal Faces', keys: 'Space / Enter — next silhouette' },
  { gameId: 'trivia', name: 'Trivia', keys: 'Space / Enter — next question' },
  { gameId: 'pokemon', name: "Who's That Pokémon", keys: 'Space / Enter — next round' },
  { gameId: 'chess', name: 'Chess Puzzle', keys: 'Tap the winning move on the board' },
  { gameId: 'sudoku', name: 'Sudoku', keys: 'Digits 1–9 · N new puzzle' },
  { gameId: 'higherlower', name: 'Higher or Lower', keys: 'A higher · L lower' },
  { gameId: 'rps', name: 'Rock Paper Scissors', keys: 'R · P · S · Space to continue' },
]