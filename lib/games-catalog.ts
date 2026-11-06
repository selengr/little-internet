import { ChessKnight, Gamepad2, Grid3x3, Orbit, Swords, TrendingUpDown, Zap, type LucideIcon } from 'lucide-react'
import { SITE_URL } from '@/lib/site'

export type GameId = 'portal' | 'trivia' | 'pokemon' | 'rps' | 'chess' | 'sudoku' | 'higherlower'

export interface GameEntry {
  id: GameId
  /** Short, friendly name — shown big on the card and the play screen. */
  name: string
  /** A few words, not a sentence — what you do. */
  tag: string
  /** Rough how long one sitting usually runs — shown on picker cards. */
  duration: string
  icon: LucideIcon
  /** Card background gradient. */
  from: string
  to: string
}

export const GAMES: GameEntry[] = [
  {
    id: 'portal',
    name: 'Portal Faces',
    tag: 'Name the silhouette',
    duration: '~1 min',
    icon: Orbit,
    from: '#bef264',
    to: '#65a30d',
  },
  {
    id: 'trivia',
    name: 'Trivia',
    tag: 'Answer and score',
    duration: '~2 min',
    icon: Gamepad2,
    from: '#818cf8',
    to: '#a78bfa',
  },
  {
    id: 'pokemon',
    name: "Who's That Pokémon",
    tag: 'Guess the shape',
    duration: '~1 min',
    icon: Zap,
    from: '#fbbf24',
    to: '#fb923c',
  },
  {
    id: 'chess',
    name: 'Chess Puzzle',
    tag: 'Find the move',
    duration: '~2 min',
    icon: ChessKnight,
    from: '#60a5fa',
    to: '#4f46e5',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    tag: 'Fill the grid',
    duration: '~3 min',
    icon: Grid3x3,
    from: '#38bdf8',
    to: '#2563eb',
  },
  {
    id: 'higherlower',
    name: 'Higher or Lower',
    tag: 'Pick the winner',
    duration: '~2 min',
    icon: TrendingUpDown,
    from: '#fb7185',
    to: '#e11d48',
  },
  {
    id: 'rps',
    name: 'Rock Paper Scissors',
    tag: 'Beat the computer',
    duration: '~2 min',
    icon: Swords,
    from: '#34d399',
    to: '#059669',
  },
]

export const GAME_IDS = GAMES.map(g => g.id)

export function isGameId(value: string | null): value is GameId {
  return !!value && (GAME_IDS as string[]).includes(value)
}

/** Canonical share URL for deep-linking into one table (?mode=). */
export function gameShareUrl(id: GameId) {
  const origin = SITE_URL.replace(/\/$/, '')
  return `${origin}/games?mode=${id}`
}
