'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Card = {
  id: string
  name: string
  set: string
  art: string
  usd: number
}

type Pair = { left: Card; right: Card }
type Side = 'left' | 'right'

function money(n: number) {
  return `$${n.toFixed(2)}`
}

export function PricierGame() {
  const [pair, setPair] = useState<Pair | null>(null)
  const [pick, setPick] = useState<Side | null>(null)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setBusy(true)
    setError(null)
    setPick(null)
    try {
      const res = await fetch('/api/scryfall', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'load')
      setPair(json as Pair)
    } catch {
      setError('Could not pull two cards. Try again.')
      setPair(null)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('pricier-best') || 0)
    if (Number.isFinite(saved)) setBest(saved)
    void load()
  }, [load])

  function choose(side: Side) {
    if (!pair || pick || busy) return
    setPick(side)
    const winner: Side = pair.left.usd > pair.right.usd ? 'left' : 'right'
    const correct = side === winner
    setStreak(current => {
      const next = correct ? current + 1 : 0
      setBest(top => {
        const value = Math.max(top, next)
        window.localStorage.setItem('pricier-best', String(value))
        return value
      })
      return next
    })
  }

  const winner: Side | null =
    pair && pick ? (pair.left.usd > pair.right.usd ? 'left' : 'right') : null

  return (
    <section className="border-2 border-[#1a1612] bg-[#f7f1e6] text-[#1a1612] dark:border-[#f3efe6] dark:bg-[#171512] dark:text-[#f3efe6]">
      <div className="flex items-end justify-between gap-4 border-b-2 border-[#1a1612] px-5 py-4 dark:border-[#f3efe6] sm:px-8">
        <div>
          <p className="font-pixel text-[10px] tracking-[0.32em] text-[#e23d28]">STREAK</p>
          <p className="text-5xl font-semibold leading-none tabular-nums tracking-tight">{streak}</p>
        </div>
        <p className="font-pixel text-[10px] tracking-[0.22em]">BEST {best}</p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
        {(['left', 'right'] as const).map(side => {
          const card = pair?.[side]
          const revealed = pick !== null
          const isWinner = winner === side
          const isPick = pick === side
          return (
            <button
              key={side}
              type="button"
              disabled={!card || busy || revealed}
              onClick={() => choose(side)}
              className={cn(
                'group relative overflow-hidden border-2 border-[#1a1612] text-left disabled:cursor-default dark:border-[#f3efe6]',
                revealed && isWinner && 'border-[#e23d28]',
                revealed && isPick && !isWinner && 'opacity-60',
              )}
            >
              <div className="aspect-[5/3] bg-[#1a1612]/10">
                {card ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.art}
                    alt={revealed ? card.name : 'Hidden card art'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] group-disabled:scale-100"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[#1a1612]/10 dark:bg-[#f3efe6]/10" />
                )}
              </div>
              <div className="flex items-end justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{revealed && card ? card.name : 'Tap if this costs more'}</p>
                  <p className="truncate font-pixel text-[10px] tracking-[0.18em] opacity-60">
                    {revealed && card ? card.set : side === 'left' ? 'LEFT' : 'RIGHT'}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-semibold tabular-nums">
                  {revealed && card ? money(card.usd) : '—'}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-4 border-t-2 border-[#1a1612] px-5 py-3 dark:border-[#f3efe6] sm:px-8">
        <p className="text-sm">
          {error
            ? error
            : pick && winner
              ? pick === winner
                ? 'Right. The streak holds.'
                : 'Cheaper. Streak resets.'
              : 'Two real cards. Pick the pricier one.'}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy || !pick}
          className="border-2 border-[#e23d28] bg-[#e23d28] px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
        >
          {busy ? 'Drawing…' : 'Next'}
        </button>
      </div>
    </section>
  )
}
