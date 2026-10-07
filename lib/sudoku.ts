import type { SudokuDifficulty, SudokuGrid, SudokuPuzzle } from '@/types/sudoku'

// Clues left after digging holes. Fewer clues = harder. Kept conservative on
// the hard end so generation (which must verify a unique solution after
// every removal) stays fast in the browser.
const CLUES_BY_DIFFICULTY: Record<SudokuDifficulty, number> = {
  easy: 38,
  medium: 32,
  hard: 27,
}

function boxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3)
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Fast bitmask-backed solver/generator state. */
class Board {
  grid: number[] = new Array(81).fill(0)
  rows = new Array(9).fill(0)
  cols = new Array(9).fill(0)
  boxes = new Array(9).fill(0)

  canPlace(row: number, col: number, digit: number): boolean {
    const bit = 1 << digit
    const b = boxIndex(row, col)
    return !(this.rows[row] & bit) && !(this.cols[col] & bit) && !(this.boxes[b] & bit)
  }

  place(row: number, col: number, digit: number) {
    const bit = 1 << digit
    this.grid[row * 9 + col] = digit
    this.rows[row] |= bit
    this.cols[col] |= bit
    this.boxes[boxIndex(row, col)] |= bit
  }

  remove(row: number, col: number, digit: number) {
    const bit = 1 << digit
    this.grid[row * 9 + col] = 0
    this.rows[row] &= ~bit
    this.cols[col] &= ~bit
    this.boxes[boxIndex(row, col)] &= ~bit
  }

  to2D(): SudokuGrid {
    const out: SudokuGrid = []
    for (let r = 0; r < 9; r++) out.push(this.grid.slice(r * 9, r * 9 + 9))
    return out
  }
}

/** Fills an empty board into a complete, valid, randomized solution. */
function fillSolved(board: Board): boolean {
  let bestCell: number | null = null
  let bestOptions: number[] = []

  // Pick the empty cell with the fewest legal digits (classic MRV heuristic) —
  // keeps the randomized fill fast and avoids deep dead-end backtracking.
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board.grid[r * 9 + c] !== 0) continue
      const options: number[] = []
      for (let d = 1; d <= 9; d++) if (board.canPlace(r, c, d)) options.push(d)
      if (options.length === 0) return false
      if (bestCell === null || options.length < bestOptions.length) {
        bestCell = r * 9 + c
        bestOptions = options
        if (options.length === 1) break
      }
    }
  }

  if (bestCell === null) return true // no empty cells left — solved

  const row = Math.floor(bestCell / 9)
  const col = bestCell % 9
  for (const digit of shuffled(bestOptions)) {
    board.place(row, col, digit)
    if (fillSolved(board)) return true
    board.remove(row, col, digit)
  }
  return false
}

/** Counts solutions up to `limit`, stopping early — used to verify uniqueness. */
function countSolutions(board: Board, limit: number): number {
  let row = -1
  let col = -1
  for (let i = 0; i < 81 && row === -1; i++) {
    if (board.grid[i] === 0) {
      row = Math.floor(i / 9)
      col = i % 9
    }
  }
  if (row === -1) return 1 // filled — one solution found

  let count = 0
  for (let d = 1; d <= 9; d++) {
    if (!board.canPlace(row, col, d)) continue
    board.place(row, col, d)
    count += countSolutions(board, limit - count)
    board.remove(row, col, d)
    if (count >= limit) return count
  }
  return count
}

export function generateSudoku(difficulty: SudokuDifficulty): SudokuPuzzle {
  const board = new Board()
  fillSolved(board)
  const solution = board.to2D()

  const targetClues = CLUES_BY_DIFFICULTY[difficulty]
  const positions = shuffled(Array.from({ length: 81 }, (_, i) => i))
  let clues = 81

  for (const pos of positions) {
    if (clues <= targetClues) break
    const row = Math.floor(pos / 9)
    const col = pos % 9
    const digit = board.grid[row * 9 + col]
    if (digit === 0) continue

    board.remove(row, col, digit)
    const solutions = countSolutions(board, 2)
    if (solutions !== 1) {
      // Removing this cell makes the puzzle ambiguous — put it back.
      board.place(row, col, digit)
    } else {
      clues--
    }
  }

  const puzzleGrid = board.to2D()
  const given = puzzleGrid.map(row => row.map(v => v !== 0))

  return { puzzle: puzzleGrid, solution, given }
}
