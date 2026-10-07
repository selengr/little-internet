export type PuzzleDifficulty = 'easiest' | 'normal' | 'hardest'

export interface ChessPuzzle {
  id: string
  fen: string
  rating: number
  /** The winning move, in UCI form (e.g. "e5e4"). */
  solutionMove: string
  /** Side to move in the puzzle position. */
  sideToMove: 'w' | 'b'
}

export interface MoveOption {
  uci: string
  from: string
  to: string
}
