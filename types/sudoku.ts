export type SudokuDifficulty = 'easy' | 'medium' | 'hard'

/** 9x9 grid, 0 means empty. */
export type SudokuGrid = number[][]

export interface SudokuPuzzle {
  /** The puzzle as given — some cells 0 (empty). */
  puzzle: SudokuGrid
  /** The one true solution. */
  solution: SudokuGrid
  /** Cells that came with the puzzle, so the UI can lock them. */
  given: boolean[][]
}
