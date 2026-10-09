'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, RotateCcw, Sparkles, Trophy, X } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { fetchDecoyNames, fetchPokemonRound } from '@/lib/pokemon'
import { SITE_URL } from '@/lib/site'
import type { PokemonGeneration, PokemonRound } from '@/types/pokemon'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results' | 'error'

const ROUND_COUNTS = [5, 10, 15] as const

const GENERATIONS: { id: PokemonGeneration; label: string; hint: string }[] = [
  { id: 'kanto', label: 'Kanto Classics', hint: 'The original 151' },
  { id: 'all', label: 'All Pokémon', hint: 'Every generation' },
]

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

type Round = { pokemon: PokemonRound; options: string[] }

async function buildRound(gen: PokemonGeneration, usedIds: Set<number>): Promise<Round> {
  const pokemon = await fetchPokemonRound(gen, usedIds)
  const decoys = await fetchDecoyNames(gen, new Set(usedIds), 3)
  const options = shuffle([pokemon.name, ...decoys])
  return { pokemon, options }
}

export function PokemonGame({ shareUrl = `${SITE_URL}/games` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [gen, setGen] = useState<PokemonGeneration>('kanto')
  const [roundCount, setRoundCount] = useState<number>(10)
  const [round, setRound] = useState(0)
  const [current, setCurrent] = useState<Round | null>(null)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [usedIds] = useState(() => new Set<number>())
  // The round after the one on screen, fetched in the background while the
  // player is looking at the reveal, so "Next" feels instant like Trivia's.
  const prefetchRef = useRef<Promise<Round | null> | null>(null)

  const prefetchNext = useCallback(() => {
    prefetchRef.current = buildRound(gen, usedIds).catch(() => null)
  }, [gen, usedIds])

  const loadRound = useCallback(async () => {
    try {
      const next = prefetchRef.current ? await prefetchRef.current : await buildRound(gen, usedIds)
      prefetchRef.current = null
      if (!next) throw new Error('no round')
      setCurrent(next)
      setPicked(null)
      setStage('playing')
    } catch {
      setErrorMessage('Could not load a Pokémon. Try again in a moment.')
      setStage('error')
    }
  }, [gen, usedIds])

  const start = useCallback(async () => {
    setStage('loading')
    setErrorMessage(null)
    usedIds.clear()
    prefetchRef.current = null
    setRound(0)
    setScore(0)
    await loadRound()
  }, [loadRound, usedIds])

  const choose = (name: string) => {
    if (picked || !current) return
    setPicked(name)
    if (name === current.pokemon.name) setScore(s => s + 1)
    // Get a head start on the next round while the reveal is on screen.
    if (round + 1 < roundCount) prefetchNext()
  }

  const next = async () => {
    if (round + 1 >= roundCount) {
      setStage('results')
      return
    }
    setRound(r => r + 1)
    if (!prefetchRef.current) setStage('loading')
    await loadRound()
  }

  // Space / Enter / → advances once a guess is revealed — same shortcut as the Jokes page.
  useEffect(() => {
    if (stage !== 'playing' || picked === null) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, picked, next])

  const reset = () => {
    setStage('setup')
    setCurrent(null)
    setRound(0)
    setScore(0)
    setPicked(null)
    setErrorMessage(null)
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
          <p className="text-[13px] font-semibold text-foreground">Generation</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {GENERATIONS.map(g => (
              <button
                key={g.id}
                type="button"
                aria-pressed={gen === g.id}
                onClick={() => setGen(g.id)}
                className={cn(
                  'rounded-2xl border px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                  gen === g.id
                    ? 'border-transparent text-white'
                    : 'border-black/10 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                )}
                style={gen === g.id ? { backgroundImage: 'linear-gradient(145deg, #f59e0b, #ef4444)' } : undefined}
              >
                <div className="text-[13px] font-medium">{g.label}</div>
                <div className={cn('text-[11.5px]', gen === g.id ? 'text-white/80' : 'text-muted-foreground')}>
                  {g.hint}
                </div>
              </button>
            ))}
          </div>

          <p className="mt-6 text-[13px] font-semibold text-foreground">Rounds</p>
          <div className="mt-3 flex gap-2">
            {ROUND_COUNTS.map(n => (
              <button
                key={n}
                type="button"
                aria-pressed={roundCount === n}
                onClick={() => setRoundCount(n)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                  roundCount === n
                    ? 'border-transparent text-white'
                    : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                )}
                style={roundCount === n ? { backgroundImage: 'linear-gradient(145deg, #f59e0b, #ef4444)' } : undefined}
              >
                {n}
              </button>
            ))}
          </div>

          <GlowButton from="#f59e0b" to="#ef4444" onClick={start} className="mt-8">
            <Sparkles className="mr-2 size-4" />
            Who&apos;s that Pokémon?
          </GlowButton>
        </div>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-amber-500" />
        <p className="text-sm">Finding a Pokémon…</p>
      </div>
    )
  }

  if (stage === 'results') {
    const pct = roundCount ? Math.round((score / roundCount) * 100) : 0
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-4 text-3xl font-light tracking-tight">
          {score} / {roundCount}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pct >= 80 ? 'A true Pokémon master.' : pct >= 50 ? 'Solid catch rate.' : 'Back to training — go again.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#f59e0b" to="#ef4444" onClick={start} size="s">
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
            text={`I scored ${score}/${roundCount} on Little Internet's Who's That Pokémon — try to beat it: ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(245,158,11,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  if (!current) return null

  const revealed = picked !== null
  const isCorrect = picked === current.pokemon.name

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
        <span>{GENERATIONS.find(g => g.id === gen)?.label}</span>
        <span>
          {round + 1} / {roundCount} · Score {score}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
          initial={{ width: 0 }}
          animate={{ width: `${((round + 1) / roundCount) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.pokemon.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="mt-6 flex flex-col items-center"
        >
          <div className="flex size-48 items-center justify-center rounded-3xl border border-black/[0.06] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.04]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.pokemon.artwork}
              alt={revealed ? current.pokemon.name : 'Mystery Pokémon'}
              className="size-40 object-contain transition-all duration-300"
              style={revealed ? undefined : { filter: 'brightness(0)', opacity: 0.85 }}
            />
          </div>

          {revealed && (
            <p className="mt-3 text-[13px] text-muted-foreground">
              {isCorrect ? 'It’s ' : 'It was '}
              <span className="font-medium text-foreground">{current.pokemon.name}</span>!
            </p>
          )}

          <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-2">
            {current.options.map(name => {
              const isThisCorrect = name === current.pokemon.name
              const isPicked = name === picked

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => choose(name)}
                  disabled={revealed}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
                    !revealed && 'border-black/10 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                    revealed && isThisCorrect && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                    revealed && isPicked && !isThisCorrect && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    revealed && !isThisCorrect && !isPicked && 'border-black/10 opacity-50 dark:border-white/10',
                  )}
                >
                  <span>{name}</span>
                  {revealed && isThisCorrect && <Check className="size-4 shrink-0" />}
                  {revealed && isPicked && !isThisCorrect && <X className="size-4 shrink-0" />}
                </button>
              )
            })}
          </div>

          {revealed && (
            <div className="mt-6 flex w-full justify-end">
              <GlowButton from="#f59e0b" to="#ef4444" onClick={next} size="s">
                {round + 1 >= roundCount ? 'See results' : 'Next Pokémon'}
              </GlowButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
