'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import { cn } from '@/lib/utils'

type Spot = {
  symbol?: string
  quote_currency?: string
  unit?: string
  price?: string
  bid?: string
  ask?: string
  is_stale?: boolean
  computed_at?: string
  ch?: string
  chp?: string
  prev_close_price?: string
  price_gram_24k?: string
  price_gram_22k?: string
  price_gram_21k?: string
  price_gram_18k?: string
  price_gram_14k?: string
}

type Carat = {
  currency?: string
  timestamp?: string
  price_gram_24k?: string
  price_gram_22k?: string
  price_gram_21k?: string
  price_gram_20k?: string
  price_gram_18k?: string
  price_gram_16k?: string
  price_gram_14k?: string
  price_gram_10k?: string
}

type Bar = {
  bar_start: string
  open: string | null
  high: string | null
  low: string | null
  close: string | null
  is_closed: boolean
}

type Horizon = {
  expiry: string
  futures: { settle_usd: string; contract: string } | null
}

type VoxMarket = {
  id: string
  question: string
  category?: string
  outcomes?: string[]
  prices?: number[]
  volume_24h?: number
  voxodds_url?: string
  polymarket_url?: string
}

function money(n: string | number | null | undefined, digits = 2) {
  if (n == null || n === '') return '—'
  const v = typeof n === 'number' ? n : Number(n)
  if (!Number.isFinite(v)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v)
}

function num(n: string | number | null | undefined) {
  if (n == null || n === '') return null
  const v = typeof n === 'number' ? n : Number(n)
  return Number.isFinite(v) ? v : null
}

