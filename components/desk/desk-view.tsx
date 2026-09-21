'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CandleChart } from '@/components/desk/candle-chart'
import { formatPct, formatUsd } from '@/lib/crypto-format'
import { cn } from '@/lib/utils'
import type { Bias, OhlcBar, TapeRead } from '@/lib/desk-indicators'
import { Activity, Keyboard, RefreshCw } from 'lucide-react'

type Interval = '1h' | '4h' | '1d' | '1w'
type Zoom = 50 | 100 | 0

type WatchItem = {
  id: string
  symbol: string
  name: string
  image: string | null
  price: number | null
  change1h: number | null
  change24h: number | null
  change7d: number | null
  sparkline?: number[]
}

type DeskPayload = {
  asset: { id: string; symbol: string; name: string; image: string | null }
  interval: string
  updatedAt?: number
  price: number | null
  change1h: number | null
  change24h: number | null
  change7d: number | null
  high24h: number | null
  low24h: number | null
  volume24h: number | null
  marketCap: number | null
  sessionChange: number | null
  sessionHigh: number | null
  sessionLow: number | null
  barCount: number
  bars: OhlcBar[]
  watchlist: WatchItem[]
  indicators: {
    ema20: (number | null)[]
    ema50: (number | null)[]
    rsi: (number | null)[]
    macd: (number | null)[]
    macdSignal: (number | null)[]
    macdHist: (number | null)[]
    atr: (number | null)[]
  }
  tape: TapeRead
  onchain?: {
    status: 'live' | 'unavailable' | 'unconfigured' | 'coming_soon'
    provider: string
    message: string
    trades: {
      time: string
      side: 'buy' | 'sell' | 'swap'
      protocol: string
      baseSymbol: string
      quoteSymbol: string
      amount: string
      amountUsd: string | null
      priceUsd: string | null
      txHash: string | null
      network: string
    }[]
    fetchedAt: number | null
  }
  disclaimer: string
}

const INTERVALS: { key: Interval; label: string }[] = [
  { key: '1h', label: '1H' },
  { key: '4h', label: '4H' },
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
]

const PREFS_KEY = 'desk-prefs-v1'

const biasMeta: Record<Bias, { label: string; tone: string; bar: string }> = {
  constructive: {
    label: 'Buy pressure',
    tone: 'text-emerald-400',
    bar: 'bg-emerald-400',
  },
  neutral: { label: 'Wait & watch', tone: 'text-white/55', bar: 'bg-white/40' },
  cautious: { label: 'Sell pressure', tone: 'text-rose-400', bar: 'bg-rose-400' },
}

function pctClass(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 'text-white/40'
  return n >= 0 ? 'text-emerald-400' : 'text-rose-400'
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] uppercase tracking-[0.14em] text-white/35 font-mono">{label}</p>
      <p className={cn('mt-0.5 text-[12px] tabular-nums font-mono truncate', accent ?? 'text-white/85')}>
        {value}
      </p>
    </div>
  )
}

function MiniSpark({ data, up }: { data: number[]; up: boolean }) {
  if (!data?.length) return <span className="w-12 h-4 block" />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 48
  const h = 16
  const d = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 2) - 1
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} className="shrink-0 opacity-90" aria-hidden>
      <path d={d} fill="none" stroke={up ? '#34d399' : '#fb7185'} strokeWidth="1.25" />
    </svg>
  )
}

function sliceSeries<T>(arr: T[], start: number): T[] {
  return arr.slice(start)
}

