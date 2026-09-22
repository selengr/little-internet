'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoldBar, GoldCarat, GoldSpot } from '@/lib/goldprice'

type GoldPayload = {
  spot: GoldSpot
  carat: GoldCarat | null
  bars: GoldBar[]
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
  /** Stacked bullion — hero price card */
  hero: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1400&q=85',
  /** Close gold coins — atmosphere band */
  coins: 'https://images.unsplash.com/photo-1624365168968-f201cffc2c7e?auto=format&fit=crop&w=2000&q=85',
  /** Pouring molten / warm metal — karat section */
  molten: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1600&q=85',
  /** Markets screens — handoff to crypto */
  crypto: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1600&q=85',
} as const

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
          <div className="w-full max-w-sm rounded-2xl border border-[color:var(--cx-line)] overflow-hidden bg-[color:var(--cx-panel)] shadow-[var(--cx-shadow)]">
            <Bone className="h-36 w-full rounded-none" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Bone className="h-4 w-16" />
                  <Bone className="h-3 w-24" />
                </div>
                <Bone className="h-4 w-12 rounded-full" />
              </div>
              <Bone className="h-10 w-40" />
              <div className="flex justify-between items-center">
                <Bone className="h-5 w-16" />
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
                <Bone className="h-3 w-14" />
                <Bone className="h-7 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
        <Bone className="h-3 w-20 mb-3" />
        <Bone className="h-9 w-48 mb-6" />
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] p-4 space-y-4"
            >
              <Bone className="h-10 w-full" />
              <Bone className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-14 md:mt-20 mb-4">
        <Bone className="h-36 w-full rounded-2xl" />
      </section>
    </div>
  )
}

function Sparkline({ bars }: { bars: GoldBar[] }) {
  const points = bars.map(b => Number(b.close)).filter(Number.isFinite)
  if (points.length < 2) return null
  const w = 120
  const h = 36
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[7.5rem] h-9" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={up ? 'var(--cx-up)' : 'var(--cx-down)'}
        strokeWidth="1.75"
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

  const karats = useMemo(() => {
    const c = data?.carat
    if (!c) return []
    return [
      { k: '24K', v: c.price_gram_24k },
      { k: '22K', v: c.price_gram_22k },
      { k: '18K', v: c.price_gram_18k },
      { k: '14K', v: c.price_gram_14k },
    ]
  }, [data])

  if (loading && !data) return <GoldSkeleton />

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 text-sm text-[color:var(--cx-mute)]">
        {error}
      </div>
    )
  }

  const up = (changePct ?? 0) >= 0

  return (
    <div className="space-y-0">
      {/* Hero */}
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
              Markets
            </p>
            <h1
              className="text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.9] tracking-tight text-[color:var(--cx-fg)]"
              style={display}
            >
              Live gold
            </h1>
            <p className="mt-3 text-sm text-[color:var(--cx-mute)] max-w-md">
              Spot XAU, karat per gram, and what crypto traders are pricing next.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.55 }}
            className="relative overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] backdrop-blur-sm min-w-[min(100%,320px)] w-full max-w-sm shadow-[var(--cx-shadow)]"
          >
            <div className="relative h-40 overflow-hidden">
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

              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm text-[color:var(--cx-fg)]" style={mark}>
                    Gold
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    XAU · USD / oz
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
                className="text-[clamp(1.8rem,5vw,2.75rem)] font-bold tabular-nums tracking-tight leading-none text-[color:var(--cx-fg)]"
                style={mono}
              >
                {money(data?.spot.price)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                {changePct != null ? (
                  <span
                    className="text-base md:text-lg font-semibold tabular-nums"
                    style={{ ...mono, color: up ? 'var(--cx-up)' : 'var(--cx-down)' }}
                  >
                    {pctLabel(changePct)}
                  </span>
                ) : (
                  <span className="text-[color:var(--cx-mute)]" style={mono}>
                    —
                  </span>
                )}
                <Sparkline bars={data?.bars ?? []} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Atmosphere band */}
      <div className="relative h-32 md:h-44 w-full overflow-hidden border-y border-[color:var(--cx-line)]">
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
            className="text-[11px] md:text-sm uppercase tracking-[0.28em] text-[color:var(--cx-fg)]/80"
            style={mono}
          >
            Troy ounce · karat · prediction tape
          </p>
        </div>
      </div>

      {/* Karat + molten visual */}
      {karats.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-14">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 md:gap-5">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)]">
              <div className="px-4 pt-5 pb-2 md:px-5">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-1"
                  style={mono}
                >
                  Per gram
                </p>
                <h2 className="text-xl md:text-2xl tracking-tight" style={display}>
                  Karat ladder
                </h2>
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
                    <p
                      className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
                      style={mono}
                    >
                      {row.k}
                    </p>
                    <p
                      className="text-xl md:text-2xl tabular-nums tracking-tight text-[color:var(--cx-fg)]"
                      style={mono}
                    >
                      {money(row.v)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-[color:var(--cx-line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGES.molten}
                alt="Gold texture"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <p
                  className="text-[10px] uppercase tracking-[0.24em] text-white/60 mb-2"
                  style={mono}
                >
                  Metal value
                </p>
                <p className="text-white text-lg md:text-xl font-light leading-snug" style={display}>
                  Purity-adjusted grams from live spot
                </p>
              </div>
            </div>
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
                Prediction
              </p>
              <h2
                className="text-2xl md:text-3xl tracking-tight text-[color:var(--cx-fg)]"
                style={display}
              >
                Crypto odds
              </h2>
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
                      <div
                        className="h-full rounded-full bg-[color:var(--cx-signal)]"
                        style={{ width: `${Math.round(yes * 100)}%` }}
                      />
                    </div>
                    <span
                      className="text-sm tabular-nums text-[color:var(--cx-fg)] shrink-0"
                      style={mono}
                    >
                      {Math.round(yes * 100)}%
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}

      {/* Next → crypto with image */}
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
                Next
              </p>
              <h2 className="text-2xl md:text-3xl tracking-tight text-white" style={display}>
                Crypto markets
              </h2>
              <p className="mt-1 text-sm text-white/60">Bitcoin, Ethereum, and the live tape.</p>
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