function pctLabel(chp: string | null | undefined) {
  const v = num(chp)
  if (v == null) return null
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}%`
}

function Sparkline({ bars }: { bars: Bar[] }) {
  const points = useMemo(() => {
    const closed = [...bars]
      .filter(b => b.close != null)
      .reverse()
      .map(b => Number(b.close))
      .filter(n => Number.isFinite(n))
    if (closed.length < 2) return null
    const min = Math.min(...closed)
    const max = Math.max(...closed)
    const span = max - min || 1
    const w = 320
    const h = 72
    const step = w / (closed.length - 1)
    const d = closed
      .map((c, i) => {
        const x = i * step
        const y = h - ((c - min) / span) * (h - 8) - 4
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    const up = closed[closed.length - 1] >= closed[0]
    return { d, up, w, h }
  }, [bars])

  if (!points) {
    return <div className="h-[72px] rounded-xl bg-black/[0.03] dark:bg-white/[0.04]" />
  }

  return (
    <svg viewBox={`0 0 ${points.w} ${points.h}`} className="w-full h-[72px]" aria-hidden>
      <path
        d={points.d}
        fill="none"
        stroke={points.up ? 'var(--gd-up)' : 'var(--gd-down)'}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ForwardStrip({ horizons, spot }: { horizons: Horizon[]; spot: number | null }) {
  const rows = horizons.filter(h => h.futures?.settle_usd).slice(0, 5)
  if (!rows.length) return null
  const settles = rows.map(r => Number(r.futures!.settle_usd))
  const min = Math.min(...(spot != null ? [...settles, spot] : settles))
  const max = Math.max(...(spot != null ? [...settles, spot] : settles))
  const span = max - min || 1

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-16">
        {rows.map(r => {
          const v = Number(r.futures!.settle_usd)
          const h = 18 + ((v - min) / span) * 40
          return (
            <div key={r.expiry} className="flex-1 flex flex-col justify-end items-center gap-1.5">
              <div
                className="w-full max-w-[48px] rounded-t-md bg-[color:var(--gd-metal)]/80"
                style={{ height: h }}
              />
              <span className="text-[10px] tabular-nums text-[color:var(--gd-mute)]">
                {r.expiry.slice(5)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const KARATS: { key: keyof Carat; label: string }[] = [
  { key: 'price_gram_24k', label: '24K' },
  { key: 'price_gram_22k', label: '22K' },
  { key: 'price_gram_21k', label: '21K' },
  { key: 'price_gram_18k', label: '18K' },
  { key: 'price_gram_14k', label: '14K' },
  { key: 'price_gram_10k', label: '10K' },
]

export function GoldShell({ fontVars }: { fontVars: string }) {
  const [gold, setGold] = useState<Spot | null>(null)
  const [silver, setSilver] = useState<Spot | null>(null)
  const [carat, setCarat] = useState<Carat | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [horizons, setHorizons] = useState<Horizon[]>([])
  const [markets, setMarkets] = useState<VoxMarket[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [snapRes, barsRes, voxRes] = await Promise.all([
        fetch('/api/gold?action=snapshot&currency=USD', { cache: 'no-store' }),
        fetch('/api/gold?action=bars', { cache: 'no-store' }),
        fetch('/api/voxodds?action=markets&category=Crypto&limit=6', { cache: 'no-store' }),
      ])
      const snap = await snapRes.json()
      const barsJson = await barsRes.json()
      const vox = await voxRes.json()

      if (!snapRes.ok) throw new Error(snap.error || 'Gold snapshot failed')
      setGold(snap.gold ?? null)
      setSilver(snap.silver ?? null)
      setCarat(snap.carat ?? null)
      setHorizons(Array.isArray(snap.forward?.horizons) ? snap.forward.horizons : [])
      setBars(Array.isArray(barsJson.bars) ? barsJson.bars : [])
      const list = Array.isArray(vox.markets)
        ? vox.markets
        : Array.isArray(vox.trending)
          ? vox.trending
          : []
      setMarkets(list.slice(0, 6))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load gold')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = window.setInterval(load, 45_000)
    return () => window.clearInterval(t)
  }, [load])

  const price = num(gold?.price)
  const chp = pctLabel(gold?.chp)
  const chUp = (num(gold?.chp) ?? 0) >= 0
  const spotN = price

  return (
    <main
      className={`${fontVars} gold-shell relative min-h-screen overflow-x-clip bg-[var(--gd-bg)] text-[var(--gd-fg)]`}
    >
      <style>{`
        .gold-shell {
          --gd-bg: #f8f8f8;
          --gd-fg: #37352f;
          --gd-mute: rgba(55, 53, 47, 0.52);
          --gd-panel: rgba(255, 255, 255, 0.78);
          --gd-line: rgba(55, 53, 47, 0.1);
          --gd-metal: #b08d57;
          --gd-metal-ink: #3a2e1a;
          --gd-up: #1a7a4c;
          --gd-down: #c23b2e;
          --gd-wash:
            radial-gradient(ellipse 55% 40% at 12% 0%, rgba(176, 141, 87, 0.16), transparent 55%),
            radial-gradient(ellipse 45% 35% at 100% 10%, rgba(55, 53, 47, 0.04), transparent 50%),
            linear-gradient(180deg, #fbfaf7 0%, #f8f8f8 45%, #f3f1ec 100%);
        }
        :is(html.dark, .dark) .gold-shell {
          --gd-bg: #2f3437;
          --gd-fg: hsla(0, 0%, 100%, 0.92);
          --gd-mute: hsla(0, 0%, 100%, 0.5);
          --gd-panel: rgba(55, 60, 65, 0.88);
          --gd-line: hsla(0, 0%, 100%, 0.1);
          --gd-metal: #d4b483;
          --gd-metal-ink: #1c1812;
          --gd-up: #3dd68c;
          --gd-down: #ff6b5a;
          --gd-wash:
            radial-gradient(ellipse 50% 38% at 10% 0%, rgba(212, 180, 131, 0.12), transparent 52%),
            radial-gradient(ellipse 40% 30% at 100% 8%, rgba(255, 255, 255, 0.03), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 50%, #2c3134 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--gd-wash)' }} />
      </div>

      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="inline-flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--gd-metal)] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--gd-metal)]" />
            </span>
            GOLD
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 tracking-wide"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pt-28 pb-8 md:pt-32 md:pb-10">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--gd-mute)] mb-3">
          Spot · Troy ounce
        </p>
        <h1
          className="text-[clamp(2.6rem,9vw,4.5rem)] font-light leading-[0.95] tracking-tight"
          style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
        >
          Gold
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--gd-mute)]">
          Live XAU price — quiet, precise, and refreshed every few seconds.
        </p>

        <div className="mt-10 md:mt-12">
          {error ? (
            <p className="text-sm text-[color:var(--gd-down)]">{error}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <p
                  className={cn(
                    'text-[clamp(2.75rem,8vw,4.25rem)] font-light tabular-nums tracking-tight leading-none',
                    loading && !gold && 'opacity-40',
                  )}
                  style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
                >
                  {loading && !gold ? '—' : money(gold?.price, 2)}
                </p>
                {chp ? (
                  <span
                    className="mb-1.5 text-sm tabular-nums font-medium"
                    style={{ color: chUp ? 'var(--gd-up)' : 'var(--gd-down)' }}
                  >
                    {chp} today
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[12px] text-[color:var(--gd-mute)]">
                {gold?.is_stale ? 'Stale quote · ' : 'Live · '}
                USD / troy oz
                {gold?.computed_at
                  ? ` · ${new Date(gold.computed_at).toLocaleString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : ''}
              </p>
            </>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[color:var(--gd-line)] bg-[color:var(--gd-panel)] backdrop-blur-sm px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--gd-mute)]">Silver</p>
            <p className="mt-1.5 text-xl font-light tabular-nums tracking-tight">
              {money(silver?.price, 3)}
            </p>
          </div>
          <div className="rounded-2xl border border-[color:var(--gd-line)] bg-[color:var(--gd-panel)] backdrop-blur-sm px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--gd-mute)]">
              24K / gram
            </p>
            <p className="mt-1.5 text-xl font-light tabular-nums tracking-tight">
              {money(carat?.price_gram_24k ?? gold?.price_gram_24k, 2)}
            </p>
          </div>
        </div>

        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2
              className="text-2xl font-light tracking-tight"
              style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
            >
              Recent path
            </h2>
            <span className="text-[11px] text-[color:var(--gd-mute)]">~30 days</span>
          </div>
          <div className="rounded-2xl border border-[color:var(--gd-line)] bg-[color:var(--gd-panel)] backdrop-blur-sm px-4 py-4">
            <Sparkline bars={bars} />
          </div>
        </section>

        <section className="mt-12">
          <h2
            className="text-2xl font-light tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
          >
            By karat
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {KARATS.map(k => (
              <div
                key={k.key}
                className="rounded-xl border border-[color:var(--gd-line)] bg-[color:var(--gd-panel)] px-2.5 py-3 text-center"
              >
                <p className="text-[10px] tracking-[0.14em] uppercase text-[color:var(--gd-mute)]">
                  {k.label}
                </p>
                <p className="mt-1 text-[13px] tabular-nums font-medium">
                  {money(carat?.[k.key] as string | undefined, 2)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[color:var(--gd-mute)]">Per gram · metal value, not retail jewelry</p>
        </section>

        {horizons.some(h => h.futures) ? (
          <section className="mt-12">
            <h2
              className="text-2xl font-light tracking-tight mb-4"
              style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
            >
              Forward curve
            </h2>
            <div className="rounded-2xl border border-[color:var(--gd-line)] bg-[color:var(--gd-panel)] backdrop-blur-sm px-4 py-5">
              <ForwardStrip horizons={horizons} spot={spotN} />
            </div>
          </section>
        ) : null}
      </div>

      {/* VoxOdds */}
      <section className="border-t border-[color:var(--gd-line)]">
        <div className="mx-auto max-w-3xl px-5 py-14 md:py-16">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--gd-mute)] mb-2">
            Also watching
          </p>
          <h2
            className="text-[clamp(1.75rem,4vw,2.4rem)] font-light tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
          >
            Prediction markets
          </h2>
          <p className="mt-2 text-sm text-[color:var(--gd-mute)] max-w-md">
            Live odds from VoxOdds (Polymarket &amp; Kalshi) — crypto questions people are betting on.
          </p>

          <div className="mt-8 space-y-2.5">
            {markets.length === 0 && !loading ? (
              <p className="text-sm text-[color:var(--gd-mute)]">No markets right now.</p>
            ) : (
              markets.map(m => {
                const yes = m.prices?.[0]
                const pct = yes != null ? Math.round(yes * 100) : null
                const href = m.voxodds_url || m.polymarket_url || `https://voxodds.com/market/${m.id}`
                return (
                  <a
                    key={m.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--gd-line)] bg-[color:var(--gd-panel)] px-4 py-3.5 transition-colors hover:border-[color:var(--gd-metal)]/45"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] leading-snug line-clamp-2">{m.question}</p>
                      {m.category ? (
                        <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--gd-mute)]">
                          {m.category}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="text-lg tabular-nums font-medium tracking-tight"
                        style={{ color: 'var(--gd-metal)' }}
                      >
                        {pct != null ? `${pct}%` : '—'}
                      </p>
                      <p className="text-[10px] text-[color:var(--gd-mute)] inline-flex items-center gap-0.5">
                        Yes
                        <ArrowUpRight className="size-3 opacity-50 group-hover:opacity-100" />
                      </p>
                    </div>
                  </a>
                )
              })
            )}
          </div>
          <p className="mt-4 text-[11px] text-[color:var(--gd-mute)]">
            Data via{' '}
            <a
              href="https://voxodds.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              voxodds.com
            </a>
            .
          </p>
        </div>
      </section>

      {/* Next: Crypto */}
      <div className="border-t border-[color:var(--gd-line)]">
        <div className="mx-auto max-w-3xl px-5 py-12 md:py-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--gd-mute)]">
              Continue
            </p>
            <p
              className="mt-1 text-2xl font-light tracking-tight"
              style={{ fontFamily: 'var(--font-gd-display), Georgia, serif' }}
            >
              Next up: Crypto
            </p>
            <p className="mt-1 text-sm text-[color:var(--gd-mute)]">
              Live Bitcoin, Ethereum, and the top coins.
            </p>
          </div>
          <Link
            href="/crypto"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#37352f] text-[#f7f6f3] dark:bg-[#e8e6e1] dark:text-[#2f3437] px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Open crypto
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}
