'use client'

import { useCallback, useState } from 'react'
import { Loader2, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { fetchPuzzle, type BoardGrid } from '@/lib/chess-puzzle'
import { SITE_URL } from '@/lib/site'
import type { ChessPuzzle, MoveOption, PuzzleDifficulty } from '@/types/chess-puzzle'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results' | 'error'

const DIFFICULTIES: { id: PuzzleDifficulty; label: string }[] = [
  { id: 'easiest', label: 'Easy' },
  { id: 'normal', label: 'Normal' },
  { id: 'hardest', label: 'Hard' },
]

const ROUND_COUNT = 5

function squareLabel(uci: string): string {
  return `${uci.slice(0, 2)} → ${uci.slice(2, 4)}`
}

export function ChessPuzzleGame({ shareUrl = `${SITE_URL}/games` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [difficulty, setDifficulty] = useState<PuzzleDifficulty>('easiest')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [puzzle, setPuzzle] = useState<ChessPuzzle | null>(null)
  const [board, setBoard] = useState<BoardGrid>([])
  const [options, setOptions] = useState<MoveOption[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadRound = useCallback(async () => {
    try {
      const data = await fetchPuzzle(difficulty)
      setPuzzle(data.puzzle)
      setBoard(data.board)
      setOptions(data.options)
      setPicked(null)
      setStage('playing')
    } catch {
      setErrorMessage('Could not reach Lichess for a puzzle. Try again in a moment.')
      setStage('error')
    }
  }, [difficulty])

  const start = useCallback(async () => {
    setStage('loading')
    setErrorMessage(null)
    setRound(0)
    setScore(0)
    await loadRound()
  }, [loadRound])

  const reset = () => setStage('setup')

  const choose = (uci: string) => {
    if (picked || !puzzle) return
    setPicked(uci)
    if (uci === puzzle.solutionMove) setScore(s => s + 1)
  }

  const next = async () => {
    if (round + 1 >= ROUND_COUNT) {
      setStage('results')
      return
    }
    setRound(r => r + 1)
    setStage('loading')
    await loadRound()
  }

  if (stage === 'setup' || stage === 'error') {
    return (
      <div className="mx-auto max-w-xl">
        {stage === 'error' && errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
            {errorMessage}
          </div>
        )}
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Difficulty</p>
        <div className="mt-3 flex gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDifficulty(d.id)}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2 text-[12.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2',
                difficulty === d.id
                  ? 'border-transparent bg-foreground text-background'
                  : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <GlowButton from="#1e293b" to="#475569" onClick={start} className="mt-6">
          <Sparkles className="mr-2 size-4" />
          Find the move
        </GlowButton>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Finding a puzzle…</p>
      </div>
    )
  }

  if (stage === 'results') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-4 text-3xl font-light tracking-tight">
          {score} / {ROUND_COUNT}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {score === ROUND_COUNT ? 'A clean sweep.' : score >= ROUND_COUNT / 2 ? 'Solid reading of the board.' : 'Tricky ones — go again.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#1e293b" to="#475569" onClick={start} size="s">
            <RotateCcw className="mr-2 size-3.5" />
            Play again
          </GlowButton>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-black/10 px-4 text-[12.5px] text-foreground/70 outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Change difficulty
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <CopyButton
            text={`I found ${score}/${ROUND_COUNT} winning chess moves on Little Internet — try to beat it: ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(30,41,59,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  if (!puzzle) return null

  const revealed = picked !== null
  const isCorrect = picked === puzzle.solutionMove

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Rating ~{puzzle.rating}</span>
        <span>
          {round + 1} / {ROUND_COUNT} · Score {score}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <div
          className="h-full bg-gradient-to-r from-slate-700 to-slate-500 transition-[width] duration-300"
          style={{ width: `${((round + 1) / ROUND_COUNT) * 100}%` }}
        />
      </div>

      <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
        {puzzle.sideToMove === 'w' ? 'White' : 'Black'} to move — find the winning move.
      </p>

      <div className="mx-auto mt-3 grid aspect-square w-full max-w-[340px] grid-cols-8 overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isLight = (r + c) % 2 === 0
            return (
              <div
                key={`${r}-${c}`}
                className={cn('flex items-center justify-center text-[22px] sm:text-[26px]', isLight ? 'bg-[#eeeed2]' : 'bg-[#769656]')}
              >
                {cell && (
                  <span className={cell.isWhite ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]' : 'text-[#1a1a1a]'}>
                    {cell.glyph}
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {options.map(opt => {
          const isThisCorrect = opt.uci === puzzle.solutionMove
          const isPicked = opt.uci === picked
          return (
            <button
              key={opt.uci}
              type="button"
              onClick={() => choose(opt.uci)}
              disabled={revealed}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-center text-[13.5px] font-medium transition-colors',
                !revealed && 'border-black/10 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                revealed && isThisCorrect && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                revealed && isPicked && !isThisCorrect && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                revealed && !isThisCorrect && !isPicked && 'border-black/10 opacity-50 dark:border-white/10',
              )}
            >
              {squareLabel(opt.uci)}
            </button>
          )
        })}
      </div>

      {revealed && (
        <div className="mt-5 text-center">
          <p className={cn('text-[14px] font-medium', isCorrect ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300')}>
            {isCorrect ? 'Found it!' : `Not quite — it was ${squareLabel(puzzle.solutionMove)}.`}
          </p>
          <div className="mt-4 flex justify-center">
            <GlowButton from="#1e293b" to="#475569" onClick={next} size="s">
              {round + 1 >= ROUND_COUNT ? 'See results' : 'Next puzzle'}
            </GlowButton>
          </div>
        </div>
      )}
    </div>
  )
}
