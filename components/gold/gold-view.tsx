'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoldBar, GoldCarat, GoldHorizon, GoldSpot } from '@/lib/goldprice'

type GoldPayload = {
  spot: GoldSpot
  carat: GoldCarat | null
  bars: GoldBar[]
  horizons: GoldHorizon[]
  spot_usd: string | null
}

type VoxRow = {
  id: string
  question: string
  category: string
  outcomes: string[]
  prices: number[]
  volume_24h: number
  url: string
}

const REFRESH_MS = 45_000

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

function pct(n: string | number | null | undefined) {
  const v = typeof n === 'string' ? Number(n) : n
  if (v == null || !Number.isFinite(v)) return null
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

function Sparkline({ bars }: { bars: GoldBar[] }) {
  const points = bars
    .map(b => Number(b.close))
    .filter(n => Number.isFinite(n))
  if (points.length < 2) return null

  const w = 320
  const h = 64
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - ((p - min) / span) * (h - 8) - 4
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const path = `M ${coords.join(' L ')}`
  const up = points[points.length - 1] >= points[0]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm h-16" aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={up ? 'var(--gd-up)' : 'var(--gd-down)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  )
}

function OddsBar({ yes }: { yes: number }) {
  const y = Math.round(Math.min(1, Math.max(0, yes)) * 100)
  return (
    <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full bg-[color:var(--gd-metal)] transition-[width] duration-700"
        style={{ width: `${y}%` }}
      />
    </div>
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
        setOdds(Array.isArray(voxJson.markets) ? voxJson.markets : [])
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

  const change = useMemo(() => {
    if (!data?.spot) return null
    if (data.spot.chp != null) return pct(data.spot.chp)
    const closes = data.bars.map(b => Number(b.close)).filter(Number.isFinite)
    if (closes.length < 2) return null
    const last = closes[closes.length - 1]
    const prev = closes[closes.length - 2]
    if (!prev) return null
    return pct(((last - prev) / prev) * 100)
  }, [data])

  const changeUp = change ? !change.startsWith('-') : true

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

  return (
    <div className="mx-auto max-w-5xl px-6 md:px-10">
      {/* Hero — one composition */}
      <header className="relative pt-6 pb-16 md:pb-24 text-center">
        <p
          className="text-[11px] uppercase tracking-[0.32em] mb-6"
          style={{ color: 'var(--gd-mute)' }}
        >
          Spot · Troy ounce
        </p>

        {loading && !data ? (
          <div className="flex justify-center py-16" aria-live="polite">
            <Loader2 className="size-6 animate-spin" style={{ color: 'var(--gd-metal)' }} />
          </div>
        ) : error && !data ? (
          <p className="text-sm py-16" style={{ color: 'var(--gd-mute)' }}>
            {error}
          </p>
        ) : (
          <>
            <h1
              className="font-[family-name:var(--font-gd-display)] font-light tracking-tight leading-[0.92] text-[clamp(3.5rem,12vw,7.5rem)] tabular-nums"
            >
              {money(data?.spot.price)}
            </h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
              <span className="tracking-wide" style={{ color: 'var(--gd-mute)' }}>
                XAU / USD
              </span>
              {change ? (
                <span
                  className="tabular-nums font-medium"
                  style={{ color: changeUp ? 'var(--gd-up)' : 'var(--gd-down)' }}
                >
                  {change}
                </span>
              ) : null}
              {data?.spot.is_stale ? (
                <span className="text-[11px] uppercase tracking-wider text-amber-600/80 dark:text-amber-300/80">
                  Stale
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-emerald-700/80 dark:text-emerald-300/80">
                  <span className="size-1.5 rounded-full bg-current" />
                  Live
                </span>
              )}
            </div>
            <div className="mt-10 flex justify-center">
              <Sparkline bars={data?.bars ?? []} />
            </div>
            <p className="mt-3 text-[11px] tracking-wide" style={{ color: 'var(--gd-mute)' }}>
              ~30 day close
            </p>
          </>
        )}
      </header>

      {/* Karat — one job */}
      {karats.length > 0 && (
        <section className="mb-20 md:mb-28">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.28em] mb-2"
                style={{ color: 'var(--gd-mute)' }}
              >
                Per gram
              </p>
              <h2 className="font-[family-name:var(--font-gd-display)] text-2xl md:text-3xl font-light tracking-tight">
                Karat ladder
              </h2>
            </div>
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden border"
            style={{ borderColor: 'var(--gd-line)', background: 'var(--gd-line)' }}
          >
            {karats.map(row => (
              <div
                key={row.k}
                className="px-5 py-6 text-center"
                style={{ background: 'var(--gd-panel)' }}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.2em] mb-2"
                  style={{ color: 'var(--gd-mute)' }}
                >
                  {row.k}
                </p>
                <p className="text-lg md:text-xl tabular-nums font-light tracking-tight">
                  {money(row.v)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px]" style={{ color: 'var(--gd-mute)' }}>
            Metal value only — not a jewelry retail quote.
          </p>
        </section>
      )}

      {/* Forward — quiet strip */}
      {(data?.horizons?.length ?? 0) > 0 && (
        <section className="mb-20 md:mb-28">
          <p
            className="text-[10px] uppercase tracking-[0.28em] mb-2"
            style={{ color: 'var(--gd-mute)' }}
          >
            Futures curve
          </p>
          <h2 className="font-[family-name:var(--font-gd-display)] text-2xl md:text-3xl font-light tracking-tight mb-6">
            Ahead
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {data!.horizons.map(h => (
              <div
                key={h.expiry}
                className="min-w-[9.5rem] rounded-2xl border px-4 py-4"
                style={{ borderColor: 'var(--gd-line)', background: 'var(--gd-panel)' }}
              >
                <p className="text-[10px] tabular-nums mb-2" style={{ color: 'var(--gd-mute)' }}>
                  {h.expiry}
                </p>
                <p className="text-lg tabular-nums font-light">{money(h.futures?.settle_usd)}</p>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--gd-mute)' }}>
                  {h.futures?.contract}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VoxOdds */}
      <section className="mb-16 md:mb-24">
        <div className="mb-6">
          <p
            className="text-[10px] uppercase tracking-[0.28em] mb-2"
            style={{ color: 'var(--gd-mute)' }}
          >
            VoxOdds · Polymarket
          </p>
          <h2 className="font-[family-name:var(--font-gd-display)] text-2xl md:text-3xl font-light tracking-tight">
            What the crowd prices
          </h2>
          <p className="mt-2 text-sm max-w-md" style={{ color: 'var(--gd-mute)' }}>
            Live crypto prediction markets — odds, not advice.
          </p>
        </div>

        {odds.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--gd-mute)' }}>
            Odds quietly offline right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {odds.slice(0, 5).map(m => {
              const yes = m.prices[0] ?? 0
              const label = m.outcomes?.[0] ?? 'Yes'
              return (
                <li key={m.id}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-colors hover:border-[color:var(--gd-metal)]/40"
                    style={{ borderColor: 'var(--gd-line)', background: 'var(--gd-panel)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] leading-snug font-light">{m.question}</p>
                      <ArrowUpRight
                        className="size-4 shrink-0 opacity-35 group-hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--gd-metal)' }}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <OddsBar yes={yes} />
                      </div>
                      <span className="text-sm tabular-nums shrink-0" style={{ color: 'var(--gd-metal)' }}>
                        {Math.round(yes * 100)}% {label}
                      </span>
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-4 text-[11px]" style={{ color: 'var(--gd-mute)' }}>
          Data via{' '}
          <a href="https://voxodds.com" className="underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            voxodds.com
          </a>
          . Attribute Polymarket / Kalshi.
        </p>
      </section>

      {/* Surprise CTA → crypto */}
      <section className="relative mb-10 overflow-hidden rounded-[1.75rem] border" style={{ borderColor: 'var(--gd-line)' }}>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(154,123,60,0.22) 0%, transparent 42%, rgba(143,184,0,0.18) 100%)',
          }}
        />
        <div className="relative px-6 py-12 md:px-12 md:py-16 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-md">
            <p
              className="text-[10px] uppercase tracking-[0.28em] mb-3"
              style={{ color: 'var(--gd-mute)' }}
            >
              Next room
            </p>
            <h2 className="font-[family-name:var(--font-gd-display)] text-3xl md:text-4xl font-light tracking-tight leading-tight">
              Leave the vault.
              <br />
              Enter the tape.
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--gd-mute)' }}>
              Live Bitcoin, Ethereum, and the rest of the market — still pulsing.
            </p>
          </div>
          <Link
            href="/crypto"
            className={cn(
              'inline-flex items-center justify-center gap-2 self-center md:self-auto',
              'rounded-full px-6 py-3.5 text-sm font-medium tracking-wide',
              'bg-[#1c1916] text-[#f7f5f1] dark:bg-[#e8e6e1] dark:text-[#2f3437]',
              'transition-transform hover:scale-[1.03] active:scale-[0.98]',
            )}
          >
            Open crypto
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>

      <p className="pb-10 text-center text-[10px] tracking-wide" style={{ color: 'var(--gd-mute)' }}>
        Prices via goldprice.dev · educational only
      </p>
    </div>
  )
}
