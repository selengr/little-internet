'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoldBar, GoldCarat, GoldHorizon, GoldSpot } from '@/lib/goldprice'

type GoldPayload = {
  spot: GoldSpot
  carat: GoldCarat | null
  bars: GoldBar[]
  horizons?: GoldHorizon[]
}

type VoxRow = {
  id: string
  question: string
  outcomes: string[]
  prices: number[]
  url: string
}

const REFRESH_MS = 45_000

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1400&q=85',
  coins: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=2000&q=85',
  molten: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=1600&q=85',
  crypto: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1600&q=85',
} as const

const KARAT_HINTS: Record<string, string> = {
  '24K': 'Purest gold',
  '22K': 'Common jewelry',
  '18K': 'Everyday jewelry',
  '14K': 'Most durable mix',
}

const mono = { fontFamily: 'var(--font-cx-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-cx-display), Georgia, serif' } as const
const mark = { fontFamily: 'var(--font-cx-mark), system-ui, sans-serif' } as const

function money(n: string | number | null | undefined, digits = 2) {
  const v = typeof n === 'string' ? Number(n) : n
  if (v == null || !Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v)
}

function pctLabel(n: number) {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function signedMoney(n: number) {
  if (n > 0) return `+${money(n)}`
  return money(n)
}

function formatHorizon(expiry: string) {
  const d = new Date(expiry)
  if (Number.isNaN(d.getTime())) return expiry
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-[color:var(--cx-fg)]/[0.07]',
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[gd-shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[color:var(--cx-fg)]/[0.08] to-transparent" />
    </div>
  )
}

function GoldSkeleton() {
  return (
    <div className="space-y-0" aria-busy aria-label="Loading gold prices">
      <style>{`
        @keyframes gd-shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mb-10 md:mb-14">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="max-w-xl w-full space-y-4">
            <Bone className="h-3 w-24" />
            <Bone className="h-14 md:h-[4.5rem] w-[min(100%,18rem)] rounded-lg" />
            <Bone className="h-4 w-full max-w-sm" />
            <Bone className="h-4 w-2/3 max-w-xs" />
          </div>
          <div className="w-full max-w-md rounded-2xl border border-[color:var(--cx-line)] overflow-hidden bg-[color:var(--cx-panel)] shadow-[var(--cx-shadow)]">
            <Bone className="h-36 w-full rounded-none" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Bone className="h-4 w-20" />
                  <Bone className="h-3 w-36" />
                </div>
                <Bone className="h-4 w-14 rounded-full" />
              </div>
              <Bone className="h-10 w-44" />
              <div className="grid grid-cols-2 gap-3">
                <Bone className="h-14 w-full rounded-xl" />
                <Bone className="h-14 w-full rounded-xl" />
              </div>
              <div className="flex justify-between items-center">
                <Bone className="h-5 w-20" />
                <Bone className="h-9 w-[7.5rem]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative h-28 md:h-36 w-full overflow-hidden border-y border-[color:var(--cx-line)]">
        <Bone className="absolute inset-0 rounded-none" />
      </div>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-12">
        <div className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)]">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'px-4 py-6 space-y-3',
                  i % 2 === 1 && 'border-l border-[color:var(--cx-line-soft)]',
                  i >= 2 && 'border-t md:border-t-0 border-[color:var(--cx-line-soft)]',
                  i === 2 && 'md:border-l',
                )}
              >
                <Bone className="h-3 w-16" />
                <Bone className="h-7 w-24" />
                <Bone className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
        <Bone className="h-3 w-28 mb-3" />
        <Bone className="h-9 w-56 mb-3" />
        <Bone className="h-4 w-72 mb-6" />
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] p-4 space-y-3"
            >
              <div className="flex justify-between">
                <Bone className="h-5 w-12" />
                <Bone className="h-4 w-24" />
              </div>
              <Bone className="h-8 w-28" />
              <Bone className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
        <Bone className="h-3 w-24 mb-3" />
        <Bone className="h-9 w-64 mb-6" />
        <Bone className="h-40 w-full rounded-2xl" />
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-14 md:mt-20 mb-4">
        <Bone className="h-36 w-full rounded-2xl" />
      </section>
    </div>
  )
}

function Sparkline({ bars, wide }: { bars: GoldBar[]; wide?: boolean }) {
  const points = bars.map(b => Number(b.close)).filter(Number.isFinite)
  if (points.length < 2) return null
  const w = wide ? 320 : 120
  const h = wide ? 88 : 36
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - ((p - min) / span) * (h - 4) - 2
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
  const up = points[points.length - 1] >= points[0]
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={wide ? 'w-full h-[5.5rem]' : 'w-[7.5rem] h-9'}
      aria-hidden
      preserveAspectRatio="none"
    >
      <path
        d={d}
        fill="none"
        stroke={up ? 'var(--cx-up)' : 'var(--cx-down)'}
        strokeWidth={wide ? 2.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function GoldView() {
  const [data, setData] = useState<GoldPayload | null>(null)
  const [odds, setOdds] = useState<VoxRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [goldRes, voxRes] = await Promise.all([
          fetch('/api/gold', { cache: 'no-store' }),
          fetch('/api/voxodds', { cache: 'no-store' }),
        ])
        const goldJson = await goldRes.json()
        const voxJson = await voxRes.json().catch(() => ({ markets: [] }))
        if (cancelled) return
        if (!goldRes.ok) throw new Error(goldJson.error || 'Gold failed')
        setData(goldJson as GoldPayload)
        setOdds(Array.isArray(voxJson.markets) ? voxJson.markets.slice(0, 4) : [])
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const t = window.setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [])

  const changePct = useMemo(() => {
    if (!data?.spot) return null
    if (data.spot.chp != null) {
      const n = Number(data.spot.chp)
      return Number.isFinite(n) ? n : null
    }
    const closes = data.bars.map(b => Number(b.close)).filter(Number.isFinite)
    if (closes.length < 2) return null
    const last = closes[closes.length - 1]
    const prev = closes[closes.length - 2]
    if (!prev) return null
    return ((last - prev) / prev) * 100
  }, [data])

  const changeUsd = useMemo(() => {
    if (!data?.spot?.ch) return null
    const n = Number(data.spot.ch)
    return Number.isFinite(n) ? n : null
  }, [data])

  const karats = useMemo(() => {
    const c = data?.carat
    const s = data?.spot
    const rows = [
      { k: '24K', v: c?.price_gram_24k ?? s?.price_gram_24k },
      { k: '22K', v: c?.price_gram_22k ?? s?.price_gram_22k },
      { k: '18K', v: c?.price_gram_18k ?? s?.price_gram_18k },
      { k: '14K', v: c?.price_gram_14k ?? s?.price_gram_14k },
    ]
    return rows.filter(r => r.v != null && Number.isFinite(Number(r.v)))
  }, [data])

  const horizons = useMemo(
    () => (data?.horizons ?? []).filter(h => h.futures?.settle_usd).slice(0, 4),
    [data],
  )

  const hasBidAsk = Boolean(
    data?.spot?.bid != null &&
      data?.spot?.ask != null &&
      Number.isFinite(Number(data.spot.bid)) &&
      Number.isFinite(Number(data.spot.ask)),
  )

  if (loading && !data) return <GoldSkeleton />

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 text-sm text-[color:var(--cx-mute)]">
        {error}
      </div>
    )
  }

  const up = (changePct ?? 0) >= 0
  const spot = data?.spot
  const usdChangeText = changeUsd != null ? signedMoney(changeUsd) : null

  return (
    <div className="space-y-0">
      {/* Hero — spot desk */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mb-10 md:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10"
        >
          <div className="max-w-xl">
            <p
              className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--cx-mute)] mb-3"
              style={mono}
            >
              Live market
            </p>
            <h1
              className="text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.9] tracking-tight text-[color:var(--cx-fg)]"
              style={display}
            >
              Gold price
            </h1>
            <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-[color:var(--cx-mute)] max-w-md">
              The live price of gold, jewelry purity prices per gram, and what traders think
              happens next — refreshed every minute.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="relative overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] backdrop-blur-sm min-w-[min(100%,320px)] w-full max-w-md shadow-[var(--cx-shadow)]"
          >
            <div className="relative h-36 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.hero}
                alt="Gold bullion bars"
                className="absolute inset-0 w-full h-full object-cover object-[center_40%] scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--cx-panel)] via-[color:var(--cx-panel)]/50 to-black/10" />
            </div>

            <div className="relative px-6 pb-6 pt-1">
              <div className="pointer-events-none absolute top-0 left-3 size-3 border-l border-t border-[color:var(--cx-signal)] rounded-tl-sm" />
              <div className="pointer-events-none absolute top-0 right-3 size-3 border-r border-t border-[color:var(--cx-signal)] rounded-tr-sm" />

              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm text-[color:var(--cx-fg)]" style={mark}>
                    Spot gold
                  </p>
                  <p className="text-xs text-[color:var(--cx-mute)] mt-0.5">
                    Price of one ounce in US dollars
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[color:var(--cx-up)]">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--cx-up)] opacity-55" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--cx-up)]" />
                  </span>
                  Live
                </span>
              </div>

              <p
                className="text-[clamp(1.9rem,5vw,2.85rem)] font-bold tabular-nums tracking-tight leading-none text-[color:var(--cx-fg)]"
                style={mono}
              >
                {money(spot?.price)}
              </p>

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {changePct != null ? (
                    <p
                      className="text-base md:text-lg font-semibold tabular-nums"
                      style={{ ...mono, color: up ? 'var(--cx-up)' : 'var(--cx-down)' }}
                    >
                      {pctLabel(changePct)}
                      {usdChangeText ? (
                        <span className="ml-2 text-sm font-medium opacity-80">{usdChangeText}</span>
                      ) : null}
                    </p>
                  ) : (
                    <span className="text-[color:var(--cx-mute)]" style={mono}>
                      —
                    </span>
                  )}
                  <p className="text-[11px] text-[color:var(--cx-mute)] mt-0.5">Today vs yesterday</p>
                </div>
                <Sparkline bars={data?.bars ?? []} />
              </div>

              {hasBidAsk && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[color:var(--cx-line-soft)] bg-[color:var(--cx-tape)] px-3 py-2.5">
                    <p
                      className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--cx-mute)]"
                      style={mono}
                    >
                      Buy price
                    </p>
                    <p className="mt-1 text-sm tabular-nums text-[color:var(--cx-fg)]" style={mono}>
                      {money(spot?.ask)}
                    </p>
                    <p className="text-[10px] text-[color:var(--cx-mute)] mt-0.5">Ask · what you pay</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--cx-line-soft)] bg-[color:var(--cx-tape)] px-3 py-2.5">
                    <p
                      className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--cx-mute)]"
                      style={mono}
                    >
                      Sell price
                    </p>
                    <p className="mt-1 text-sm tabular-nums text-[color:var(--cx-fg)]" style={mono}>
                      {money(spot?.bid)}
                    </p>
                    <p className="text-[10px] text-[color:var(--cx-mute)] mt-0.5">Bid · what you get</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Atmosphere band */}
      <div className="relative h-32 md:h-40 w-full overflow-hidden border-y border-[color:var(--cx-line)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGES.coins}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[color:var(--cx-bg)]/55 dark:bg-[color:var(--cx-bg)]/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--cx-bg)] via-transparent to-[color:var(--cx-bg)]" />
        <div className="relative h-full max-w-6xl mx-auto px-6 md:px-10 flex items-center">
          <p
            className="text-[11px] md:text-sm tracking-[0.08em] text-[color:var(--cx-fg)]/85 max-w-lg"
            style={mono}
          >
            Live ounce price · jewelry by purity · trader outlook
          </p>
        </div>
      </div>

      {/* Session strip */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              {
                label: 'Live price',
                value: money(spot?.price),
                hint: 'Per ounce',
              },
              {
                label: 'Change today',
                value: changePct != null ? pctLabel(changePct) : '—',
                hint: usdChangeText ?? 'Session move',
                tint: changePct != null ? (up ? 'up' : 'down') : undefined,
              },
              {
                label: 'Yesterday close',
                value: money(spot?.prev_close_price),
                hint: 'Last session',
              },
              {
                label: hasBidAsk ? 'Buy / sell' : 'Pure gold / gram',
                value: hasBidAsk
                  ? `${money(spot?.ask, 0)} / ${money(spot?.bid, 0)}`
                  : money(spot?.price_gram_24k ?? data?.carat?.price_gram_24k),
                hint: hasBidAsk ? 'Ask / bid' : '24K reference',
              },
            ].map((cell, i) => (
              <div
                key={cell.label}
                className={cn(
                  'px-4 py-5 md:px-5 md:py-6',
                  i % 2 === 1 && 'border-l border-[color:var(--cx-line-soft)]',
                  i >= 2 && 'border-t md:border-t-0 border-[color:var(--cx-line-soft)]',
                  i === 2 && 'md:border-l',
                )}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--cx-mute)] mb-2"
                  style={mono}
                >
                  {cell.label}
                </p>
                <p
                  className="text-lg md:text-xl tabular-nums tracking-tight text-[color:var(--cx-fg)]"
                  style={{
                    ...mono,
                    color:
                      cell.tint === 'up'
                        ? 'var(--cx-up)'
                        : cell.tint === 'down'
                          ? 'var(--cx-down)'
                          : undefined,
                  }}
                >
                  {cell.value}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">{cell.hint}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Jewelry purity */}
      {karats.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 md:gap-5">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)]">
              <div className="px-4 pt-5 pb-3 md:px-5 md:pt-6">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-1"
                  style={mono}
                >
                  Per gram
                </p>
                <h2 className="text-xl md:text-2xl tracking-tight" style={display}>
                  Jewelry purity prices
                </h2>
                <p className="mt-1.5 text-sm text-[color:var(--cx-mute)] max-w-md">
                  What gold is worth by karat — higher karat means more gold in the mix.
                </p>
              </div>
              <div className="grid grid-cols-2">
                {karats.map((row, i) => (
                  <div
                    key={row.k}
                    className={cn(
                      'px-4 py-5 md:px-5 md:py-6',
                      i % 2 === 1 && 'border-l border-[color:var(--cx-line-soft)]',
                      i >= 2 && 'border-t border-[color:var(--cx-line-soft)]',
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-2">
                      <p
                        className="text-sm font-semibold tracking-tight text-[color:var(--cx-fg)]"
                        style={mark}
                      >
                        {row.k}
                      </p>
                      <p className="text-[11px] text-[color:var(--cx-mute)]">
                        {KARAT_HINTS[row.k] ?? 'Gold mix'}
                      </p>
                    </div>
                    <p
                      className="text-xl md:text-2xl tabular-nums tracking-tight text-[color:var(--cx-fg)]"
                      style={mono}
                    >
                      {money(row.v)}
                    </p>
                    <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">Per gram</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-[color:var(--cx-line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.molten}
                alt="Gold texture"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <p
                  className="text-[10px] uppercase tracking-[0.24em] text-white/60 mb-2"
                  style={mono}
                >
                  Quick guide
                </p>
                <p className="text-white text-lg md:text-xl font-light leading-snug" style={display}>
                  24K is purest. Lower karats mix in other metals for strength — and cost less per
                  gram.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent trend chart */}
      {(data?.bars?.length ?? 0) > 2 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
          <div className="rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-1"
                  style={mono}
                >
                  About a month
                </p>
                <h2 className="text-xl md:text-2xl tracking-tight" style={display}>
                  Recent gold trend
                </h2>
                <p className="mt-1 text-sm text-[color:var(--cx-mute)]">
                  Daily closing prices — a simple look at where gold has been.
                </p>
              </div>
              {changePct != null && (
                <p
                  className="text-sm tabular-nums font-medium"
                  style={{ ...mono, color: up ? 'var(--cx-up)' : 'var(--cx-down)' }}
                >
                  {pctLabel(changePct)} today
                </p>
              )}
            </div>
            <Sparkline bars={data?.bars ?? []} wide />
          </div>
        </section>
      )}

      {/* Forward outlook */}
      {horizons.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
          <div className="mb-5">
            <p
              className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
              style={mono}
            >
              Looking ahead
            </p>
            <h2
              className="text-2xl md:text-3xl tracking-tight text-[color:var(--cx-fg)]"
              style={display}
            >
              Future price hints
            </h2>
            <p className="mt-1.5 text-sm text-[color:var(--cx-mute)] max-w-lg">
              Market contract prices for later dates — not a guarantee, just where traders are
              marked.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {horizons.map(h => (
              <div
                key={h.expiry}
                className="rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] px-4 py-4"
              >
                <p
                  className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)] mb-2"
                  style={mono}
                >
                  {formatHorizon(h.expiry)}
                </p>
                <p className="text-lg tabular-nums text-[color:var(--cx-fg)]" style={mono}>
                  {money(h.futures?.settle_usd)}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">Per ounce</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VoxOdds */}
      {odds.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
                style={mono}
              >
                Prediction markets
              </p>
              <h2
                className="text-2xl md:text-3xl tracking-tight text-[color:var(--cx-fg)]"
                style={display}
              >
                What traders think happens next
              </h2>
              <p className="mt-1.5 text-sm text-[color:var(--cx-mute)] max-w-lg">
                Separate crypto bets — odds from people putting money on yes or no, not gold
                itself.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {odds.map(m => {
              const yes = m.prices[0] ?? 0
              return (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] px-4 py-4 transition-colors hover:border-[color:var(--cx-signal)]/50"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm leading-snug text-[color:var(--cx-fg)]">{m.question}</p>
                    <ArrowUpRight className="size-4 shrink-0 text-[color:var(--cx-mute)] group-hover:text-[color:var(--cx-signal)]" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-[color:var(--cx-line-soft)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[color:var(--cx-signal)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.round(yes * 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span
                      className="text-sm tabular-nums text-[color:var(--cx-fg)] shrink-0"
                      style={mono}
                    >
                      {Math.round(yes * 100)}% yes
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Crypto CTA */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-14 md:mt-20 mb-4">
        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--cx-line)] min-h-[200px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.crypto}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-[#0f1419]/72" />
          <div className="relative px-6 py-10 md:px-10 md:py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.28em] text-white/55 mb-2"
                style={mono}
              >
                Also live
              </p>
              <h2 className="text-2xl md:text-3xl tracking-tight text-white" style={display}>
                See Bitcoin & crypto prices
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Live coins, 24h moves, and the full market board.
              </p>
            </div>
            <Link
              href="/crypto"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-medium tracking-wide bg-white text-[#10141a] hover:bg-white/90 transition-colors"
              style={mark}
            >
              Open crypto
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
