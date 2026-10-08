'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hand, HandFist, RotateCcw, Scissors, Sparkles, Trophy, type LucideIcon } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { RPS_CHOICES, judgeRound, randomChoice, winsNeeded } from '@/lib/rps'
import { SITE_URL } from '@/lib/site'
import type { RpsChoice, RpsRound } from '@/types/rps'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'playing' | 'results'

const BEST_OF_OPTIONS = [3, 5, 7] as const

const CHOICE_META: Record<RpsChoice, { label: string; icon: LucideIcon }> = {
  rock: { label: 'Rock', icon: HandFist },
  paper: { label: 'Paper', icon: Hand },
  scissors: { label: 'Scissors', icon: Scissors },
}

const OUTCOME_COPY: Record<RpsRound['outcome'], string> = {
  win: 'You win this round',
  lose: 'Computer wins this round',
  draw: "It's a draw",
}

const CALLOUT_STEPS = ['Rock…', 'Paper…', 'Scissors…', 'Shoot!']
const CALLOUT_STEP_MS = 320

export function RpsGame({ shareUrl = `${SITE_URL}/games` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [bestOf, setBestOf] = useState<number>(5)
  const [rounds, setRounds] = useState<RpsRound[]>([])
  const [current, setCurrent] = useState<RpsRound | null>(null)
  // Set the moment a throw is picked; cleared once the suspense callout finishes and `current` reveals.
  const [calling, setCalling] = useState(false)
  const [calloutStep, setCalloutStep] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const youWins = rounds.filter(r => r.outcome === 'win').length
  const computerWins = rounds.filter(r => r.outcome === 'lose').length
  const needed = winsNeeded(bestOf)

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  useEffect(() => clearTimers, [])

  const start = () => {
    clearTimers()
    setRounds([])
    setCurrent(null)
    setCalling(false)
    setStage('playing')
  }

  const reset = () => {
    clearTimers()
    setCalling(false)
    setStage('setup')
  }

  const choose = (you: RpsChoice) => {
    if (current || calling) return
    setCalling(true)
    setCalloutStep(0)
    CALLOUT_STEPS.forEach((_, i) => {
      timersRef.current.push(setTimeout(() => setCalloutStep(i), i * CALLOUT_STEP_MS))
    })
    timersRef.current.push(
      setTimeout(
        () => {
          const computer = randomChoice()
          const outcome = judgeRound(you, computer)
          setCurrent({ you, computer, outcome })
          setCalling(false)
        },
        CALLOUT_STEPS.length * CALLOUT_STEP_MS + 200,
      ),
    )
  }

  const next = () => {
    if (!current) return
    const nextRounds = [...rounds, current]
    setRounds(nextRounds)
    setCurrent(null)

    const wins = nextRounds.filter(r => r.outcome === 'win').length
    const losses = nextRounds.filter(r => r.outcome === 'lose').length
    if (wins >= needed || losses >= needed) {
      setStage('results')
    }
  }

  // R / P / S picks a throw; Space / Enter / → advances once the round is revealed.
  useEffect(() => {
    if (stage !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (!current && !calling) {
        const key = e.key.toLowerCase()
        if (key === 'r' || key === 'p' || key === 's') {
          e.preventDefault()
          choose(key === 'r' ? 'rock' : key === 'p' ? 'paper' : 'scissors')
        }
        return
      }

      if (current && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, current, calling])

  if (stage === 'setup') {
    return (
      <div className="mx-auto max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Best of</p>
        <div className="mt-3 flex gap-2">
          {BEST_OF_OPTIONS.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setBestOf(n)}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2 text-[12.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2',
                bestOf === n
                  ? 'border-transparent bg-foreground text-background'
                  : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
              )}
            >
              {n} rounds
            </button>
          ))}
        </div>

        <GlowButton from="#10b981" to="#14b8a6" onClick={start} className="mt-8">
          <Sparkles className="mr-2 size-4" />
          Throw down
        </GlowButton>
      </div>
    )
  }

  if (stage === 'results') {
    const won = youWins > computerWins
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className={cn('mx-auto size-10', won ? 'text-amber-500' : 'text-muted-foreground')} />
        <h2 className="mt-4 text-3xl font-light tracking-tight">
          {youWins} – {computerWins}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {won ? 'You took it.' : 'Computer takes this one — go again.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#10b981" to="#14b8a6" onClick={start} size="s">
            <RotateCcw className="mr-2 size-3.5" />
            Play again
          </GlowButton>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-black/10 px-4 text-[12.5px] text-foreground/70 outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Change settings
          </button>
        </div>
        <div className="mt-4 flex justify-center">
          <CopyButton
            text={`I ${won ? 'won' : 'lost'} ${youWins}-${computerWins} in Little Internet's Rock Paper Scissors — try to beat it: ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(16,185,129,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex flex-col gap-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <span>First to {needed}</span>
        <span>
          You {youWins} – {computerWins} Computer
        </span>
      </div>

      <div className="mb-6 flex justify-center gap-1.5">
        {rounds.map((r, i) => (
          <span
            key={i}
            className={cn(
              'size-2 rounded-full',
              r.outcome === 'win' && 'bg-emerald-500',
              r.outcome === 'lose' && 'bg-rose-500',
              r.outcome === 'draw' && 'bg-black/20 dark:bg-white/20',
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {calling ? (
          <motion.div
            key="calling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[138px] items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.p
                key={calloutStep}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.18 }}
                className="text-3xl font-semibold tracking-tight"
              >
                {CALLOUT_STEPS[calloutStep]}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        ) : !current ? (
          <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-3 gap-3">
              {RPS_CHOICES.map(c => {
                const meta = CHOICE_META[c]
                const Icon = meta.icon
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => choose(c)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-black/10 py-6 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] dark:border-white/15"
                  >
                    <Icon className="size-7" />
                    <span className="text-[12.5px]">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-8">
              {(['you', 'computer'] as const).map(who => {
                const choice = who === 'you' ? current.you : current.computer
                const meta = CHOICE_META[choice]
                const Icon = meta.icon
                const isWinner =
                  (who === 'you' && current.outcome === 'win') ||
                  (who === 'computer' && current.outcome === 'lose')
                return (
                  <div key={who} className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'flex size-20 items-center justify-center rounded-2xl border',
                        isWinner
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                          : 'border-black/10 text-foreground/70 dark:border-white/15',
                      )}
                    >
                      <Icon className="size-8" />
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                      {who === 'you' ? 'You' : 'Computer'}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-5 text-[14px] font-medium">{OUTCOME_COPY[current.outcome]}</p>
            <div className="mt-6 flex justify-center">
              <GlowButton from="#10b981" to="#14b8a6" onClick={next} size="s">
                {(current.outcome === 'win' && youWins + 1 >= needed) ||
                (current.outcome === 'lose' && computerWins + 1 >= needed)
                  ? 'See results'
                  : 'Next round'}
              </GlowButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