export function DeskView() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [asset, setAsset] = useState(() => searchParams.get('asset') || 'bitcoin')
  const [interval, setIntervalKey] = useState<Interval>(() => {
    const iv = searchParams.get('interval')
    return iv === '1h' || iv === '4h' || iv === '1d' || iv === '1w' ? iv : '1d'
  })
  const [zoom, setZoom] = useState<Zoom>(100)
  const [data, setData] = useState<DeskPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const [showHints, setShowHints] = useState(false)
  const prevPrice = useRef<number | null>(null)
  const hydrated = useRef(false)

  const [showEma, setShowEma] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [showRsi, setShowRsi] = useState(true)
  const [showMacd, setShowMacd] = useState(true)

  // Restore prefs once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (!raw) return
      const p = JSON.parse(raw) as Partial<{
        showEma: boolean
        showVolume: boolean
        showRsi: boolean
        showMacd: boolean
        zoom: Zoom
        asset: string
        interval: Interval
      }>
      if (typeof p.showEma === 'boolean') setShowEma(p.showEma)
      if (typeof p.showVolume === 'boolean') setShowVolume(p.showVolume)
      if (typeof p.showRsi === 'boolean') setShowRsi(p.showRsi)
      if (typeof p.showMacd === 'boolean') setShowMacd(p.showMacd)
      if (p.zoom === 50 || p.zoom === 100 || p.zoom === 0) setZoom(p.zoom)
      if (!searchParams.get('asset') && p.asset) setAsset(p.asset)
      if (!searchParams.get('interval') && (p.interval === '1h' || p.interval === '4h' || p.interval === '1d' || p.interval === '1w')) {
        setIntervalKey(p.interval)
      }
    } catch {
      /* ignore */
    } finally {
      hydrated.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist prefs + sync shareable URL (asset + interval only)
  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ asset, interval, zoom, showEma, showVolume, showRsi, showMacd }),
      )
    } catch {
      /* ignore */
    }

    const currentAsset = searchParams.get('asset')
    const currentInterval = searchParams.get('interval')
    if (currentAsset === asset && currentInterval === interval) return

    const params = new URLSearchParams()
    params.set('asset', asset)
    params.set('interval', interval)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only push URL when asset/interval change
  }, [asset, interval, zoom, showEma, showVolume, showRsi, showMacd, pathname, router])

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/desk?asset=${asset}&interval=${interval}`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to load')

        if (prevPrice.current != null && json.price != null && json.price !== prevPrice.current) {
          setFlash(json.price > prevPrice.current ? 'up' : 'down')
          window.setTimeout(() => setFlash(null), 700)
        }
        prevPrice.current = json.price ?? null
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    },
    [asset, interval],
  )

  useEffect(() => {
    void load()
    const t = setInterval(() => void load(true), 45_000)
    return () => clearInterval(t)
  }, [load])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowHints(v => !v)
        return
      }
      if (e.key === '1') setIntervalKey('1h')
      if (e.key === '2') setIntervalKey('4h')
      if (e.key === '3') setIntervalKey('1d')
      if (e.key === '4') setIntervalKey('1w')
      if (e.key === 'r' || e.key === 'R') void load()
      if (e.key === 'e') setShowEma(v => !v)
      if (e.key === 'v') setShowVolume(v => !v)
      if (e.key === 'i') setShowRsi(v => !v)
      if (e.key === 'm') setShowMacd(v => !v)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const list = data?.watchlist ?? []
        if (!list.length) return
        e.preventDefault()
        const idx = list.findIndex(w => w.id === asset)
        const next =
          e.key === 'ArrowDown'
            ? list[(idx + 1 + list.length) % list.length]
            : list[(idx - 1 + list.length) % list.length]
        if (next) setAsset(next.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [asset, data?.watchlist, load])

  const view = useMemo(() => {
    if (!data) return null
    const n = data.bars.length
    const take = zoom === 0 ? n : Math.min(zoom, n)
    const start = Math.max(0, n - take)
    return {
      bars: sliceSeries(data.bars, start),
      ema20: sliceSeries(data.indicators.ema20, start),
      ema50: sliceSeries(data.indicators.ema50, start),
      rsi: sliceSeries(data.indicators.rsi, start),
      macd: sliceSeries(data.indicators.macd, start),
      macdSignal: sliceSeries(data.indicators.macdSignal, start),
      macdHist: sliceSeries(data.indicators.macdHist, start),
    }
  }, [data, zoom])

  const last = data?.bars.length ? data.bars.length - 1 : -1
  const rsi = last >= 0 ? data?.indicators.rsi[last] : null
  const score = data?.tape.score ?? 0
  const scorePct = ((score + 5) / 10) * 100

  const rangePos =
    data?.low24h != null &&
    data?.high24h != null &&
    data.price != null &&
    data.high24h !== data.low24h
      ? ((data.price - data.low24h) / (data.high24h - data.low24h)) * 100
      : 50

  const updatedLabel = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-5 space-y-3">
      {/* Market strip */}
      <div className="rounded-xl border border-white/10 bg-[#12161b]/95 backdrop-blur-md overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            {data?.asset.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.asset.image} alt="" className="size-7 rounded-full" />
            ) : (
              <div className="size-7 rounded-full bg-white/10" />
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-white tracking-wide">
                {data?.asset.symbol ?? '—'}
                <span className="text-white/35 font-normal"> / USDT</span>
              </p>
              <p className="text-[10px] text-white/40 truncate">{data?.asset.name ?? 'Loading…'}</p>
            </div>
          </div>

          <div
            className={cn(
              'transition-colors duration-500 rounded-lg px-2 py-1',
              flash === 'up' && 'bg-emerald-500/15',
              flash === 'down' && 'bg-rose-500/15',
            )}
          >
            <p
              className={cn(
                'text-[clamp(1.35rem,3vw,1.75rem)] font-semibold tabular-nums tracking-tight font-mono leading-none',
                flash === 'up' && 'text-emerald-400',
                flash === 'down' && 'text-rose-400',
                !flash && 'text-white',
              )}
            >
              {loading && !data ? '—' : formatUsd(data?.price)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn('text-sm tabular-nums font-mono font-medium', pctClass(data?.change24h))}>
              {data?.change24h != null ? formatPct(data.change24h) : '—'}
            </span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">24h</span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-white/35">
            <span>
              Session{' '}
              <span className={pctClass(data?.sessionChange)}>
                {data?.sessionChange != null ? formatPct(data.sessionChange) : '—'}
              </span>
            </span>
            <span className="text-white/15">|</span>
            <span>{data?.barCount ?? '—'} bars</span>
            {updatedLabel ? (
              <>
                <span className="text-white/15">|</span>
                <span>Upd {updatedLabel}</span>
              </>
            ) : null}
          </div>

          <div className="hidden md:flex items-center gap-2 ml-auto text-[10px] uppercase tracking-[0.16em] text-emerald-400/90">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Live desk
          </div>

          <button
            type="button"
            onClick={() => setShowHints(v => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-white/50 hover:text-white hover:border-white/25 transition-colors"
          >
            <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-4 py-3">
          <Stat label="24h High" value={formatUsd(data?.high24h)} accent="text-emerald-400/90" />
          <Stat label="24h Low" value={formatUsd(data?.low24h)} accent="text-rose-400/90" />
          <Stat label="24h Volume" value={formatUsd(data?.volume24h, true)} />
          <Stat label="Market Cap" value={formatUsd(data?.marketCap, true)} />
          <Stat
            label="Chart high"
            value={formatUsd(data?.sessionHigh)}
            accent="text-emerald-400/80"
          />
          <Stat label="Chart low" value={formatUsd(data?.sessionLow)} accent="text-rose-400/80" />
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-white/30 font-mono mb-1">
            <span>24h range position</span>
            <span>{rangePos.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 opacity-80"
              style={{ width: `${Math.min(100, Math.max(4, rangePos))}%` }}
            />
          </div>
        </div>
      </div>

      {showHints ? (
        <div className="rounded-lg border border-white/10 bg-[#12161b] px-3 py-2 text-[10px] font-mono text-white/45 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <kbd className="text-white/70">1–4</kbd> timeframe
          </span>
          <span>
            <kbd className="text-white/70">↑↓</kbd> switch market
          </span>
          <span>
            <kbd className="text-white/70">E V I M</kbd> toggle indicators
          </span>
          <span>
            <kbd className="text-white/70">R</kbd> refresh
          </span>
          <span>
            <kbd className="text-white/70">?</kbd> close
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 px-3 py-2 text-xs font-mono">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Watchlist */}
        <aside className="col-span-12 lg:col-span-2 rounded-xl border border-white/10 bg-[#12161b]/95 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">Markets</p>
            <Activity className="size-3 text-white/25" />
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-white/[0.04]">
            {(data?.watchlist ?? []).map(item => {
              const active = item.id === asset
              const up = (item.change24h ?? 0) >= 0
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAsset(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 text-left transition-colors',
                    active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]',
                  )}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="size-5 rounded-full shrink-0" />
                  ) : (
                    <span className="size-5 rounded-full bg-white/10 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-1">
                      <span className="text-[12px] text-white font-medium leading-tight">
                        {item.symbol}
                      </span>
                      <span className={cn('text-[10px] tabular-nums font-mono', pctClass(item.change24h))}>
                        {item.change24h != null ? formatPct(item.change24h) : '—'}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-1">
                      <span className="text-[10px] text-white/35 tabular-nums font-mono truncate">
                        {formatUsd(item.price)}
                      </span>
                      {item.sparkline?.length ? (
                        <MiniSpark data={item.sparkline} up={up} />
                      ) : null}
                    </span>
                  </span>
                </button>
              )
            })}
            {loading && !data ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : null}
          </div>
        </aside>

        {/* Chart */}
        <section className="col-span-12 lg:col-span-7 rounded-xl border border-white/10 bg-[#12161b]/95 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
            <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/20">
              {INTERVALS.map(iv => (
                <button
                  key={iv.key}
                  type="button"
                  onClick={() => setIntervalKey(iv.key)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[10px] font-mono tracking-wide transition-colors',
                    interval === iv.key
                      ? 'bg-white text-stone-900'
                      : 'text-white/45 hover:text-white',
                  )}
                >
                  {iv.label}
                </button>
              ))}
            </div>

            <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/20">
              {(
                [
                  [50, '50'],
                  [100, '100'],
                  [0, 'All'],
                ] as const
              ).map(([z, label]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-mono transition-colors',
                    zoom === z ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 ml-auto">
              {(
                [
                  ['EMA', showEma, setShowEma],
                  ['Vol', showVolume, setShowVolume],
                  ['RSI', showRsi, setShowRsi],
                  ['MACD', showMacd, setShowMacd],
                ] as const
              ).map(([label, on, set]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => set(!on)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[9px] uppercase tracking-wider border font-mono transition-colors',
                    on
                      ? 'border-amber-400/40 text-amber-300 bg-amber-400/10'
                      : 'border-white/10 text-white/35 hover:text-white/60',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 pt-2">
            {loading && !data ? (
              <div className="h-[420px] rounded-lg bg-white/[0.03] animate-pulse" />
            ) : view ? (
              <CandleChart
                bars={view.bars}
                ema20={view.ema20}
                ema50={view.ema50}
                rsi={view.rsi}
                macd={view.macd}
                macdSignal={view.macdSignal}
                macdHist={view.macdHist}
                showEma={showEma}
                showVolume={showVolume}
                showRsi={showRsi}
                showMacd={showMacd}
              />
            ) : null}
          </div>
        </section>

        {/* Decision rail */}
        <aside className="col-span-12 lg:col-span-3 space-y-3">
          <div className="rounded-xl border border-white/10 bg-[#12161b]/95 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-mono">
                Signal meter
              </p>
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wider font-mono',
                  biasMeta[data?.tape.bias ?? 'neutral'].tone,
                )}
              >
                {biasMeta[data?.tape.bias ?? 'neutral'].label}
              </span>
            </div>

            <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-700',
                  biasMeta[data?.tape.bias ?? 'neutral'].bar,
                )}
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-wider mb-4">
              <span>Cautious</span>
              <span>Neutral</span>
              <span>Constructive</span>
            </div>

            <p className="text-[13px] leading-snug text-white/90 font-light">
              {data?.tape.headline ?? 'Loading tape…'}
            </p>
            <ul className="mt-3 space-y-2">
              {(data?.tape.bullets ?? []).map((b, i) => (
                <li
                  key={i}
                  className="text-[11px] leading-relaxed text-white/50 pl-2.5 border-l border-white/15"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#12161b]/95 p-4 grid grid-cols-2 gap-3">
            <Stat label="RSI (14)" value={rsi != null ? rsi.toFixed(1) : '—'} />
            <Stat
              label="ATR %"
              value={data?.tape.atrPct != null ? `${data.tape.atrPct.toFixed(2)}%` : '—'}
            />
            <Stat label="Support" value={formatUsd(data?.tape.support)} accent="text-emerald-400/80" />
            <Stat
              label="Resistance"
              value={formatUsd(data?.tape.resistance)}
              accent="text-rose-400/80"
            />
          </div>

          {/* On-chain tape — Bitquery realtime */}
          <div
            className={cn(
              'rounded-xl border p-4',
              data?.onchain?.status === 'live'
                ? 'border-sky-400/30 bg-sky-400/[0.05]'
                : 'border-dashed border-sky-400/25 bg-sky-400/[0.04]',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-sky-300/70 font-mono">
                On-chain tape
              </p>
              <span className="text-[9px] uppercase tracking-wider text-sky-300/50 font-mono">
                {data?.onchain?.status === 'live' ? 'Live · Bitquery' : 'Bitquery'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/45 mb-3">
              {data?.onchain?.message ??
                'Live DEX swaps will appear here after BITQUERY_ACCESS_TOKEN is set.'}
            </p>

            {data?.onchain?.status === 'live' && data.onchain.trades.length > 0 ? (
              <div className="max-h-[220px] overflow-y-auto space-y-0 divide-y divide-white/[0.05]">
                {data.onchain.trades.map((t, i) => {
                  const when = t.time
                    ? new Date(t.time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '--:--'
                  const explorer =
                    t.network === 'Solana' && t.txHash
                      ? `https://solscan.io/tx/${t.txHash}`
                      : t.network === 'BNB Chain' && t.txHash
                        ? `https://bscscan.com/tx/${t.txHash}`
                        : t.network === 'Polygon' && t.txHash
                          ? `https://polygonscan.com/tx/${t.txHash}`
                          : t.txHash
                            ? `https://etherscan.io/tx/${t.txHash}`
                            : null
                  const row = (
                    <div className="flex items-start justify-between gap-2 py-1.5 text-[10px] font-mono">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'uppercase',
                              t.side === 'buy'
                                ? 'text-emerald-400'
                                : t.side === 'sell'
                                  ? 'text-rose-400'
                                  : 'text-white/50',
                            )}
                          >
                            {t.side}
                          </span>
                          <span className="text-white/80 truncate">
                            {t.amount} {t.baseSymbol}
                          </span>
                        </div>
                        <div className="text-white/35 truncate">
                          {t.protocol}
                          {t.quoteSymbol ? ` · ${t.quoteSymbol}` : ''}
                          {t.amountUsd ? ` · ${t.amountUsd}` : ''}
                          {t.priceUsd ? ` · ${t.priceUsd}` : ''}
                        </div>
                      </div>
                      <span className="text-white/30 shrink-0 tabular-nums">{when}</span>
                    </div>
                  )
                  return explorer ? (
                    <a
                      key={`${t.txHash}-${i}`}
                      href={explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:bg-white/[0.03] transition-colors"
                    >
                      {row}
                    </a>
                  ) : (
                    <div key={`${t.time}-${i}`}>{row}</div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-1.5 opacity-35 pointer-events-none select-none">
                {['Buy · waiting for fills…', 'Sell · waiting for fills…', 'Swap · waiting for fills…'].map(
                  row => (
                    <div
                      key={row}
                      className="flex items-center justify-between text-[10px] font-mono text-white/70 border-b border-white/5 pb-1"
                    >
                      <span>{row}</span>
                      <span className="text-white/30">--:--</span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-200/70 font-mono mb-1.5">
              How pros use this
            </p>
            <p className="text-[11px] leading-relaxed text-white/55">
              Trend (EMA) → heat (RSI) → turn (MACD) → size with ATR. Desk turns that into a bias so
              you decide faster — not blindly.
            </p>
          </div>
        </aside>
      </div>

      <p className="text-[10px] text-white/30 leading-relaxed px-1 font-mono max-w-3xl">
        {data?.disclaimer}
      </p>
    </div>
  )
}
