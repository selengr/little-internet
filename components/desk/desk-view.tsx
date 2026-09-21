'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CandleChart } from '@/components/desk/candle-chart'
import { formatPct, formatUsd } from '@/lib/crypto-format'
import { cn } from '@/lib/utils'
import type { Bias, OhlcBar, TapeRead } from '@/lib/desk-indicators'
import { RefreshCw, Search, Star } from 'lucide-react'

type Interval = '1h' | '4h' | '1d' | '1w'
type Zoom = 50 | 100 | 0
type RightTab = 'signal' | 'network' | 'flow'
type BottomTab = 'transfers' | 'book'

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
    status: string
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
  network?: {
    status: string
    message: string
    gas: {
      safe: number
      propose: number
      fast: number
      baseFee: number
      lastBlock: string
    } | null
    ethPrice: { ethusd: number; ethbtc: number } | null
    transfers: {
      hash: string
      from: string
      to: string
      amount: number
      tokenSymbol: string
      timeStamp: number
    }[]
    chainLabel: string
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

const PREFS_KEY = 'desk-prefs-v2'

const biasMeta: Record<Bias, { label: string; tone: string; bar: string }> = {
  constructive: { label: 'Buy lean', tone: 'text-emerald-400', bar: 'bg-emerald-400' },
  neutral: { label: 'Neutral', tone: 'text-white/55', bar: 'bg-white/40' },
  cautious: { label: 'Sell lean', tone: 'text-rose-400', bar: 'bg-rose-400' },
}

function pctClass(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 'text-white/40'
  return n >= 0 ? 'text-emerald-400' : 'text-rose-400'
}

function shortAddr(a: string) {
  if (!a || a.length < 10) return a || '—'
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}

function fmtAmt(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  return n.toPrecision(3)
}

function sliceSeries<T>(arr: T[], start: number): T[] {
  return arr.slice(start)
}

/** Synthetic ladder from mid ± ATR — visual only, not a real order book */
function buildBookLadder(
  mid: number | null,
  atrPct: number | null,
  buyBias: number,
): { side: 'ask' | 'bid'; price: number; size: number; total: number }[] {
  if (mid == null || mid <= 0) return []
  const step = mid * ((atrPct != null && atrPct > 0 ? atrPct : 0.8) / 100) * 0.22
  const rows: { side: 'ask' | 'bid'; price: number; size: number; total: number }[] = []
  let askTotal = 0
  let bidTotal = 0
  const sellW = (100 - buyBias) / 100
  const buyW = buyBias / 100
  for (let i = 5; i >= 1; i--) {
    const size = Math.round(36 + i * 22 * sellW)
    askTotal += size
    rows.push({ side: 'ask', price: mid + step * i, size, total: askTotal })
  }
  for (let i = 1; i <= 5; i++) {
    const size = Math.round(36 + i * 22 * buyW)
    bidTotal += size
    rows.push({ side: 'bid', price: mid - step * i, size, total: bidTotal })
  }
  return rows
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
  const [rightTab, setRightTab] = useState<RightTab>('network')
  const [bottomTab, setBottomTab] = useState<BottomTab>('transfers')
  const [data, setData] = useState<DeskPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const [watchQuery, setWatchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const prevPrice = useRef<number | null>(null)
  const hydrated = useRef(false)

  const [showEma, setShowEma] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [showRsi, setShowRsi] = useState(true)
  const [showMacd, setShowMacd] = useState(true)

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
        favorites: string[]
        rightTab: RightTab
      }>
      if (typeof p.showEma === 'boolean') setShowEma(p.showEma)
      if (typeof p.showVolume === 'boolean') setShowVolume(p.showVolume)
      if (typeof p.showRsi === 'boolean') setShowRsi(p.showRsi)
      if (typeof p.showMacd === 'boolean') setShowMacd(p.showMacd)
      if (Array.isArray(p.favorites)) setFavorites(p.favorites.filter(x => typeof x === 'string'))
      if (p.zoom === 50 || p.zoom === 100 || p.zoom === 0) setZoom(p.zoom)
      if (p.rightTab === 'signal' || p.rightTab === 'network' || p.rightTab === 'flow') {
        setRightTab(p.rightTab)
      }
      if (!searchParams.get('asset') && p.asset) setAsset(p.asset)
      if (
        !searchParams.get('interval') &&
        (p.interval === '1h' || p.interval === '4h' || p.interval === '1d' || p.interval === '1w')
      ) {
        setIntervalKey(p.interval)
      }
    } catch {
      /* ignore */
    } finally {
      hydrated.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({
          asset,
          interval,
          zoom,
          showEma,
          showVolume,
          showRsi,
          showMacd,
          favorites,
          rightTab,
        }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, interval, zoom, showEma, showVolume, showRsi, showMacd, favorites, rightTab, pathname, router])

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
          window.setTimeout(() => setFlash(null), 650)
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '1') setIntervalKey('1h')
      if (e.key === '2') setIntervalKey('4h')
      if (e.key === '3') setIntervalKey('1d')
      if (e.key === '4') setIntervalKey('1w')
      if (e.key === 'r' || e.key === 'R') void load()
      if (e.key === 'e') setShowEma(v => !v)
      if (e.key === 'v') setShowVolume(v => !v)
      if (e.key === 'i') setShowRsi(v => !v)
      if (e.key === 'm') setShowMacd(v => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [load])

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
  const scorePct = (((data?.tape.score ?? 0) + 5) / 10) * 100

  const candlePressure = useMemo(() => {
    const sample = (data?.bars ?? []).slice(-20)
    if (!sample.length) return { buy: 50, sell: 50 }
    const buys = sample.filter(b => b.c >= b.o).length
    const buyPct = Math.round((buys / sample.length) * 100)
    return { buy: buyPct, sell: 100 - buyPct }
  }, [data?.bars])

  const sortedWatch = useMemo(() => {
    const list = [...(data?.watchlist ?? [])]
    const q = watchQuery.trim().toLowerCase()
    const filtered = q
      ? list.filter(
          w =>
            w.symbol.toLowerCase().includes(q) ||
            w.name.toLowerCase().includes(q) ||
            w.id.includes(q),
        )
      : list
    filtered.sort((a, b) => {
      const af = favorites.includes(a.id) ? 0 : 1
      const bf = favorites.includes(b.id) ? 0 : 1
      if (af !== bf) return af - bf
      return Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0)
    })
    return filtered
  }, [data?.watchlist, favorites, watchQuery])

  const rangePos =
    data?.low24h != null &&
    data?.high24h != null &&
    data.price != null &&
    data.high24h !== data.low24h
      ? ((data.price - data.low24h) / (data.high24h - data.low24h)) * 100
      : 50

  const transfers = data?.network?.transfers ?? []
  const gas = data?.network?.gas
  const book = useMemo(
    () =>
      buildBookLadder(data?.price ?? null, data?.tape.atrPct ?? null, candlePressure.buy),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- candlePressure derived each render
    [data?.price, data?.tape.atrPct, candlePressure.buy],
  )
  const maxBookSize = Math.max(...book.map(r => r.size), 1)

  return (
    <div className="mx-auto max-w-[1480px] px-2 sm:px-3 space-y-1.5">
      {/* Exchange ticker */}
      <div className="overflow-hidden rounded border border-white/[0.08] bg-[#0e1218]">
        <div className="flex gap-0 overflow-x-auto scrollbar-none">
          {(data?.watchlist ?? []).slice(0, 10).map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => setAsset(w.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 border-r border-white/[0.06] shrink-0 text-left hover:bg-white/[0.03]',
                w.id === asset && 'bg-white/[0.05]',
              )}
            >
              <span className="text-[11px] font-medium text-white/80">{w.symbol}</span>
              <span className="text-[11px] font-mono tabular-nums text-white/55">
                {formatUsd(w.price)}
              </span>
              <span className={cn('text-[10px] font-mono tabular-nums', pctClass(w.change24h))}>
                {w.change24h != null ? formatPct(w.change24h) : '—'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pair header — Nobitex / Binance style */}
      <div className="rounded border border-white/[0.08] bg-[#0e1218] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2 min-w-0">
            {data?.asset.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.asset.image} alt="" className="size-6 rounded-full" />
            ) : null}
            <div>
              <p className="text-[15px] font-semibold tracking-wide text-white leading-none">
                {data?.asset.symbol ?? '—'}
                <span className="text-white/30 font-normal">/USDT</span>
              </p>
              <p className="text-[10px] text-white/35 mt-0.5">{data?.asset.name}</p>
            </div>
          </div>

          <p
            className={cn(
              'text-[1.65rem] font-semibold tabular-nums font-mono leading-none transition-colors',
              flash === 'up' && 'text-emerald-400',
              flash === 'down' && 'text-rose-400',
              !flash && 'text-white',
            )}
          >
            {loading && !data ? '—' : formatUsd(data?.price)}
          </p>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            {(
              [
                ['1h', data?.change1h],
                ['24h', data?.change24h],
                ['7d', data?.change7d],
              ] as const
            ).map(([lab, val]) => (
              <div key={lab}>
                <p className="text-[9px] uppercase text-white/30 tracking-wider">{lab}</p>
                <p className={cn('tabular-nums', pctClass(val))}>
                  {val != null ? formatPct(val) : '—'}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] font-mono text-white/55 border-l border-white/10 pl-4">
            <div>
              <p className="text-[9px] uppercase text-white/30">24h High</p>
              <p className="tabular-nums text-emerald-400/90">{formatUsd(data?.high24h)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-white/30">24h Low</p>
              <p className="tabular-nums text-rose-400/90">{formatUsd(data?.low24h)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-white/30">Volume</p>
              <p className="tabular-nums">{formatUsd(data?.volume24h, true)}</p>
            </div>
            <div className="min-w-[7rem]">
              <p className="text-[9px] uppercase text-white/30 mb-1">24h range</p>
              <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                  style={{ width: `${Math.min(100, Math.max(3, rangePos))}%` }}
                />
              </div>
            </div>
          </div>

          {gas ? (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono">
              <span className="inline-flex items-center gap-1 text-emerald-400/80 mr-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ETH gas
              </span>
              {[
                ['S', gas.safe],
                ['P', gas.propose],
                ['F', gas.fast],
              ].map(([lab, val]) => (
                <span
                  key={lab as string}
                  className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-white/70"
                >
                  <span className="text-white/35">{lab}</span> {Number(val).toFixed(2)}
                </span>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/45 hover:text-white/80"
          >
            <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
            Sync
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 px-3 py-2 text-xs font-mono">
          {error}
        </p>
      ) : null}

      {/* Main terminal */}
      <div className="grid grid-cols-12 gap-2 items-stretch">
        {/* Markets */}
        <aside className="col-span-12 lg:col-span-2 rounded border border-white/[0.08] bg-[#0e1218] overflow-hidden flex flex-col min-h-[480px]">
          <div className="px-2 py-2 border-b border-white/[0.06] space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-mono px-1">
              Markets
            </p>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-white/30" />
              <input
                value={watchQuery}
                onChange={e => setWatchQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded border border-white/10 bg-black/40 pl-7 pr-2 py-1 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-white/25"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-1 px-2 py-1 text-[9px] uppercase tracking-wider text-white/30 font-mono border-b border-white/[0.04]">
              <span>Pair</span>
              <span>Price</span>
              <span>24h</span>
            </div>
            {sortedWatch.map(item => {
              const active = item.id === asset
              const fav = favorites.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center border-b border-white/[0.03]',
                    active ? 'bg-[#1a2330]' : 'hover:bg-white/[0.03]',
                  )}
                >
                  <button
                    type="button"
                    className="px-1.5 py-2 text-white/20 hover:text-amber-300"
                    onClick={() =>
                      setFavorites(prev =>
                        prev.includes(item.id)
                          ? prev.filter(x => x !== item.id)
                          : [...prev, item.id],
                      )
                    }
                  >
                    <Star className={cn('size-3', fav && 'fill-amber-300 text-amber-300')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsset(item.id)}
                    className="flex-1 grid grid-cols-[1fr_auto_auto] gap-x-2 items-center px-1 py-1.5 text-left"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt="" className="size-4 rounded-full" />
                      ) : null}
                      <span className="text-[12px] text-white/90 font-medium">{item.symbol}</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-white/60">
                      {formatUsd(item.price)}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-mono tabular-nums w-14 text-right',
                        pctClass(item.change24h),
                      )}
                    >
                      {item.change24h != null ? formatPct(item.change24h) : '—'}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Chart */}
        <section className="col-span-12 lg:col-span-7 rounded border border-white/[0.08] bg-[#0e1218] overflow-hidden flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border-b border-white/[0.06]">
            <div className="flex rounded border border-white/10 overflow-hidden">
              {INTERVALS.map(iv => (
                <button
                  key={iv.key}
                  type="button"
                  onClick={() => setIntervalKey(iv.key)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-mono',
                    interval === iv.key
                      ? 'bg-[#2b6cb0] text-white'
                      : 'text-white/45 hover:text-white hover:bg-white/[0.04]',
                  )}
                >
                  {iv.label}
                </button>
              ))}
            </div>
            <div className="flex rounded border border-white/10 overflow-hidden">
              {(
                [
                  [50, '50'],
                  [100, '100'],
                  [0, 'ALL'],
                ] as const
              ).map(([z, lab]) => (
                <button
                  key={lab}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-mono',
                    zoom === z ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70',
                  )}
                >
                  {lab}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-auto">
              {(
                [
                  ['EMA', showEma, setShowEma],
                  ['VOL', showVolume, setShowVolume],
                  ['RSI', showRsi, setShowRsi],
                  ['MACD', showMacd, setShowMacd],
                ] as const
              ).map(([lab, on, set]) => (
                <button
                  key={lab}
                  type="button"
                  onClick={() => set(!on)}
                  className={cn(
                    'px-1.5 py-1 text-[9px] font-mono border rounded',
                    on
                      ? 'border-[#2b6cb0]/60 text-[#7eb6e8] bg-[#2b6cb0]/15'
                      : 'border-white/10 text-white/30',
                  )}
                >
                  {lab}
                </button>
              ))}
            </div>
          </div>
          <div className="p-2 flex-1">
            {loading && !data ? (
              <div className="h-[440px] bg-white/[0.03] animate-pulse rounded" />
            ) : view && data ? (
              <CandleChart
                bars={view.bars}
                ema20={view.ema20}
                ema50={view.ema50}
                rsi={view.rsi}
                macd={view.macd}
                macdSignal={view.macdSignal}
                macdHist={view.macdHist}
                support={data.tape.support}
                resistance={data.tape.resistance}
                showEma={showEma}
                showVolume={showVolume}
                showRsi={showRsi}
                showMacd={showMacd}
              />
            ) : null}
          </div>
        </section>

        {/* Right panel tabs */}
        <aside className="col-span-12 lg:col-span-3 rounded border border-white/[0.08] bg-[#0e1218] overflow-hidden flex flex-col min-h-[480px]">
          <div className="flex border-b border-white/[0.06]">
            {(
              [
                ['network', 'Network'],
                ['flow', 'Transfers'],
                ['signal', 'Signal'],
              ] as const
            ).map(([id, lab]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRightTab(id)}
                className={cn(
                  'flex-1 py-2 text-[10px] uppercase tracking-wider font-mono border-b-2 -mb-px',
                  rightTab === id
                    ? 'border-[#2b6cb0] text-white'
                    : 'border-transparent text-white/40 hover:text-white/70',
                )}
              >
                {lab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {rightTab === 'network' ? (
              <>
                <p className="text-[11px] text-white/45 leading-relaxed">
                  {data?.network?.message ?? 'Loading network…'}
                </p>
                {gas ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ['Safe', gas.safe, 'text-emerald-400'],
                        ['Propose', gas.propose, 'text-amber-300'],
                        ['Fast', gas.fast, 'text-rose-400'],
                      ] as const
                    ).map(([lab, val, tone]) => (
                      <div
                        key={lab}
                        className="rounded border border-white/[0.07] bg-black/30 px-2 py-2 text-center"
                      >
                        <p className="text-[9px] uppercase text-white/35 tracking-wider">{lab}</p>
                        <p className={cn('text-sm font-mono tabular-nums mt-0.5', tone)}>
                          {val.toFixed(2)}
                        </p>
                        <p className="text-[9px] text-white/25">gwei</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/35 font-mono">
                    {data?.network?.status === 'unconfigured'
                      ? 'Set ETHERSCAN_API_KEY'
                      : 'Gas unavailable'}
                  </p>
                )}
                {data?.network?.ethPrice ? (
                  <div className="rounded border border-white/[0.07] px-3 py-2 flex justify-between text-[11px] font-mono">
                    <span className="text-white/40">ETH (Etherscan)</span>
                    <span className="text-white/85 tabular-nums">
                      ${data.network.ethPrice.ethusd.toLocaleString()}
                    </span>
                  </div>
                ) : null}
                {gas?.lastBlock ? (
                  <p className="text-[10px] font-mono text-white/30">
                    Last block #{Number(gas.lastBlock).toLocaleString()}
                  </p>
                ) : null}
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-white/40">Candle pressure</span>
                    <span>
                      <span className="text-emerald-400">{candlePressure.buy}%</span>
                      <span className="text-white/25"> / </span>
                      <span className="text-rose-400">{candlePressure.sell}%</span>
                    </span>
                  </div>
                  <div className="flex h-1.5 rounded overflow-hidden">
                    <div className="bg-emerald-400" style={{ width: `${candlePressure.buy}%` }} />
                    <div className="bg-rose-400" style={{ width: `${candlePressure.sell}%` }} />
                  </div>
                </div>
                {/* Educational lean strip — exchange feel, not real trading */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="rounded border border-emerald-500/25 bg-emerald-500/10 px-2 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-emerald-400/80">Buy lean</p>
                    <p className="text-lg font-mono tabular-nums text-emerald-400 mt-0.5">
                      {candlePressure.buy}%
                    </p>
                  </div>
                  <div className="rounded border border-rose-500/25 bg-rose-500/10 px-2 py-2 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-rose-400/80">Sell lean</p>
                    <p className="text-lg font-mono tabular-nums text-rose-400 mt-0.5">
                      {candlePressure.sell}%
                    </p>
                  </div>
                </div>
                <p className="text-[9px] text-white/25 font-mono leading-relaxed">
                  Analysis only — no orders placed. Desk never executes trades.
                </p>
              </>
            ) : null}

            {rightTab === 'flow' ? (
              <>
                <p className="text-[11px] text-white/45">{data?.network?.message}</p>
                <div className="space-y-0 divide-y divide-white/[0.05]">
                  {transfers.length === 0 ? (
                    <p className="text-[11px] text-white/35 py-6 text-center font-mono">
                      No recent transfers for this asset
                    </p>
                  ) : (
                    transfers.map(t => (
                      <a
                        key={t.hash}
                        href={
                          data?.network?.chainLabel === 'Polygon'
                            ? `https://polygonscan.com/tx/${t.hash}`
                            : `https://etherscan.io/tx/${t.hash}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 py-2 hover:bg-white/[0.03] -mx-1 px-1 rounded"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-white/85 tabular-nums truncate">
                            {fmtAmt(t.amount)} {t.tokenSymbol}
                          </p>
                          <p className="text-[10px] font-mono text-white/30 truncate">
                            {shortAddr(t.from)} → {shortAddr(t.to)}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-white/30 shrink-0">
                          {new Date(t.timeStamp * 1000).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </a>
                    ))
                  )}
                </div>
              </>
            ) : null}

            {rightTab === 'signal' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                    Bias
                  </p>
                  <span
                    className={cn(
                      'text-[11px] font-mono',
                      biasMeta[data?.tape.bias ?? 'neutral'].tone,
                    )}
                  >
                    {biasMeta[data?.tape.bias ?? 'neutral'].label}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      biasMeta[data?.tape.bias ?? 'neutral'].bar,
                    )}
                    style={{ width: `${scorePct}%` }}
                  />
                </div>
                <p className="text-[12px] text-white/80 leading-snug font-light">
                  {data?.tape.headline}
                </p>
                <ul className="space-y-1.5">
                  {(data?.tape.bullets ?? []).map((b, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-white/45 leading-relaxed pl-2 border-l border-white/15"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(
                    [
                      ['RSI', rsi != null ? rsi.toFixed(1) : '—'],
                      [
                        'ATR %',
                        data?.tape.atrPct != null ? `${data.tape.atrPct.toFixed(2)}%` : '—',
                      ],
                      ['Support', formatUsd(data?.tape.support)],
                      ['Resist.', formatUsd(data?.tape.resistance)],
                    ] as const
                  ).map(([lab, val]) => (
                    <div
                      key={lab}
                      className="rounded border border-white/[0.07] bg-black/25 px-2 py-1.5"
                    >
                      <p className="text-[9px] uppercase text-white/35 font-mono">{lab}</p>
                      <p className="text-[12px] font-mono tabular-nums text-white/85">{val}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Bottom market panel — transfers + synthetic book */}
      <div className="rounded border border-white/[0.08] bg-[#0e1218] overflow-hidden">
        <div className="flex items-center justify-between px-2 border-b border-white/[0.06]">
          <div className="flex">
            {(
              [
                ['transfers', 'Market transfers'],
                ['book', 'Depth'],
              ] as const
            ).map(([id, lab]) => (
              <button
                key={id}
                type="button"
                onClick={() => setBottomTab(id)}
                className={cn(
                  'px-3 py-2 text-[10px] uppercase tracking-wider font-mono border-b-2 -mb-px',
                  bottomTab === id
                    ? 'border-[#2b6cb0] text-white'
                    : 'border-transparent text-white/40 hover:text-white/70',
                )}
              >
                {lab}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono text-white/30 pr-2">
            {bottomTab === 'transfers'
              ? `${data?.network?.chainLabel ?? 'EVM'} · Etherscan`
              : 'Synthetic · ATR ladder'}
          </p>
        </div>

        {bottomTab === 'transfers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-[9px] uppercase tracking-wider text-white/30 border-b border-white/[0.05]">
                  <th className="text-left font-normal px-3 py-1.5">Time</th>
                  <th className="text-left font-normal px-3 py-1.5">Amount</th>
                  <th className="text-left font-normal px-3 py-1.5 hidden sm:table-cell">From</th>
                  <th className="text-left font-normal px-3 py-1.5 hidden sm:table-cell">To</th>
                  <th className="text-right font-normal px-3 py-1.5">Tx</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-white/30">
                      Select ETH, WBTC, LINK, or MATIC — or wait for sync
                    </td>
                  </tr>
                ) : (
                  transfers.map(t => (
                    <tr
                      key={t.hash}
                      className="border-b border-white/[0.03] hover:bg-white/[0.025]"
                    >
                      <td className="px-3 py-1.5 text-white/45 tabular-nums whitespace-nowrap">
                        {new Date(t.timeStamp * 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-1.5 text-white/85 tabular-nums whitespace-nowrap">
                        {fmtAmt(t.amount)}{' '}
                        <span className="text-white/40">{t.tokenSymbol}</span>
                      </td>
                      <td className="px-3 py-1.5 text-white/40 hidden sm:table-cell">
                        {shortAddr(t.from)}
                      </td>
                      <td className="px-3 py-1.5 text-white/40 hidden sm:table-cell">
                        {shortAddr(t.to)}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <a
                          href={
                            data?.network?.chainLabel === 'Polygon'
                              ? `https://polygonscan.com/tx/${t.hash}`
                              : `https://etherscan.io/tx/${t.hash}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#7eb6e8] hover:underline"
                        >
                          {shortAddr(t.hash)}
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
            <div className="p-2">
              <div className="grid grid-cols-3 text-[9px] uppercase tracking-wider text-white/30 font-mono px-2 pb-1">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
              </div>
              {book
                .filter(r => r.side === 'ask')
                .map(r => (
                  <div
                    key={`a-${r.price}`}
                    className="relative grid grid-cols-3 text-[11px] font-mono px-2 py-0.5"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-rose-500/10"
                      style={{ width: `${(r.size / maxBookSize) * 100}%` }}
                    />
                    <span className="relative text-rose-400 tabular-nums">
                      {formatUsd(r.price)}
                    </span>
                    <span className="relative text-right text-white/60 tabular-nums">{r.size}</span>
                    <span className="relative text-right text-white/35 tabular-nums">{r.total}</span>
                  </div>
                ))}
              <div className="px-2 py-1.5 my-0.5 border-y border-white/[0.06] flex items-center justify-between">
                <span
                  className={cn(
                    'text-sm font-mono tabular-nums font-semibold',
                    (data?.change24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {formatUsd(data?.price)}
                </span>
                <span className="text-[10px] font-mono text-white/30">Mid</span>
              </div>
              {book
                .filter(r => r.side === 'bid')
                .map(r => (
                  <div
                    key={`b-${r.price}`}
                    className="relative grid grid-cols-3 text-[11px] font-mono px-2 py-0.5"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-emerald-500/10"
                      style={{ width: `${(r.size / maxBookSize) * 100}%` }}
                    />
                    <span className="relative text-emerald-400 tabular-nums">
                      {formatUsd(r.price)}
                    </span>
                    <span className="relative text-right text-white/60 tabular-nums">{r.size}</span>
                    <span className="relative text-right text-white/35 tabular-nums">{r.total}</span>
                  </div>
                ))}
            </div>
            <div className="p-3 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                Bias meter
              </p>
              <div className="flex h-2 rounded overflow-hidden">
                <div className="bg-emerald-400" style={{ width: `${candlePressure.buy}%` }} />
                <div className="bg-rose-400" style={{ width: `${candlePressure.sell}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="rounded border border-white/[0.07] px-2 py-2">
                  <p className="text-[9px] text-white/35 uppercase">Buy pressure</p>
                  <p className="text-emerald-400 text-base tabular-nums mt-0.5">
                    {candlePressure.buy}%
                  </p>
                </div>
                <div className="rounded border border-white/[0.07] px-2 py-2">
                  <p className="text-[9px] text-white/35 uppercase">Sell pressure</p>
                  <p className="text-rose-400 text-base tabular-nums mt-0.5">
                    {candlePressure.sell}%
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-white/45 leading-relaxed">{data?.tape.headline}</p>
              <p className="text-[9px] text-white/25 font-mono">
                Depth is illustrative from mid ± ATR — not exchange liquidity.
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/25 font-mono px-1 pb-2">{data?.disclaimer}</p>
    </div>
  )
}
