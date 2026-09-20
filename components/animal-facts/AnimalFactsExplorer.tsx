'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, RefreshCw } from 'lucide-react'
import type { CatFact, DogFact, Faction } from '@/types/animal-facts'
import { cn } from '@/lib/utils'

const display = { fontFamily: 'var(--font-af-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-af-mono), ui-monospace, monospace' } as const

function FactPanel({
  faction,
  fact,
  loading,
  error,
  onNext,
  hint,
}: {
  faction: Faction
  fact: string
  loading: boolean
  error: boolean
  onNext: () => void
  hint?: string
}) {
  const isCat = faction === 'cat'
  const accent = isCat ? 'var(--af-cat)' : 'var(--af-dog)'
  const soft = isCat ? 'var(--af-cat-soft)' : 'var(--af-dog-soft)'
  const label = isCat ? 'Cat' : 'Dog'
  const errMsg = isCat
    ? 'Could not load a cat fact. Try again.'
    : 'Could not load a dog fact. Try again.'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--af-panel)',
        borderColor: 'var(--af-line)',
        boxShadow: 'var(--af-shadow)',
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-52 w-52 rounded-full blur-3xl"
        style={{ background: soft }}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p
            className="text-[10px] uppercase tracking-[0.24em]"
            style={{ ...mono, color: accent }}
          >
            {label} fact
          </p>
          {isCat ? (
            <Link
              href="/cat"
              className="text-[11px] tracking-wide transition-opacity hover:opacity-80"
              style={{ color: 'var(--af-mute)' }}
            >
              Open cat page →
            </Link>
          ) : null}
        </div>

        <div className="mt-6 flex-1">
          {loading ? (
            <div className="space-y-3 pt-2">
              <div className="h-4 w-full animate-pulse rounded" style={{ background: soft }} />
              <div className="h-4 w-[92%] animate-pulse rounded" style={{ background: soft }} />
              <div className="h-4 w-[70%] animate-pulse rounded" style={{ background: soft }} />
              {hint ? (
                <p
                  className="pt-5 flex items-center gap-2 text-xs"
                  style={{ ...mono, color: 'var(--af-mute)' }}
                >
                  <Loader2 className="size-3.5 animate-spin" />
                  {hint}
                </p>
              ) : null}
            </div>
          ) : error ? (
            <p
              className="text-xl italic leading-relaxed"
              style={{ ...display, color: 'var(--af-mute)' }}
            >
              {errMsg}
            </p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.p
                key={fact}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.28 }}
                className="text-[1.35rem] sm:text-[1.6rem] leading-[1.45] tracking-tight"
                style={display}
              >
                {fact}
              </motion.p>
            </AnimatePresence>
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className={cn(
            'mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm tracking-wide transition-opacity cursor-pointer disabled:opacity-40',
          )}
          style={{
            ...mono,
            background: accent,
            color: 'var(--af-on-fg)',
          }}
        >
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          Another {label.toLowerCase()} fact
        </button>
      </div>
    </motion.article>
  )
}

export function AnimalFactsExplorer() {
  const [catFact, setCatFact] = useState('')
  const [dogFact, setDogFact] = useState('')
  const [catLoading, setCatLoading] = useState(true)
  const [dogLoading, setDogLoading] = useState(true)
  const [catError, setCatError] = useState(false)
  const [dogError, setDogError] = useState(false)
  const [dogFirstLoad, setDogFirstLoad] = useState(true)

  const fetchCatFact = useCallback(async () => {
    setCatLoading(true)
    setCatError(false)
    try {
      const res = await fetch('https://catfact.ninja/fact', { cache: 'no-store' })
      if (!res.ok) throw new Error('cat failed')
      const data = (await res.json()) as CatFact
      setCatFact(data.fact)
    } catch {
      setCatError(true)
      setCatFact('')
    } finally {
      setCatLoading(false)
    }
  }, [])

  const fetchDogFact = useCallback(async () => {
    setDogLoading(true)
    setDogError(false)
    try {
      const res = await fetch('/api/dog-facts', { cache: 'no-store' })
      if (!res.ok) throw new Error('dog failed')
      const data = await res.json()
      if (data?.error) throw new Error(data.error)

      const fact: string = Array.isArray(data)
        ? (data[0] as DogFact)?.fact
        : (data as DogFact)?.fact

      if (!fact) throw new Error('empty dog fact')

      setDogFact(fact)
      setDogFirstLoad(false)
    } catch {
      setDogError(true)
      setDogFact('')
    } finally {
      setDogLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCatFact()
    void fetchDogFact()
  }, [fetchCatFact, fetchDogFact])

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <header className="mb-10 md:mb-14 max-w-2xl">
        <p
          className="text-[10px] uppercase tracking-[0.24em] mb-4"
          style={{ ...mono, color: 'var(--af-mute)' }}
        >
          Animal facts
        </p>
        <h1
          className="text-[clamp(2.6rem,8vw,4.75rem)] font-light leading-[0.95] tracking-tight"
          style={display}
        >
          Curious creatures.
        </h1>
        <p className="mt-5 text-sm leading-relaxed max-w-md" style={{ color: 'var(--af-mute)' }}>
          Fresh cat and dog facts — browse each side on its own. No scores, no battle.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <FactPanel
          faction="cat"
          fact={catFact}
          loading={catLoading}
          error={catError}
          onNext={() => void fetchCatFact()}
        />
        <FactPanel
          faction="dog"
          fact={dogFact}
          loading={dogLoading}
          error={dogError}
          onNext={() => void fetchDogFact()}
          hint={dogFirstLoad ? 'First fetch may take a moment' : undefined}
        />
      </div>
    </div>
  )
}
