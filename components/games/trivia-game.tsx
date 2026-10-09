'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, RotateCcw, Sparkles, Trophy, X } from 'lucide-react'
import { GlowButton } from '@/components/glow-button'
import { CopyButton } from '@/components/copy-button'
import { TRIVIA_CATEGORIES, TRIVIA_RESPONSE_CODE_MESSAGE, toTriviaQuestion } from '@/lib/trivia'
import { SITE_URL } from '@/lib/site'
import type { TriviaApiResponse, TriviaDifficulty, TriviaQuestion } from '@/types/trivia'
import { cn } from '@/lib/utils'

type Stage = 'setup' | 'loading' | 'playing' | 'results' | 'error'

const AMOUNTS = [5, 10, 15] as const
const DIFFICULTIES: { id: TriviaDifficulty | 'any'; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
]

async function fetchQuestions(
  amount: number,
  categoryId: number | null,
  difficulty: TriviaDifficulty | 'any',
): Promise<{ questions: TriviaQuestion[] } | { error: string }> {
  const url = new URL('/api/trivia', window.location.origin)
  url.searchParams.set('amount', String(amount))
  if (categoryId) url.searchParams.set('category', String(categoryId))
  if (difficulty !== 'any') url.searchParams.set('difficulty', difficulty)

  try {
    const res = await fetch(url.toString(), { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    const json: TriviaApiResponse = await res.json()
    if (json.response_code !== 0 || !json.results?.length) {
      return { error: TRIVIA_RESPONSE_CODE_MESSAGE[json.response_code] ?? 'Could not load questions.' }
    }
    return { questions: json.results.map(toTriviaQuestion) }
  } catch {
    return { error: 'Could not reach the trivia service. Try again in a moment.' }
  }
}

export function TriviaGame({ shareUrl = `${SITE_URL}/games` }: { shareUrl?: string }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState<TriviaDifficulty | 'any'>('any')
  const [amount, setAmount] = useState<number>(10)
  const [questions, setQuestions] = useState<TriviaQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [bestStreak, setBestStreak] = useState(0)
  const streakRef = useRef(0)
  // Eleven category pills at once is a lot to scan — show the six most
  // popular up front and let a tap reveal the rest.
  const [showAllCategories, setShowAllCategories] = useState(false)
  const visibleCategories = showAllCategories ? TRIVIA_CATEGORIES : TRIVIA_CATEGORIES.slice(0, 6)

  const start = useCallback(async () => {
    setStage('loading')
    setErrorMessage(null)
    const result = await fetchQuestions(amount, categoryId, difficulty)
    if ('error' in result) {
      setErrorMessage(result.error)
      setStage('error')
      return
    }
    setQuestions(result.questions)
    setIndex(0)
    setScore(0)
    setPicked(null)
    streakRef.current = 0
    setBestStreak(0)
    setStage('playing')
  }, [amount, categoryId, difficulty])

  const current = questions[index]

  const choose = (i: number) => {
    if (picked !== null || !current) return
    setPicked(i)
    if (i === current.correctIndex) {
      setScore(s => s + 1)
      streakRef.current += 1
      setBestStreak(b => Math.max(b, streakRef.current))
    } else {
      streakRef.current = 0
    }
  }

  const next = () => {
    if (index + 1 >= questions.length) {
      setStage('results')
      return
    }
    setIndex(i => i + 1)
    setPicked(null)
  }

  // Space / Enter / → advances once an answer is revealed — same shortcut as the Jokes page.
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
    setQuestions([])
    setIndex(0)
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
          <p className="text-[13px] font-semibold text-foreground">Category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                categoryId === null
                  ? 'border-transparent text-white'
                  : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
              )}
              style={categoryId === null ? { backgroundImage: 'linear-gradient(145deg, #6366f1, #a855f7)' } : undefined}
            >
              Any
            </button>
            {visibleCategories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  categoryId === c.id
                    ? 'border-transparent text-white'
                    : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                )}
                style={categoryId === c.id ? { backgroundImage: 'linear-gradient(145deg, #6366f1, #a855f7)' } : undefined}
              >
                {c.label}
              </button>
            ))}
            {!showAllCategories && (
              <button
                type="button"
                onClick={() => setShowAllCategories(true)}
                className="rounded-full border border-dashed border-black/15 px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-white/20 dark:hover:bg-white/[0.06]"
              >
                +{TRIVIA_CATEGORIES.length - visibleCategories.length} more
              </button>
            )}
          </div>

          <p className="mt-6 text-[13px] font-semibold text-foreground">Difficulty</p>
          <div className="mt-3 flex gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  difficulty === d.id
                    ? 'border-transparent text-white'
                    : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                )}
                style={difficulty === d.id ? { backgroundImage: 'linear-gradient(145deg, #6366f1, #a855f7)' } : undefined}
              >
                {d.label}
              </button>
            ))}
          </div>

          <p className="mt-6 text-[13px] font-semibold text-foreground">Questions</p>
          <div className="mt-3 flex gap-2">
            {AMOUNTS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  amount === a
                    ? 'border-transparent text-white'
                    : 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                )}
                style={amount === a ? { backgroundImage: 'linear-gradient(145deg, #6366f1, #a855f7)' } : undefined}
              >
                {a}
              </button>
            ))}
          </div>

          <GlowButton from="#6366f1" to="#a855f7" onClick={start} className="mt-8">
            <Sparkles className="mr-2 size-4" />
            Start quiz
          </GlowButton>
        </div>
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Shuffling questions…</p>
      </div>
    )
  }

  if (stage === 'results') {
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0
    return (
      <div className="mx-auto max-w-md text-center">
        <Trophy className="mx-auto size-10 text-amber-500" />
        <h2 className="mt-4 text-3xl font-light tracking-tight">
          {score} / {questions.length}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pct >= 80
            ? 'Excellent — that was sharp.'
            : pct >= 50
              ? 'Solid run.'
              : 'Everyone misses a few — go again.'}
          {bestStreak >= 3 && ` Best streak: ${bestStreak} in a row.`}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <GlowButton from="#6366f1" to="#a855f7" onClick={start} size="s">
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
            text={`I scored ${score}/${questions.length} on Little Internet's Trivia — try to beat it: ${shareUrl}`}
            label="Copy score"
            lineVar="rgba(99,102,241,.35)"
            className="!h-9 !w-auto px-4 text-[12px]"
          />
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-5 flex items-center justify-between text-[13px] font-medium text-muted-foreground">
        <span>
          {current.category} · {current.difficulty}
        </span>
        <span>
          {index + 1} / {questions.length} · Score {score}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${((index + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="mt-6"
        >
          <h2 className="text-xl font-medium leading-snug">{current.question}</h2>

          <div className="mt-6 grid gap-2.5">
            {current.answers.map((answer, i) => {
              const isCorrect = i === current.correctIndex
              const isPicked = i === picked
              const revealed = picked !== null

              return (
                <button
                  key={answer}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
                    !revealed && 'border-black/10 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]',
                    revealed && isCorrect && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                    revealed && isPicked && !isCorrect && 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
                    revealed && !isCorrect && !isPicked && 'border-black/10 opacity-50 dark:border-white/10',
                  )}
                >
                  <span>{answer}</span>
                  {revealed && isCorrect && <Check className="size-4 shrink-0" />}
                  {revealed && isPicked && !isCorrect && <X className="size-4 shrink-0" />}
                </button>
              )
            })}
          </div>

          {picked !== null && (
            <div className="mt-6 flex justify-end">
              <GlowButton from="#6366f1" to="#a855f7" onClick={next} size="s">
                {index + 1 >= questions.length ? 'See results' : 'Next question'}
              </GlowButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
