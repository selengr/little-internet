'use client'

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Loader2, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { SITE_URL } from '@/lib/site'
import type { GameCard } from '@/types/higher-lower'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results' | 'error'

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function fetchDeck(): Promise<GameCard[]> {
  const res = await fetch('/api/higher-lower', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
  const json = await res.json()
  if (!res.ok || !Array.isArray(json.cards) || json.cards.length < 6) {
    throw new Error('Could not load games to compare.')
  }
  return shuffle(json.cards as GameCard[])
}

export function HigherLowerGame({ shareUrl = `${SITE_URL}/games` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [deck, setDeck] = useState<GameCard[]>([])
  const [index, setIndex] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const bestRef = useRef(0)

  const start = useCallback(async () => {
    setStage('loading')
    setErrorMessage(null)
    try {
      const cards = await fetchDeck()
      setDeck(cards)
      setIndex(0)
      setStreak(0)
      setRevealed(false)
      setCorrect(null)
      bestRef.current = 0
      setBest(0)
      setStage('playing')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
      setStage('error')
    }
  }, [])

  const reset = () => setStage('setup')

  const current = deck[index]
  const next = deck[index + 1]

  const guess = (direction: 'higher' | 'lower') => {
    if (revealed || !current || !next) return
    const isHigher = next.ratingPercent >= current.ratingPercent
    const win = direction === 'higher' ? isHigher : !isHigher
    setRevealed(true)
    setCorrect(win)
    if (win) {
      const newStreak = streak + 1
      setStreak(newStreak)
      bestRef.current = Math.max(bestRef.current, newStreak)
      setBest(bestRef.current)
    }
  }

  const advance = () => {
    if (!revealed) return
    if (correct === false) {
      setStage('results')
      return
    }
    if (index + 2 >= deck.length) {
      // Ran out of deck on a winning streak — reshuffle a fresh one to keep going.
      setDeck(d => shuffle(d))
      setIndex(0)
    } else {
      setIndex(i => i + 1)
    }
    setRevealed(false)
    setCorrect(null)
  }

  if (stage === 'setup' || stage === 'error') {
    return (
      <div className="mx-auto max-w-xl">
        {stage === 'error' && errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
            {errorMessage}
          </div>
        )}
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          Guess if the next game is rated higher or lower. Keep the streak going!
        </p>
        <GlowButton from="#f43f5e" to="#fb923c" onClick={start} className="mt-6">
          <Sparkles className="mr-2 size-4" />
          Start guessing
        </GlowButton>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Pulling games from CheapShark…</p>
      </div>
    )
  }

  if (stage === 'results') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-4 text-3xl font-light tracking-tight">Streak: {best}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {best >= 8 ? "You've got a feel for this." : best >= 4 ? 'Solid run.' : 'Everyone starts somewhere — go again.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#f43f5e" to="#fb923c" onClick={start} size="s">
            <RotateCcw className="mr-2 size-3.5" />
            Play again
          </GlowButton>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-black/10 px-4 text-[12.5px] text-foreground/70 outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Back
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <CopyButton
            text={`I got a streak of ${best} in Little Internet's Higher or Lower — try to beat it: ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(244,63,94,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  if (!current || !next) return null

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <span>Higher or lower?</span>
        <span>
          Streak {streak} · Best {best}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.thumb} alt="" className="h-20 w-full rounded-lg object-cover" />
          <p className="line-clamp-2 min-h-[2.5em] text-center text-[12.5px] font-medium">{current.title}</p>
          <p className="text-2xl font-semibold" style={{ color: '#f43f5e' }}>
            {current.ratingPercent}%
          </p>
          <p className="text-[11px] text-muted-foreground">{current.ratingText}</p>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 p-4 dark:border-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={next.thumb} alt="" className="h-20 w-full rounded-lg object-cover" />
          <p className="line-clamp-2 min-h-[2.5em] text-center text-[12.5px] font-medium">{next.title}</p>
          <AnimatePresence mode="wait">
            {revealed ? (
              <motion.p
                key="revealed"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-semibold"
                style={{ color: '#f43f5e' }}
              >
                {next.ratingPercent}%
              </motion.p>
            ) : (
              <p key="hidden" className="text-2xl font-semibold text-muted-foreground">?</p>
            )}
          </AnimatePresence>
          <p className="text-[11px] text-muted-foreground">{revealed ? next.ratingText : ' '}</p>
        </div>
      </div>

      {!revealed ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => guess('higher')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 py-3.5 text-[13.5px] font-medium outline-none transition-colors hover:border-rose-500/40 hover:bg-rose-500/[0.06] focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-white/15"
          >
            <ArrowUp className="size-4" /> Higher
          </button>
          <button
            type="button"
            onClick={() => guess('lower')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 py-3.5 text-[13.5px] font-medium outline-none transition-colors hover:border-rose-500/40 hover:bg-rose-500/[0.06] focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-white/15"
          >
            <ArrowDown className="size-4" /> Lower
          </button>
        </div>
      ) : (
        <div className="mt-5 text-center">
          <p
            className={cn(
              'text-[14px] font-medium',
              correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300',
            )}
          >
            {correct ? 'Right!' : "That's the streak."}
          </p>
          <div className="mt-4 flex justify-center">
            <GlowButton from="#f43f5e" to="#fb923c" onClick={advance} size="s">
              {correct ? 'Next' : 'See results'}
            </GlowButton>
          </div>
        </div>
      )}
    </div>
  )
}
