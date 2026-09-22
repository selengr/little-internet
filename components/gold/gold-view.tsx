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
  band: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=2000&q=85',
  molten: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=1600&q=85',
  crypto: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1600&q=85',
} as const

const KARAT_ROWS: { k: string; hint: string; plain: string }[] = [
  { k: '24K', hint: '99.9% pure', plain: 'Pure gold (24K)' },
  { k: '22K', hint: '91.6% gold', plain: 'Common jewelry (22K)' },
  { k: '18K', hint: '75% gold', plain: 'Everyday jewelry (18K)' },
  { k: '14K', hint: '58.3% gold', plain: 'Durable mix (14K)' },
]

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

function formatAsOf(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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

      <section className="max-w-6xl mx-auto px-6 md:px-10 mb-8 md:mb-10">
        <div className="mb-6 space-y-3">
          <Bone className="h-3 w-28" />
          <Bone className="h-12 md:h-16 w-[min(100%,20rem)] rounded-lg" />
          <Bone className="h-4 w-full max-w-md" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] shadow-[var(--cx-shadow)]">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--cx-line-soft)] px-5 py-3 md:px-6">
            <Bone className="h-3 w-36" />
            <Bone className="h-4 w-14 rounded-full" />
          </div>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="px-5 py-6 md:px-6 md:py-7 space-y-4">
              <Bone className="h-3 w-40" />
              <Bone className="h-14 md:h-16 w-[min(100%,16rem)]" />
              <Bone className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Bone className="h-20 w-full rounded-xl" />
                <Bone className="h-20 w-full rounded-xl" />
              </div>
            </div>
            <div className="border-t lg:border-t-0 lg:border-l border-[color:var(--cx-line-soft)] px-5 py-6 md:px-6 md:py-7 space-y-4">
              <Bone className="h-3 w-28" />
              <Bone className="h-28 w-full rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <Bone className="h-12 w-full rounded-lg" />
                <Bone className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative h-24 md:h-28 w-full overflow-hidden border-y border-[color:var(--cx-line)]">
        <Bone className="absolute inset-0 rounded-none" />
      </div>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-12">
        <Bone className="h-3 w-24 mb-2" />
        <Bone className="h-8 w-56 mb-2" />
        <Bone className="h-4 w-72 mb-5" />
        <div className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'grid grid-cols-[1fr_auto] md:grid-cols-[1.4fr_1fr_auto] gap-3 items-center px-4 py-4 md:px-5',
                i > 0 && 'border-t border-[color:var(--cx-line-soft)]',
              )}
            >
              <div className="space-y-2">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-24" />
              </div>
              <Bone className="hidden md:block h-4 w-20" />
              <Bone className="h-6 w-24" />
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
        <Bone className="h-3 w-28 mb-2" />
        <Bone className="h-8 w-48 mb-5" />
        <Bone className="h-44 w-full rounded-2xl" />
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
        <Bone className="h-3 w-24 mb-2" />
        <Bone className="h-8 w-52 mb-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-[color:var(--cx-line)] bg-[color:var(--cx-line)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[color:var(--cx-panel)] p-4 space-y-3">
              <Bone className="h-3 w-16" />
              <Bone className="h-6 w-24" />
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

