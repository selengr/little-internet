import { ChessKnight, Gamepad2, Grid3x3, Swords, TrendingUpDown, Zap, type LucideIcon } from 'lucide-react'

export type GameId = 'trivia' | 'pokemon' | 'rps' | 'chess' | 'sudoku' | 'higherlower'

export interface GameEntry {
  id: GameId
  /** Short, friendly name — shown big on the card and the play screen. */
  name: string
  /** A few words, not a sentence — what you do. */
  tag: string
  icon: LucideIcon
  /** Card background gradient. */
  from: string
  to: string
}

export const GAMES: GameEntry[] = [
  {
    id: 'trivia',
    name: 'Trivia',
    tag: 'Answer and score',
    icon: Gamepad2,
    from: '#818cf8',
    to: '#a78bfa',
  },
  {
    id: 'pokemon',
    name: "Who's That Pokémon",
    tag: 'Guess the shape',
    icon: Zap,
    from: '#fbbf24',
    to: '#fb923c',
  },
  {
    id: 'chess',
    name: 'Chess Puzzle',
    tag: 'Find the move',
    icon: ChessKnight,
    from: '#60a5fa',
    to: '#4f46e5',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    tag: 'Fill the grid',
    icon: Grid3x3,
    from: '#38bdf8',
    to: '#2563eb',
  },
  {
    id: 'higherlower',
    name: 'Higher or Lower',
    tag: 'Pick the winner',
    icon: TrendingUpDown,
    from: '#fb7185',
    to: '#e11d48',
  },
  {
    id: 'rps',
    name: 'Rock Paper Scissors',
    tag: 'Beat the computer',
    icon: Swords,
    from: '#34d399',
    to: '#059669',
  },
]

export const GAME_IDS = GAMES.map(g => g.id)

export function isGameId(value: string | null): value is GameId {
  return !!value && (GAME_IDS as string[]).includes(value)
}
