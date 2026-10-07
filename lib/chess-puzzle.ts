import { Chess } from 'chess.js'
import type { ChessPuzzle, MoveOption, PuzzleDifficulty } from '@/types/chess-puzzle'

const PIECE_GLYPHS: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
}

/** 8x8 board, row 0 = rank 8 (top, as White sees it), col 0 = file a. */
export type BoardCell = { glyph: string; isWhite: boolean } | null
export type BoardGrid = BoardCell[][]

/** One glyph set for both colours — colour is applied with CSS (text fill),
 *  which keeps every piece the same size instead of mixing filled and hollow
 *  Unicode chess sets. */
export function glyphFor(type: string): string {
  return PIECE_GLYPHS[type] ?? '?'
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function fetchJson(difficulty: PuzzleDifficulty) {
  const url = new URL('https://lichess.org/api/puzzle/next')
  url.searchParams.set('difficulty', difficulty)
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error('Lichess error')
  return res.json()
}

/**
 * Lichess's puzzle feed gives the source game as PGN plus a ply count, not a
 * ready FEN — the position has to be replayed up to that ply, exactly like
 * their own client does. chess.js (a small, well-established rules engine)
 * handles that replay and, as a bonus, gives us genuinely legal moves to
 * build real multiple-choice decoys from, instead of guessed-at ones.
 */
export async function fetchPuzzle(difficulty: PuzzleDifficulty): Promise<{
  puzzle: ChessPuzzle
  board: BoardGrid
  options: MoveOption[]
}> {
  const json = await fetchJson(difficulty)
  const pgn: string = json?.game?.pgn
  const solution: string[] = json?.puzzle?.solution
  const id: string = json?.puzzle?.id
  const rating: number = json?.puzzle?.rating
  const initialPly: number = json?.puzzle?.initialPly

  if (!pgn || !solution?.length || !id || typeof initialPly !== 'number') {
    throw new Error('Malformed puzzle data')
  }

  const full = new Chess()
  full.loadPgn(pgn)
  const sanMoves = full.history()

  // `initialPly` is 0-indexed to just *before* the move that sets up the
  // puzzle (the one the solver must respond to) — replay one ply further
  // than that count to land on the actual position to solve from.
  const position = new Chess()
  const plyCount = initialPly + 1
  for (let i = 0; i < plyCount && i < sanMoves.length; i++) {
    position.move(sanMoves[i])
  }

  const solutionMove = solution[0]
  const correctFrom = solutionMove.slice(0, 2)
  const correctTo = solutionMove.slice(0, 4).slice(2, 4)

  const legalMoves = position.moves({ verbose: true })
  const decoyPool = shuffle(legalMoves.filter(m => !(m.from === correctFrom && m.to === correctTo)))
  const decoys = decoyPool.slice(0, 3).map(m => ({ uci: `${m.from}${m.to}`, from: m.from, to: m.to }))

  const options = shuffle([
    { uci: `${correctFrom}${correctTo}`, from: correctFrom, to: correctTo },
    ...decoys,
  ])

  const board: BoardGrid = position.board().map(row =>
    row.map(cell => (cell ? { glyph: glyphFor(cell.type), isWhite: cell.color === 'w' } : null)),
  )

  const puzzle: ChessPuzzle = {
    id,
    fen: position.fen(),
    rating,
    solutionMove: `${correctFrom}${correctTo}`,
    sideToMove: position.turn(),
  }

  return { puzzle, board, options }
}
