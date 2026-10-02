'use client'

import { useCallback, useRef, useState } from 'react'
import { Loader2, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { CARD_BACK, dealMemoryBoard } from '@/lib/memory-cards'
import { SITE_URL } from '@/lib/site'
import type { MemoryTile } from '@/types/memory-cards'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results' | 'error'

const PAIR_COUNTS = [6, 8, 12] as const

const MISMATCH_DELAY_MS = 700

export function MemoryCardsGame() {
  const [stage, setStage] = useState<Stage>('setup')
  const [pairCount, setPairCount] = useState<number>(8)
  const [tiles, setTiles] = useState<MemoryTile[]>([])
  const [flipped, setFlipped] = useState<string[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedCount, setMatchedCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStage('loading')
    setErrorMessage(null)
    try {
      const board = await dealMemoryBoard(pairCount)
      setTiles(board)
      setFlipped([])
      setMoves(0)
      setMatchedCount(0)
      setBusy(false)
      setStage('playing')
    } catch {
      setErrorMessage('Could not deal a deck right now. Try again in a moment.')
      setStage('error')
    }
  }, [pairCount])

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStage('setup')
    setTiles([])
    setFlipped([])
    setMoves(0)
    setMatchedCount(0)
    setBusy(false)
    setErrorMessage(null)
  }

  const flip = (id: string) => {
    if (busy || flipped.includes(id) || flipped.length >= 2) return
    const tile = tiles.find(t => t.id === id)
    if (!tile || tile.matched) return

    const nextFlipped = [...flipped, id]
    setFlipped(nextFlipped)

    if (nextFlipped.length !== 2) return

    setMoves(m => m + 1)
    const [firstId, secondId] = nextFlipped
    const first = tiles.find(t => t.id === firstId)!
    const second = tiles.find(t => t.id === secondId)!

    if (first.card.code === second.card.code) {
      setTiles(prev => prev.map(t => (t.id === firstId || t.id === secondId ? { ...t, matched: true } : t)))
      setFlipped([])
      setMatchedCount(c => {
        const next = c + 1
        if (next === pairCount) setStage('results')
        return next
      })
    } else {
      setBusy(true)
      timerRef.current = setTimeout(() => {
        setFlipped([])
        setBusy(false)
      }, MISMATCH_DELAY_MS)
    }
  }

  if (stage === 'setup' || stage === 'error') {
    return (
      <div className="mx-auto max-w-xl">
        {stage === 'error' && errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Board size</p>
          <div className="mt-3 flex gap-2">
            {PAIR_COUNTS.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setPairCount(n)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2 text-[12.5px] transition-colors',
                  pairCount === n
                    ? 'border-transparent bg-foreground text-background'
                    : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                )}
              >
                {n} pairs
              </button>
            ))}
          </div>

          <GlowButton from="#06b6d4" to="#3b82f6" onClick={start} className="mt-8">
            <Sparkles className="mr-2 size-4" />
            Deal the cards
          </GlowButton>
        </div>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Shuffling a deck…</p>
      </div>
    )
  }

  if (stage === 'results') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-4 text-3xl font-light tracking-tight">{moves} moves</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {moves <= pairCount + 2
            ? 'A near-perfect memory.'
            : moves <= pairCount * 2
              ? 'Solid run.'
              : 'All matched — go again for a better score.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#06b6d4" to="#3b82f6" onClick={start} size="s">
            <RotateCcw className="mr-2 size-3.5" />
            Play again
          </GlowButton>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-black/10 px-4 text-[12.5px] text-foreground/70 transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Change settings
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <CopyButton
            text={`I matched ${pairCount} pairs in ${moves} moves in Little Internet's Memory Cards — try to beat it: ${SITE_URL}/games`}
            label="Copy score"
            lineVar="rgba(6,182,212,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Memory Cards</span>
        <span>
          Matched {matchedCount}/{pairCount} · Moves {moves}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {tiles.map(tile => {
          const isFlipped = flipped.includes(tile.id) || tile.matched
          return (
            <button
              key={tile.id}
              type="button"
              onClick={() => flip(tile.id)}
              disabled={tile.matched || isFlipped}
              aria-label={isFlipped ? `${tile.card.value} of ${tile.card.suit.toLowerCase()}` : 'Face-down card'}
              className="group aspect-[5/7] [perspective:800px]"
            >
              <div
                className="relative size-full rounded-lg transition-transform duration-300 [transform-style:preserve-3d]"
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CARD_BACK}
                  alt=""
                  className={cn(
                    'absolute inset-0 size-full rounded-lg object-cover shadow-sm [backface-visibility:hidden]',
                    !tile.matched && 'transition-transform group-hover:scale-[1.03]',
                  )}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tile.card.image}
                  alt=""
                  className={cn(
                    'absolute inset-0 size-full rounded-lg object-cover shadow-sm [backface-visibility:hidden]',
                    tile.matched && 'opacity-60',
                  )}
                  style={{ transform: 'rotateY(180deg)' }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
