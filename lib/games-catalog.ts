import { ChessKnight, Gamepad2, Grid3x3, Orbit, Swords, TrendingUpDown, Zap, type LucideIcon } from 'lucide-react'
import { SITE_URL } from '@/lib/site'

export type GameId = 'portal' | 'trivia' | 'pokemon' | 'rps' | 'chess' | 'sudoku' | 'higherlower'

export type GameMood = 'quick' | 'think' | 'guess'

export interface GameEntry {
  id: GameId
  /** Short, friendly name — shown big on the card and the play screen. */
  name: string
  /** A few words, not a sentence — what you do. */
  tag: string
  /** Rough how long one sitting usually runs — shown on picker cards. */
  duration: string
  /** Picker chip — how the round feels, not difficulty. */
  mood: GameMood
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
    mood: 'guess',
    icon: Orbit,
    from: '#bef264',
    to: '#65a30d',
  },
  {
    id: 'trivia',
    name: 'Trivia',
    tag: 'Answer and score',
    duration: '~2 min',
    mood: 'think',
    icon: Gamepad2,
    from: '#818cf8',
    to: '#a78bfa',
  },
  {
    id: 'pokemon',
    name: "Who's That Pokémon",
    tag: 'Guess the shape',
    duration: '~1 min',
    mood: 'guess',
    icon: Zap,
    from: '#fbbf24',
    to: '#fb923c',
  },
  {
    id: 'chess',
    name: 'Chess Puzzle',
    tag: 'Find the move',
    duration: '~2 min',
    mood: 'think',
    icon: ChessKnight,
    from: '#60a5fa',
    to: '#4f46e5',
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    tag: 'Fill the grid',
    duration: '~3 min',
    mood: 'think',
    icon: Grid3x3,
    from: '#38bdf8',
    to: '#2563eb',
  },
  {
    id: 'higherlower',
    name: 'Higher or Lower',
    tag: 'Pick the winner',
    duration: '~2 min',
    mood: 'quick',
    icon: TrendingUpDown,
    from: '#fb7185',
    to: '#e11d48',
  },
  {
    id: 'rps',
    name: 'Rock Paper Scissors',
    tag: 'Beat the computer',
    duration: '~2 min',
    mood: 'quick',
    icon: Swords,
    from: '#34d399',
    to: '#059669',
  },
]

export const GAME_COUNT = GAMES.length

export const GAME_IDS = GAMES.map(g => g.id)

export const GAME_MOOD_LABEL: Record<GameMood, string> = {
  quick: 'Quick',
  think: 'Think',
  guess: 'Guess',
}

export function isGameId(value: string | null): value is GameId {
  return !!value && (GAME_IDS as string[]).includes(value)
}

/** Canonical share URL for deep-linking into one table (?mode=). */
export function gameShareUrl(id: GameId) {
  const origin = SITE_URL.replace(/\/$/, '')
  return `${origin}/games?mode=${id}`
}

/** Open the cheatsheet from a marketing or docs link (`?help=1`). */
export function gamesArcadeHelpUrl() {
  const origin = SITE_URL.replace(/\/$/, '')
  return `${origin}/games?help=1`
}
