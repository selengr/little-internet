'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, RotateCcw, Sparkles, Trophy, X } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { loadRickPool, pickRound, type RickCharacter } from '@/lib/rick-morty'
import { SITE_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results' | 'error'

const ROUND_COUNTS = [5, 8, 12] as const

type Round = { answer: RickCharacter; options: RickCharacter[] }

export function RickMortyGame({ shareUrl = `${SITE_URL}/games?mode=portal` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [roundCount, setRoundCount] = useState<number>(8)
  const [round, setRound] = useState(0)
  const [current, setCurrent] = useState<Round | null>(null)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pool, setPool] = useState<RickCharacter[]>([])
  const [used] = useState(() => new Set<number>())

  const nextRound = useCallback(
    (source: RickCharacter[]) => {
      const built = pickRound(source, used)
      used.add(built.answer.id)
      setCurrent(built)
      setPicked(null)
      setStage('playing')
    },
    [used],
  )

  const start = useCallback(async () => {
    setStage('loading')
    setErrorMessage(null)
    used.clear()
    setRound(0)
    setScore(0)
    try {
      const loaded = pool.length ? pool : await loadRickPool()
      if (loaded.length < 4) throw new Error('thin pool')
      setPool(loaded)
      nextRound(loaded)
    } catch {
      setErrorMessage('The portal is closed for a moment. Try again.')
      setStage('error')
    }
  }, [nextRound, pool, used])

  const choose = (id: number) => {
    if (picked !== null || !current) return
    setPicked(id)
    if (id === current.answer.id) setScore(s => s + 1)
  }

  const advance = () => {
    if (round + 1 >= roundCount) {
      setStage('results')
      return
    }
    setRound(r => r + 1)
    nextRound(pool)
  }

  useEffect(() => {
    if (stage !== 'playing' || picked === null) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (stage === 'setup' || stage === 'error') {
    return (
      <div className="mx-auto max-w-xl">
        {stage === 'error' && errorMessage && (
          <div className="mb-6 rounded-2xl border border-rose-500/25 bg-rose-500/[0.07] px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
            {errorMessage}
          </div>
        )}
        <p className="text-[13px] font-semibold text-foreground">Rounds</p>
        <div className="mt-3 flex gap-2">
          {ROUND_COUNTS.map(n => (
            <button
              key={n}
              type="button"
              aria-pressed={roundCount === n}
              onClick={() => setRoundCount(n)}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2',
                roundCount === n
                  ? 'border-transparent text-[#12210a]'
                  : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
              )}
              style={roundCount === n ? { backgroundImage: 'linear-gradient(145deg, #bef264, #84cc16)' } : undefined}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          A silhouette drops in. Pick the name before the portal closes.
        </p>
        <GlowButton from="#a3e635" to="#65a30d" onClick={start} className="mt-8 !text-[#12210a]">
          <Sparkles className="mr-2 size-4" />
          Open the portal
        </GlowButton>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-lime-500" />
        <p className="text-sm">Opening a portal…</p>
      </div>
    )
  }

  if (stage === 'results') {
    const pct = roundCount ? Math.round((score / roundCount) * 100) : 0
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-lime-500" />
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-lime-700 dark:text-lime-400">
          {score} / {roundCount}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pct >= 80 ? 'Wubba lubba dub dub.' : pct >= 50 ? 'You get around the multiverse.' : 'Morty would still be lost.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#a3e635" to="#65a30d" onClick={start} size="s" className="!text-[#12210a]">
            <RotateCcw className="mr-2 size-3.5" />
            Play again
          </GlowButton>
        </div>
        <div className="mt-4 flex justify-center">
          <CopyButton
            text={`I scored ${score}/${roundCount} on Portal Faces — ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(132,204,22,.4)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  if (!current) return null
  const revealed = picked !== null

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
        <span>Portal Faces</span>
        <span>
          {round + 1} / {roundCount} · {score}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <motion.div
          className="h-full bg-gradient-to-r from-lime-400 to-emerald-600"
          animate={{ width: `${((round + 1) / roundCount) * 100}%` }}
          transition={{ duration: 0.35 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.answer.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-6"
        >
          <div className="mx-auto size-52 overflow-hidden rounded-[28px] border border-lime-400/30 bg-[#0c1a08] shadow-[0_20px_50px_-24px_rgba(132,204,22,0.8)] sm:size-60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.answer.image}
              alt={revealed ? current.answer.name : 'Mystery character'}
              className={cn(
                'size-full object-cover transition-[filter,transform] duration-500',
                revealed ? 'scale-100 contrast-100' : 'scale-110 contrast-125 brightness-0',
              )}
            />
          </div>
          {revealed && (
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              {current.answer.species} · {current.answer.status} · {current.answer.origin}
            </p>
          )}

          <div className="mt-5 grid gap-2">
            {current.options.map(option => {
              const isAnswer = option.id === current.answer.id
              const isPick = option.id === picked
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={revealed}
                  onClick={() => choose(option.id)}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-[14px] font-medium outline-none transition-colors',
                    !revealed && 'border-black/10 hover:border-lime-500/40 hover:bg-lime-500/[0.06] dark:border-white/12',
                    revealed && isAnswer && 'border-lime-500/50 bg-lime-500/15 text-lime-800 dark:text-lime-200',
                    revealed && isPick && !isAnswer && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-200',
                    revealed && !isAnswer && !isPick && 'border-transparent opacity-45',
                  )}
                >
                  {option.name}
                  {revealed && isAnswer && <Check className="size-4" />}
                  {revealed && isPick && !isAnswer && <X className="size-4" />}
                </button>
              )
            })}
          </div>

          {revealed && (
            <GlowButton from="#a3e635" to="#65a30d" onClick={advance} className="mt-5 !text-[#12210a]">
              {round + 1 >= roundCount ? 'See score' : 'Next portal'}
            </GlowButton>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
