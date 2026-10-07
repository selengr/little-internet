'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eraser, Loader2, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { generateSudoku } from '@/lib/sudoku'
import { SITE_URL } from '@/lib/site'
import type { SudokuDifficulty, SudokuGrid, SudokuPuzzle } from '@/types/sudoku'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results'

const DIFFICULTIES: { id: SudokuDifficulty; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

function cloneGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map(row => [...row])
}

function boxOf(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3)
}

export function SudokuGame({ shareUrl = `${SITE_URL}/games` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy')
  const [puzzle, setPuzzle] = useState<SudokuPuzzle | null>(null)
  const [board, setBoard] = useState<SudokuGrid>([])
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const start = useCallback(() => {
    setStage('loading')
    // Generation is synchronous and fast (a few ms), but a tick of "loading"
    // keeps the UI from feeling like it froze on the (rare) slower draw.
    requestAnimationFrame(() => {
      const next = generateSudoku(difficulty)
      setPuzzle(next)
      setBoard(cloneGrid(next.puzzle))
      setSelected(null)
      setMistakes(0)
      setStartedAt(Date.now())
      setElapsed(0)
      setStage('playing')
    })
  }, [difficulty])

  const reset = () => setStage('setup')

  useEffect(() => {
    if (stage !== 'playing') return
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [stage, startedAt])

  const conflicts = useMemo(() => {
    const bad = new Set<string>()
    if (!board.length) return bad
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = board[r][c]
        if (!v) continue
        for (let c2 = 0; c2 < 9; c2++) {
          if (c2 !== c && board[r][c2] === v) bad.add(`${r}-${c}`)
        }
        for (let r2 = 0; r2 < 9; r2++) {
          if (r2 !== r && board[r2][c] === v) bad.add(`${r}-${c}`)
        }
        for (let r2 = 0; r2 < 9; r2++) {
          for (let c2 = 0; c2 < 9; c2++) {
            if ((r2 !== r || c2 !== c) && boxOf(r2, c2) === boxOf(r, c) && board[r2][c2] === v) {
              bad.add(`${r}-${c}`)
            }
          }
        }
      }
    }
    return bad
  }, [board])

  const isComplete = board.length > 0 && board.every(row => row.every(v => v !== 0)) && conflicts.size === 0

  useEffect(() => {
    if (stage === 'playing' && isComplete) setStage('results')
  }, [stage, isComplete])

  const place = (digit: number) => {
    if (!selected || !puzzle) return
    const { row, col } = selected
    if (puzzle.given[row][col]) return
    setBoard(prev => {
      const next = cloneGrid(prev)
      const wrong = digit !== 0 && puzzle.solution[row][col] !== digit
      if (wrong) setMistakes(m => m + 1)
      next[row][col] = digit
      return next
    })
  }

  if (stage === 'setup') {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Difficulty</p>
        <div className="mt-3 flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2 text-[12.5px] transition-colors',
                difficulty === d.id
                  ? 'border-transparent bg-foreground text-background'
                  : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        <GlowButton from="#3b82f6" to="#6366f1" onClick={start} className="mt-8">
          <Sparkles className="mr-2 size-4" />
          New puzzle
        </GlowButton>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Building a puzzle…</p>
      </div>
    )
  }

  if (stage === 'results') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-4 text-3xl font-light tracking-tight">Solved!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
          {mistakes > 0 && ` · ${mistakes} mistake${mistakes === 1 ? '' : 's'}`}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#3b82f6" to="#6366f1" onClick={start} size="s">
            <RotateCcw className="mr-2 size-3.5" />
            New puzzle
          </GlowButton>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-black/10 px-4 text-[12.5px] text-foreground/70 transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Change difficulty
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <CopyButton
            text={`I solved a ${difficulty} Sudoku in ${elapsed}s on Little Internet — try to beat it: ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(59,130,246,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  if (!puzzle) return null

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>{difficulty}</span>
        <span>
          {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`}
          {mistakes > 0 && ` · ${mistakes} mistake${mistakes === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="grid grid-cols-9 gap-[1px] overflow-hidden rounded-xl border-2 border-foreground/70 bg-foreground/70">
        {board.map((row, r) =>
          row.map((value, c) => {
            const isGiven = puzzle.given[r][c]
            const isSelected = selected?.row === r && selected?.col === c
            const isPeer =
              !!selected && (selected.row === r || selected.col === c || boxOf(selected.row, selected.col) === boxOf(r, c))
            const hasConflict = conflicts.has(`${r}-${c}`)
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSelected({ row: r, col: c })}
                className={cn(
                  'flex aspect-square items-center justify-center bg-background text-[15px] transition-colors sm:text-[17px]',
                  (c % 3 === 2 && c !== 8) && 'border-r-2 border-r-foreground/70',
                  (r % 3 === 2 && r !== 8) && 'border-b-2 border-b-foreground/70',
                  isGiven ? 'font-semibold text-foreground' : 'font-normal text-indigo-600 dark:text-indigo-300',
                  isSelected
                    ? 'bg-indigo-500/20'
                    : isPeer
                      ? 'bg-indigo-500/[0.06]'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
                  hasConflict && 'text-rose-600 dark:text-rose-400',
                )}
              >
                {value !== 0 ? value : ''}
              </button>
            )
          }),
        )}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => place(n)}
            disabled={!selected || (selected ? puzzle.given[selected.row][selected.col] : true)}
            className="flex aspect-square items-center justify-center rounded-lg border border-black/10 text-[14px] font-medium transition-colors hover:bg-black/[0.04] disabled:opacity-30 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => place(0)}
          disabled={!selected || (selected ? puzzle.given[selected.row][selected.col] : true)}
          className="flex aspect-square items-center justify-center rounded-lg border border-black/10 text-foreground/60 transition-colors hover:bg-black/[0.04] disabled:opacity-30 dark:border-white/15 dark:hover:bg-white/[0.06]"
          aria-label="Erase"
        >
          <Eraser className="size-4" />
        </button>
      </div>
    </div>
  )
}
