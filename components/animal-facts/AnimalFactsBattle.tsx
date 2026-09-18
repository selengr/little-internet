'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'
import { FactionCard } from '@/components/animal-facts/FactionCard'
import { ScoreBoard } from '@/components/animal-facts/ScoreBoard'
import type { CatFact, DogFact, Faction } from '@/types/animal-facts'
import { cn } from '@/lib/utils'

export function AnimalFactsBattle() {
  const [catFact, setCatFact] = useState('')
  const [dogFact, setDogFact] = useState('')
  const [catLength, setCatLength] = useState(0)
  const [catLoading, setCatLoading] = useState(true)
  const [dogLoading, setDogLoading] = useState(true)
  const [catError, setCatError] = useState(false)
  const [dogError, setDogError] = useState(false)
  const [catWins, setCatWins] = useState(0)
  const [dogWins, setDogWins] = useState(0)
  const [totalFacts, setTotalFacts] = useState(0)
  const [dogFirstLoad, setDogFirstLoad] = useState(true)
  const [battleWinner, setBattleWinner] = useState<Faction | null>(null)

  const fetchCatFact = useCallback(async () => {
    setCatLoading(true)
    setCatError(false)
    try {
      const res = await fetch('https://catfact.ninja/fact', { cache: 'no-store' })
      if (!res.ok) throw new Error('cat failed')
      const data = (await res.json()) as CatFact
      setCatFact(data.fact)
      setCatLength(data.length ?? data.fact.length)
      setTotalFacts(n => n + 1)
    } catch {
      setCatError(true)
      setCatFact('')
      setCatLength(0)
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
      setTotalFacts(n => n + 1)
    } catch {
      setDogError(true)
      setDogFact('')
    } finally {
      setDogLoading(false)
    }
  }, [])

  const fetchBoth = useCallback(async () => {
    setBattleWinner(null)
    await Promise.all([fetchCatFact(), fetchDogFact()])
    setBattleWinner(Math.random() < 0.5 ? 'cat' : 'dog')
  }, [fetchCatFact, fetchDogFact])

  useEffect(() => {
    void fetchBoth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const battling = catLoading || dogLoading

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero — one composition */}
      <header className="relative pb-8 sm:pb-12">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04 }}
          className="font-[family-name:var(--font-af-mark)] text-[clamp(3.5rem,14vw,7.5rem)] font-extrabold leading-[0.85] tracking-tighter"
        >
          Facts
          <span style={{ color: 'var(--af-signal)' }}>.</span>
        </motion.h1>

        {/* Live score strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-7 flex flex-wrap items-stretch border"
          style={{ borderColor: 'var(--af-line)', background: 'var(--af-panel)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span
              className="font-[family-name:var(--font-af-mono)] text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--af-cat)' }}
            >
              Cat
            </span>
            <span
              className="font-[family-name:var(--font-af-mark)] text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--af-cat)' }}
            >
              {catWins}
            </span>
          </div>
          <div
            className="flex items-center px-3 border-x font-[family-name:var(--font-af-mono)] text-[10px] uppercase tracking-[0.2em]"
            style={{ borderColor: 'var(--af-line)', color: 'var(--af-mute)' }}
          >
            vs
          </div>
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span
              className="font-[family-name:var(--font-af-mono)] text-[10px] uppercase tracking-[0.2em]"
              style={{ color: 'var(--af-dog)' }}
            >
              Dog
            </span>
            <span
              className="font-[family-name:var(--font-af-mark)] text-2xl font-extrabold tabular-nums"
              style={{ color: 'var(--af-dog)' }}
            >
              {dogWins}
            </span>
          </div>
        </motion.div>
      </header>

      <main>
        {/* Desktop: two corners with center duel control; mobile: stacked with duel between */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-5 lg:items-stretch">
          <div className="order-1">
            <FactionCard
              faction="cat"
              fact={catFact}
              length={catLength}
              loading={catLoading}
              error={catError}
              isBattleWinner={battleWinner === 'cat'}
              onNext={() => {
                setBattleWinner(null)
                void fetchCatFact()
              }}
              onWin={() => setCatWins(n => n + 1)}
            />
          </div>

          <div className="order-2 flex items-center justify-center py-2 lg:py-0 lg:px-1">
            <motion.button
              type="button"
              disabled={battling}
              onClick={() => void fetchBoth()}
              whileHover={battling ? undefined : { scale: 1.03 }}
              whileTap={battling ? undefined : { scale: 0.97 }}
              className={cn(
                'group relative inline-flex flex-col items-center justify-center gap-2',
                'h-20 w-full max-w-xs lg:h-28 lg:w-28 lg:max-w-none',
                'font-[family-name:var(--font-af-mono)] text-[11px] font-medium uppercase tracking-[0.16em]',
                'cursor-pointer disabled:cursor-not-allowed disabled:opacity-45',
                'transition-opacity duration-300',
              )}
              style={{
                background: 'var(--af-fg)',
                color: 'var(--af-on-fg)',
              }}
            >
              <Swords className={cn('size-5', battling && 'animate-pulse')} />
              <span>{battling ? 'Dueling' : 'Duel'}</span>
              {!battling && (
                <span
                  className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    boxShadow: '0 0 0 2px var(--af-signal)',
                  }}
                  aria-hidden
                />
              )}
            </motion.button>
          </div>

          <div className="order-3">
            <FactionCard
              faction="dog"
              fact={dogFact}
              loading={dogLoading}
              error={dogError}
              showColdStart={dogFirstLoad}
              isBattleWinner={battleWinner === 'dog'}
              onNext={() => {
                setBattleWinner(null)
                void fetchDogFact()
              }}
              onWin={() => setDogWins(n => n + 1)}
            />
          </div>
        </div>

        <div className="mt-8 sm:mt-12">
          <ScoreBoard
            catWins={catWins}
            dogWins={dogWins}
            totalFacts={totalFacts}
          />
        </div>
      </main>
    </div>
  )
}