function SessionChart({ bars, up }: { bars: GoldBar[]; up: boolean }) {
  const closes = bars.map(b => Number(b.close)).filter(Number.isFinite)
  if (closes.length < 2) return null

  const w = 480
  const h = 140
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const coords = closes.map((p, i) => {
    const x = (i / (closes.length - 1)) * w
    const y = h - ((p - min) / span) * (h - 10) - 5
    return { x, y }
  })
  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L ${w} ${h} L 0 ${h} Z`
  const stroke = up ? 'var(--cx-up)' : 'var(--cx-down)'
  const first = closes[0]
  const last = closes[closes.length - 1]
  const rangePct = first ? ((last - first) / first) * 100 : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--cx-mute)]"
            style={mono}
          >
            Session chart
          </p>
          <p className="mt-1 text-xs text-[color:var(--cx-mute)]">~30 daily closes</p>
        </div>
        <p
          className="text-sm tabular-nums font-medium"
          style={{ ...mono, color: rangePct >= 0 ? 'var(--cx-up)' : 'var(--cx-down)' }}
        >
          {pctLabel(rangePct)} period
        </p>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[7.5rem] md:h-36"
        aria-hidden
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="gd-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gd-area)" />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-[color:var(--cx-mute)]" style={mono}>
        <span>Low {money(min)}</span>
        <span>High {money(max)}</span>
      </div>
    </div>
  )
}

function MiniSpark({ bars }: { bars: GoldBar[] }) {
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-[7.5rem] h-9" aria-hidden preserveAspectRatio="none">
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
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

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
        setUpdatedAt(new Date())
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
    const lookup: Record<string, string | null | undefined> = {
      '24K': c?.price_gram_24k ?? s?.price_gram_24k,
      '22K': c?.price_gram_22k ?? s?.price_gram_22k,
      '18K': c?.price_gram_18k ?? s?.price_gram_18k,
      '14K': c?.price_gram_14k ?? s?.price_gram_14k,
    }
    return KARAT_ROWS.map(row => ({
      ...row,
      v: lookup[row.k],
    })).filter(r => r.v != null && Number.isFinite(Number(r.v)))
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

  const spread = useMemo(() => {
    if (!hasBidAsk || !data?.spot) return null
    const bid = Number(data.spot.bid)
    const ask = Number(data.spot.ask)
    if (!Number.isFinite(bid) || !Number.isFinite(ask)) return null
    return ask - bid
  }, [data, hasBidAsk])

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
  const asOf =
    formatAsOf(spot?.computed_at) ??
    (updatedAt
      ? updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null)

  return (
    <div className="space-y-0">
      {/* Exchange desk */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mb-8 md:mb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 md:mb-7"
        >
          <p
            className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--cx-mute)] mb-3"
            style={mono}
          >
            XAU · USD spot
          </p>
          <h1
            className="text-[clamp(2.6rem,9vw,4.75rem)] leading-[0.92] tracking-tight text-[color:var(--cx-fg)]"
            style={display}
          >
            Gold price right now
          </h1>
          <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-[color:var(--cx-mute)] max-w-xl">
            Live ounce quote, buy and sell prices, jewelry purity by karat — refreshed about every
            minute.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] shadow-[var(--cx-shadow)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--cx-line-soft)] px-5 py-3 md:px-6 bg-[color:var(--cx-tape)]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={mono}>
              <span className="uppercase tracking-[0.2em] text-[color:var(--cx-mute)]">
                Spot desk
              </span>
              <span className="text-[color:var(--cx-fg)]/70">XAU-USD</span>
              {asOf && (
                <span className="text-[color:var(--cx-mute)]">As of {asOf}</span>
              )}
              {spot?.is_stale && (
                <span className="text-[color:var(--cx-down)]">Delayed</span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--cx-up)]">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--cx-up)] opacity-55" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--cx-up)]" />
              </span>
              Live
            </span>
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-5 py-6 md:px-7 md:py-8">
              <p className="text-sm text-[color:var(--cx-mute)] mb-2">
                One troy ounce of gold · US dollars
              </p>
              <p
                className="text-[clamp(2.4rem,7vw,3.75rem)] font-bold tabular-nums tracking-tight leading-none text-[color:var(--cx-fg)]"
                style={mono}
              >
                {money(spot?.price)}
              </p>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  {changePct != null ? (
                    <p
                      className="text-lg md:text-xl font-semibold tabular-nums"
                      style={{ ...mono, color: up ? 'var(--cx-up)' : 'var(--cx-down)' }}
                    >
                      {pctLabel(changePct)}
                      {usdChangeText ? (
                        <span className="ml-2 text-base font-medium opacity-85">{usdChangeText}</span>
                      ) : null}
                    </p>
                  ) : (
                    <span className="text-[color:var(--cx-mute)]" style={mono}>
                      —
                    </span>
                  )}
                  <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">
                    Change vs previous close
                    {spot?.prev_close_price != null
                      ? ` · was ${money(spot.prev_close_price)}`
                      : ''}
                  </p>
                </div>
                <MiniSpark bars={data?.bars ?? []} />
              </div>

              {hasBidAsk && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[color:var(--cx-line-soft)] bg-[color:var(--cx-tape)] px-4 py-3.5">
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)]"
                      style={mono}
                    >
                      Buy
                    </p>
                    <p
                      className="mt-1.5 text-xl md:text-2xl tabular-nums tracking-tight text-[color:var(--cx-fg)]"
                      style={mono}
                    >
                      {money(spot?.ask)}
                    </p>
                    <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">
                      Ask · price to purchase
                    </p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--cx-line-soft)] bg-[color:var(--cx-tape)] px-4 py-3.5">
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)]"
                      style={mono}
                    >
                      Sell
                    </p>
                    <p
                      className="mt-1.5 text-xl md:text-2xl tabular-nums tracking-tight text-[color:var(--cx-fg)]"
                      style={mono}
                    >
                      {money(spot?.bid)}
                    </p>
                    <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">
                      Bid · price you receive
                    </p>
                  </div>
                </div>
              )}

              {spread != null && (
                <p className="mt-3 text-[11px] text-[color:var(--cx-mute)]" style={mono}>
                  Spread {money(spread)} between buy and sell
                </p>
              )}
            </div>

            <div className="border-t lg:border-t-0 lg:border-l border-[color:var(--cx-line-soft)] px-5 py-6 md:px-6 md:py-8 bg-[color:var(--cx-tape)]/40">
              <SessionChart bars={data?.bars ?? []} up={up} />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[color:var(--cx-line-soft)] bg-[color:var(--cx-panel)] px-3 py-3">
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    Prev close
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-[color:var(--cx-fg)]" style={mono}>
                    {money(spot?.prev_close_price)}
                  </p>
                </div>
                <div className="rounded-lg border border-[color:var(--cx-line-soft)] bg-[color:var(--cx-panel)] px-3 py-3">
                  <p
                    className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    Pure / g
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-[color:var(--cx-fg)]" style={mono}>
                    {money(spot?.price_gram_24k ?? data?.carat?.price_gram_24k)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Atmosphere ticker band */}
      <div className="relative h-24 md:h-28 w-full overflow-hidden border-y border-[color:var(--cx-line)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGES.band}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[color:var(--cx-bg)]/60 dark:bg-[color:var(--cx-bg)]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--cx-bg)] via-transparent to-[color:var(--cx-bg)]" />
        <div className="relative h-full max-w-6xl mx-auto px-6 md:px-10 flex items-center overflow-hidden">
          <motion.div
            className="flex gap-10 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 36, ease: 'linear', repeat: Infinity }}
          >
            {[0, 1].flatMap(copy =>
              [
                { label: 'SPOT', value: money(spot?.price) },
                {
                  label: 'CHG',
                  value: changePct != null ? pctLabel(changePct) : '—',
                },
                { label: 'BUY', value: hasBidAsk ? money(spot?.ask) : '—' },
                { label: 'SELL', value: hasBidAsk ? money(spot?.bid) : '—' },
                {
                  label: '24K/g',
                  value: money(spot?.price_gram_24k ?? data?.carat?.price_gram_24k),
                },
                { label: 'PREV', value: money(spot?.prev_close_price) },
              ].map(item => (
                <span
                  key={`${copy}-${item.label}`}
                  className="inline-flex items-baseline gap-2 text-sm shrink-0"
                  style={mono}
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)]">
                    {item.label}
                  </span>
                  <span className="tabular-nums text-[color:var(--cx-fg)]">{item.value}</span>
                </span>
              )),
            )}
          </motion.div>
        </div>
      </div>

      {/* Karat product board (APMEX-style SKUs) */}
      {karats.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
                  style={mono}
                >
                  Product board
                </p>
                <h2
                  className="text-2xl md:text-3xl tracking-tight text-[color:var(--cx-fg)]"
                  style={display}
                >
                  Jewelry purity prices
                </h2>
                <p className="mt-1.5 text-sm text-[color:var(--cx-mute)] max-w-lg">
                  Per-gram prices by karat — like store SKUs for how pure the gold is.
                </p>
              </div>
              <div className="relative hidden md:block w-40 h-24 overflow-hidden rounded-xl border border-[color:var(--cx-line)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={IMAGES.molten}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)]">
              <div
                className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 px-5 py-2.5 border-b border-[color:var(--cx-line-soft)] bg-[color:var(--cx-tape)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)]"
                style={mono}
              >
                <span>Purity</span>
                <span>Gold share</span>
                <span className="text-right">Per gram</span>
                <span className="w-16 text-right">SKU</span>
              </div>
              {karats.map((row, i) => (
                <div
                  key={row.k}
                  className={cn(
                    'grid grid-cols-[1fr_auto] md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-center px-4 py-4 md:px-5 md:py-4',
                    i > 0 && 'border-t border-[color:var(--cx-line-soft)]',
                    i === 0 && 'bg-[color:var(--cx-tape)]/50',
                  )}
                >
                  <div>
                    <p className="text-sm md:text-base font-semibold text-[color:var(--cx-fg)]" style={mark}>
                      {row.plain}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--cx-mute)] md:hidden">
                      {row.hint}
                    </p>
                  </div>
                  <p className="hidden md:block text-sm text-[color:var(--cx-mute)]">{row.hint}</p>
                  <p
                    className="text-lg md:text-xl tabular-nums tracking-tight text-[color:var(--cx-fg)] md:text-right"
                    style={mono}
                  >
                    {money(row.v)}
                  </p>
                  <p
                    className="hidden md:block w-16 text-right text-xs tabular-nums text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    {row.k}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-[color:var(--cx-mute)]">
              Higher karat means more gold in the mix — and a higher price per gram.
            </p>
          </motion.div>
        </section>
      )}

      {/* Forward horizons */}
      {horizons.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
          <div className="mb-5">
            <p
              className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
              style={mono}
            >
              Forward curve
            </p>
            <h2
              className="text-2xl md:text-3xl tracking-tight text-[color:var(--cx-fg)]"
              style={display}
            >
              Later delivery prices
            </h2>
            <p className="mt-1.5 text-sm text-[color:var(--cx-mute)] max-w-lg">
              Contract settle prices for future months — where traders mark gold later, not a
              promise.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-[color:var(--cx-line)] bg-[color:var(--cx-line)]">
            {horizons.map(h => (
              <div key={h.expiry} className="bg-[color:var(--cx-panel)] px-4 py-5 md:px-5">
                <p
                  className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)] mb-2"
                  style={mono}
                >
                  {formatHorizon(h.expiry)}
                </p>
                <p className="text-lg md:text-xl tabular-nums text-[color:var(--cx-fg)]" style={mono}>
                  {money(h.futures?.settle_usd)}
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]">
                  {h.futures?.contract ?? 'Per ounce'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VoxOdds */}
      {odds.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-12 md:mt-16">
          <div className="mb-5">
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
              Separate crypto bets — odds from people putting money on yes or no, not gold itself.
            </p>
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
