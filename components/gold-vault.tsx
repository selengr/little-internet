'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Spot = {
  symbol?: string
  price?: string
  bid?: string
  ask?: string
  is_stale?: boolean
  computed_at?: string
  price_gram_24k?: string
  price_gram_22k?: string
  price_gram_21k?: string
  price_gram_20k?: string
  price_gram_18k?: string
  price_gram_16k?: string
  price_gram_14k?: string
  price_gram_10k?: string
  sources?: { display_name?: string; price?: string; informational?: boolean }[]
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
  futures: { contract: string; settle_usd: string; volume: number | null } | null
}

type TapeMarket = {
  id: string
  label: string
  value: number
  change_percent: number
  points: { date: string; value: number }[]
  decimals: number
  notice?: string
  source?: string
}

const KARATS = [
  { key: 'price_gram_24k', k: '24K', purity: '99.9%' },
  { key: 'price_gram_22k', k: '22K', purity: '91.6%' },
  { key: 'price_gram_21k', k: '21K', purity: '87.5%' },
  { key: 'price_gram_18k', k: '18K', purity: '75.0%' },
  { key: 'price_gram_14k', k: '14K', purity: '58.3%' },
  { key: 'price_gram_10k', k: '10K', purity: '41.7%' },
] as const

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

function buildSpark(closes: number[], w = 720, h = 180) {
  if (closes.length < 2) return null
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const pts = closes.map((v, i) => {
    const x = (i / (closes.length - 1)) * w
    const y = h - ((v - min) / range) * (h * 0.72) - h * 0.12
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fill = `${line} L${w},${h} L0,${h} Z`
  return { line, fill, last: pts[pts.length - 1], min, max }
}

export function GoldVault() {
  const [spot, setSpot] = useState<Spot | null>(null)
  const [bars, setBars] = useState<Bar[]>([])
  const [horizons, setHorizons] = useState<Horizon[]>([])
  const [tape, setTape] = useState<TapeMarket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawn, setDrawn] = useState(false)
  const gid = useId().replace(/:/g, '')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [snapRes, fwdRes, tapeRes] = await Promise.all([
          fetch('/api/gold?endpoint=snapshot', { cache: 'no-store' }),
          fetch('/api/gold?endpoint=forward', { cache: 'no-store' }),
          fetch('/api/gold?endpoint=tape', { cache: 'no-store' }),
        ])
        const snap = await snapRes.json()
        const fwd = fwdRes.ok ? await fwdRes.json() : null
        const tapeJson = tapeRes.ok ? await tapeRes.json() : null

        if (cancelled) return
        if (!snapRes.ok) throw new Error(snap.error ?? 'Gold unavailable')

        setSpot(snap.spot ?? null)
        const rawBars: Bar[] = Array.isArray(snap.bars?.bars) ? snap.bars.bars : []
        setBars([...rawBars].reverse())
        setHorizons(Array.isArray(fwd?.horizons) ? fwd.horizons : [])
        setTape(Array.isArray(tapeJson?.data?.markets) ? tapeJson.data.markets : [])
        setError(null)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const t = setInterval(load, 45_000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    if (!bars.length) return
    const id = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(id)
  }, [bars])

  const closes = useMemo(
    () =>
      bars
        .map(b => (b.close != null ? Number(b.close) : NaN))
        .filter(n => Number.isFinite(n)),
    [bars],
  )
  const spark = useMemo(() => buildSpark(closes), [closes])
  const price = spot?.price ? Number(spot.price) : null
  const firstClose = closes[0]
  const lastClose = closes[closes.length - 1]
  const windowChg =
    firstClose && lastClose && firstClose > 0 ? ((lastClose - firstClose) / firstClose) * 100 : null

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0a0704] text-[#f6ecd8]">
      {/* Atmosphere */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(212,175,55,0.22), transparent 55%), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(180,120,40,0.12), transparent 50%), radial-gradient(ellipse 50% 30% at 50% 100%, rgba(90,50,10,0.35), transparent 60%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 md:px-10">
        <Link
          href="/"
          className="text-[11px] uppercase tracking-[0.22em] text-[#c9a227]/55 transition-colors hover:text-[#e8d48b]"
        >
          ← Little Internet
        </Link>
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#c9a227]/40">Au · vault</p>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-16 md:px-10 md:pt-24">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-emerald-300/80">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Live spot
          </span>
          {spot?.is_stale ? (
            <span className="text-[10px] uppercase tracking-[0.18em] text-amber-300/70">Stale</span>
          ) : null}
        </div>

        <p
          className="text-[clamp(0.95rem,2vw,1.15rem)] tracking-[0.35em] uppercase text-[#c9a227]/55 mb-5"
          style={{ fontFamily: 'var(--font-gold-mark), system-ui, sans-serif' }}
        >
          Troy ounce · XAU / USD
        </p>

        {loading && !spot ? (
          <div className="h-24 w-[min(100%,28rem)] animate-pulse rounded-xl bg-[#c9a227]/10" />
        ) : error && !spot ? (
          <p className="text-rose-300/80 text-lg">{error}</p>
        ) : (
          <h1
            className="font-light leading-none tracking-tight tabular-nums text-[clamp(3.5rem,14vw,8.5rem)] text-transparent bg-clip-text"
            style={{
              backgroundImage:
                'linear-gradient(115deg, #fff6d6 0%, #e8c547 35%, #b8860b 70%, #f0e0a0 100%)',
              fontFamily: 'var(--font-gold-display), Georgia, serif',
            }}
          >
            {money(price)}
          </h1>
        )}

        <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-3">
          {windowChg != null ? (
            <p
              className={cn(
                'text-lg tabular-nums font-light',
                windowChg >= 0 ? 'text-emerald-300/85' : 'text-rose-300/85',
              )}
            >
              {windowChg >= 0 ? '↑' : '↓'} {Math.abs(windowChg).toFixed(2)}%
              <span className="ml-2 text-sm text-[#c9a227]/40">~30d</span>
            </p>
          ) : null}
          {spot?.bid && spot?.ask ? (
            <p className="text-sm tabular-nums text-[#c9a227]/45">
              Bid {money(spot.bid)} · Ask {money(spot.ask)}
            </p>
          ) : null}
          {spot?.computed_at ? (
            <p className="text-xs text-[#c9a227]/30">
              Observed {new Date(spot.computed_at).toUTCString()}
            </p>
          ) : null}
        </div>

        {/* Spark */}
        <div className="relative mt-14 overflow-hidden rounded-2xl border border-[#c9a227]/15 bg-[#120e08]/55 backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 pt-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#c9a227]/40">Pulse</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#c9a227]/30">Daily closes</p>
          </div>
          <svg
            className="w-full h-[160px] md:h-[200px]"
            viewBox="0 0 720 180"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`gf-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8c547" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#e8c547" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={`gs-${gid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c9a227" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#f0e0a0" stopOpacity="1" />
                <stop offset="100%" stopColor="#e8c547" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {spark ? (
              <>
                <path d={spark.fill} fill={`url(#gf-${gid})`} />
                <path
                  d={spark.line}
                  fill="none"
                  stroke={`url(#gs-${gid})`}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 2000,
                    strokeDashoffset: drawn ? 0 : 2000,
                    transition: 'stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
                <circle
                  cx={spark.last[0]}
                  cy={spark.last[1]}
                  r="4.5"
                  fill="#f6ecd8"
                  style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.4s ease 1.2s' }}
                />
              </>
            ) : null}
          </svg>
        </div>
      </section>

      {/* Karat ladder */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c9a227]/40 mb-2">Purity</p>
            <h2
              className="text-3xl md:text-4xl font-light tracking-tight text-[#f6ecd8]"
              style={{ fontFamily: 'var(--font-gold-display), Georgia, serif' }}
            >
              By the gram
            </h2>
          </div>
          <p className="text-xs text-[#c9a227]/35 max-w-[14rem] text-right leading-relaxed">
            Metal value only — not a jewellery retail quote.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {KARATS.map((row, i) => {
            const raw = spot?.[row.key as keyof Spot]
            const val = typeof raw === 'string' ? raw : null
            return (
              <div
                key={row.k}
                className="group relative overflow-hidden rounded-xl border border-[#c9a227]/14 bg-gradient-to-b from-[#1a140c] to-[#0e0a06] p-4 transition-transform duration-500 hover:-translate-y-1"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8c547]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="text-[11px] tracking-[0.2em] text-[#c9a227]/55">{row.k}</p>
                <p className="mt-3 text-xl tabular-nums font-light text-[#f6ecd8]">{money(val)}</p>
                <p className="mt-1 text-[10px] text-[#c9a227]/30">{row.purity} · /g</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Forward curve */}
      {horizons.length > 0 ? (
        <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 md:px-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c9a227]/40 mb-2">Futures</p>
          <h2
            className="text-3xl md:text-4xl font-light tracking-tight text-[#f6ecd8] mb-8"
            style={{ fontFamily: 'var(--font-gold-display), Georgia, serif' }}
          >
            Forward light
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {horizons.map(h => (
              <div
                key={h.expiry}
                className="snap-start shrink-0 w-[9.5rem] rounded-2xl border border-[#c9a227]/12 bg-[#120e08]/80 p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#c9a227]/40">
                  {h.futures?.contract ?? '—'}
                </p>
                <p className="mt-3 text-lg tabular-nums font-light text-[#f0e0a0]">
                  {money(h.futures?.settle_usd)}
                </p>
                <p className="mt-2 text-[11px] text-[#c9a227]/35">{h.expiry}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Dino morning tape */}
      <section className="relative z-10 border-t border-[#c9a227]/12 bg-[#080604]/80">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#c9a227]/40 mb-2">
                Morning tape
              </p>
              <h2
                className="text-3xl md:text-4xl font-light tracking-tight text-[#f6ecd8]"
                style={{ fontFamily: 'var(--font-gold-display), Georgia, serif' }}
              >
                Dino.markets
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#c9a227]/45">
                Cached display feed from the same publisher family — gold beside FX, refreshed for
                the board.
              </p>
            </div>
            <a
              href="https://dino.markets/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] text-[#c9a227]/55 hover:text-[#e8d48b] transition-colors"
            >
              Open Dino
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>

          {tape.length === 0 ? (
            <p className="text-sm text-[#c9a227]/35">Tape quiet — try again in a moment.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {tape.slice(0, 4).map(m => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-[#c9a227]/12 bg-[#100c08] p-5"
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a227]/40">{m.label}</p>
                  <p className="mt-3 text-2xl tabular-nums font-light text-[#f6ecd8]">
                    {m.value.toLocaleString(undefined, {
                      maximumFractionDigits: m.decimals,
                      minimumFractionDigits: Math.min(2, m.decimals),
                    })}
                  </p>
                  <p
                    className={cn(
                      'mt-2 text-sm tabular-nums',
                      m.change_percent >= 0 ? 'text-emerald-300/75' : 'text-rose-300/75',
                    )}
                  >
                    {m.change_percent >= 0 ? '+' : ''}
                    {m.change_percent.toFixed(2)}%
                  </p>
                  {m.source ? (
                    <p className="mt-3 text-[10px] text-[#c9a227]/28">{m.source}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Next: Crypto */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-[#c9a227]/18 bg-gradient-to-br from-[#1a140c] via-[#0f0b07] to-[#0a0704] p-8 md:p-12">
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(232,197,71,0.35), transparent 70%)',
            }}
          />
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#c9a227]/45 mb-3">Next</p>
          <h2
            className="max-w-lg text-3xl md:text-5xl font-light tracking-tight text-[#f6ecd8] leading-[1.1]"
            style={{ fontFamily: 'var(--font-gold-display), Georgia, serif' }}
          >
            From the vault to the digital board.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#c9a227]/50">
            Gold is the classic store. Crypto is the live pulse — continue to Bitcoin and the top
            coins.
          </p>
          <Link
            href="/crypto"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e8c547] px-6 py-3 text-sm font-medium text-[#1a1206] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Open crypto
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <p className="mt-8 text-center text-[11px] text-[#c9a227]/25">
          Indicative market data · not financial advice · via goldprice.dev &amp; dino.markets
        </p>
      </section>
    </div>
  )
}
