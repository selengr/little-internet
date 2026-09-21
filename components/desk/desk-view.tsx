'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CandleChart } from '@/components/desk/candle-chart'
import { DeskBotPanel } from '@/components/desk/desk-bot'
import { formatPct, formatUsd } from '@/lib/crypto-format'
import { buildDeskBotAdvice } from '@/lib/desk-bot'
import { cn } from '@/lib/utils'
import type { OhlcBar, TapeRead } from '@/lib/desk-indicators'
import { RefreshCw, Search, Star } from 'lucide-react'

type Interval = '1h' | '4h' | '1d' | '1w' | '1mo' | 'max'

const INTERVALS: { key: Interval; label: string }[] = [
  { key: '1h', label: '1H' },
  { key: '4h', label: '4H' },
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
  { key: '1mo', label: '1M' },
  { key: 'max', label: 'ALL' },
]

function isInterval(v: string | null | undefined): v is Interval {
  return v === '1h' || v === '4h' || v === '1d' || v === '1w' || v === '1mo' || v === 'max'
}
type Zoom = 50 | 100 | 0
type SidePanel = 'book' | 'trades'

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
  defi?: {
    status: string
    message: string
    chainName: string | null
    chainTvl: number | null
    change: number | null
    protocolTvl: number | null
  }
}

const PREFS_KEY = 'desk-prefs-v3'

function pctClass(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return 'text-white/40'
  return n >= 0 ? 'text-emerald-400' : 'text-rose-400'
}

function fmtAmt(n: number) {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (n >= 1) return n.toFixed(4)
  return n.toPrecision(3)
}

function buildBookLadder(
  mid: number | null,
  atrPct: number | null,
  buyBias: number,
): { side: 'ask' | 'bid'; price: number; size: number; total: number }[] {
  if (mid == null || mid <= 0) return []
  const step = mid * ((atrPct != null && atrPct > 0 ? atrPct : 0.8) / 100) * 0.18
  const rows: { side: 'ask' | 'bid'; price: number; size: number; total: number }[] = []
  let askTotal = 0
  let bidTotal = 0
  const sellW = (100 - buyBias) / 100
  const buyW = buyBias / 100
  for (let i = 8; i >= 1; i--) {
    const size = Math.round(28 + i * 16 * sellW)
    askTotal += size
    rows.push({ side: 'ask', price: mid + step * i, size, total: askTotal })
  }
  for (let i = 1; i <= 8; i++) {
    const size = Math.round(28 + i * 16 * buyW)
    bidTotal += size
    rows.push({ side: 'bid', price: mid - step * i, size, total: bidTotal })
  }
  return rows
}

type DeskViewProps = {
  initialAsset: string
  initialInterval: Interval
}

export function DeskView({ initialAsset, initialInterval }: DeskViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [asset, setAsset] = useState(initialAsset)
  const [interval, setIntervalKey] = useState<Interval>(initialInterval)
  const [zoom, setZoom] = useState<Zoom>(100)
  const [sidePanel, setSidePanel] = useState<SidePanel>('book')
  const [data, setData] = useState<DeskPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const [watchQuery, setWatchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const prevPrice = useRef<number | null>(null)
  const prefsReady = useRef(false)
  const fetchGen = useRef(0)
  const fetchAbort = useRef<AbortController | null>(null)
  const lastGoodData = useRef<DeskPayload | null>(null)
  const [chartMounted, setChartMounted] = useState(false)
  const [chartResetToken, setChartResetToken] = useState(0)

  const [showEma, setShowEma] = useState(true)
  const [showVolume, setShowVolume] = useState(false)
  const [showRsi, setShowRsi] = useState(false)
  const [showMacd, setShowMacd] = useState(false)

  // Stable first paint (SSR + hydrate) — prefs apply only after mount
  const uiEma = chartMounted ? showEma : true
  const uiVol = chartMounted ? showVolume : false
  const uiRsi = chartMounted ? showRsi : false
  const uiMacd = chartMounted ? showMacd : false

  useEffect(() => {
    setChartMounted(true)
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (raw) {
        const p = JSON.parse(raw) as Partial<{
          showEma: boolean
          showVolume: boolean
          showRsi: boolean
          showMacd: boolean
          zoom: Zoom
          asset: string
          interval: Interval
          favorites: string[]
          sidePanel: SidePanel
        }>
        if (typeof p.showEma === 'boolean') setShowEma(p.showEma)
        if (typeof p.showVolume === 'boolean') setShowVolume(p.showVolume)
        if (typeof p.showRsi === 'boolean') setShowRsi(p.showRsi)
        if (typeof p.showMacd === 'boolean') setShowMacd(p.showMacd)
        if (Array.isArray(p.favorites)) setFavorites(p.favorites.filter(x => typeof x === 'string'))
        if (p.zoom === 50 || p.zoom === 100 || p.zoom === 0) setZoom(p.zoom)
        if (p.sidePanel === 'book' || p.sidePanel === 'trades') setSidePanel(p.sidePanel)
        if (!searchParams.get('asset') && p.asset) setAsset(p.asset)
        if (!searchParams.get('interval') && isInterval(p.interval)) {
          setIntervalKey(p.interval)
        }
      }
    } catch {
      /* ignore */
    } finally {
      prefsReady.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const urlAsset = searchParams.get('asset')
    const urlInterval = searchParams.get('interval')
    if (urlAsset && urlAsset !== asset) setAsset(urlAsset)
    if (isInterval(urlInterval) && urlInterval !== interval) setIntervalKey(urlInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!prefsReady.current) return
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
          sidePanel,
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
  }, [
    asset,
    interval,
    zoom,
    showEma,
    showVolume,
    showRsi,
    showMacd,
    favorites,
    sidePanel,
    pathname,
    router,
  ])

  const load = useCallback(
    async (silent = false) => {
      const gen = ++fetchGen.current
      fetchAbort.current?.abort()
      const ac = new AbortController()
      fetchAbort.current = ac

      if (!silent) setLoading(true)
      if (!silent) setStatusNotice(null)

      try {
        const res = await fetch(`/api/desk?asset=${encodeURIComponent(asset)}&interval=${encodeURIComponent(interval)}`, {
          cache: 'no-store',
          signal: ac.signal,
        })
        const json = (await res.json()) as DeskPayload & { error?: string }
        if (gen !== fetchGen.current) return

        const bars = Array.isArray(json.bars) ? json.bars : []
        if (!res.ok || !bars.length) {
          if (lastGoodData.current) {
            setStatusNotice('Showing last chart — live update unavailable')
            return
          }
          throw new Error(json.error ?? 'Failed to load')
        }

        if (prevPrice.current != null && json.price != null && json.price !== prevPrice.current) {
          setFlash(json.price > prevPrice.current ? 'up' : 'down')
          window.setTimeout(() => setFlash(null), 650)
        }
        prevPrice.current = json.price ?? null
        lastGoodData.current = json
        setData(json)
        setStatusNotice(null)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (gen !== fetchGen.current) return
        if (lastGoodData.current) {
          setStatusNotice('Showing last chart — live update unavailable')
          return
        }
        setStatusNotice(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (gen === fetchGen.current) setLoading(false)
      }
    },
    [asset, interval],
  )

  useEffect(() => {
    const debounce = window.setTimeout(() => void load(), 80)
    const t = setInterval(() => void load(true), 45_000)
    return () => {
      clearTimeout(debounce)
      clearInterval(t)
      fetchAbort.current?.abort()
    }
  }, [load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '1') setIntervalKey('1h')
      if (e.key === '2') setIntervalKey('4h')
      if (e.key === '3') setIntervalKey('1d')
      if (e.key === '4') setIntervalKey('1w')
      if (e.key === '5') setIntervalKey('1mo')
      if (e.key === '6') setIntervalKey('max')
      if (e.key === 'r' || e.key === 'R') void load()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [load])

  const chartSeries = useMemo(() => {
    if (!data) return null
    return {
      bars: data.bars,
      ema20: data.indicators.ema20,
      ema50: data.indicators.ema50,
      rsi: data.indicators.rsi,
      macd: data.indicators.macd,
      macdSignal: data.indicators.macdSignal,
      macdHist: data.indicators.macdHist,
    }
  }, [data])

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
      return (b.change24h ?? 0) - (a.change24h ?? 0)
    })
    return filtered
  }, [data?.watchlist, favorites, watchQuery])

  const transfers = data?.network?.transfers ?? []
  const gas = data?.network?.gas
  const book = useMemo(
    () => buildBookLadder(data?.price ?? null, data?.tape.atrPct ?? null, candlePressure.buy),
    [data?.price, data?.tape.atrPct, candlePressure.buy],
  )
  const maxBookSize = Math.max(...book.map(r => r.size), 1)
  const up24 = (data?.change24h ?? 0) >= 0
  const explorerBase =
    data?.network?.chainLabel === 'Polygon' ? 'https://polygonscan.com/tx/' : 'https://etherscan.io/tx/'

  const botAdvice = useMemo(() => {
    if (!data?.tape || !data.bars?.length) return null
    if (data.asset.id !== asset || data.interval !== interval) return null
    return buildDeskBotAdvice(data.bars, data.tape, data.price)
  }, [data, asset, interval])

  const botAdviceLoading = Boolean(data && loading && botAdvice == null)

  return (
    <div className="mx-auto max-w-[1600px] px-1.5 sm:px-2 space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded border border-white/[0.07] bg-[#0d1117] px-2.5 py-1.5">
        <div className="flex items-center gap-2">
          {data?.asset.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.asset.image} alt="" className="size-5 rounded-full" />
          ) : null}
          <span className="text-[14px] font-semibold text-white">
            {data?.asset.symbol ?? '—'}
            <span className="text-white/30 font-normal">/USDT</span>
          </span>
        </div>

        <p
          className={cn(
            'text-[1.35rem] font-semibold tabular-nums font-mono leading-none transition-colors',
            flash === 'up' && 'text-emerald-400',
            flash === 'down' && 'text-rose-400',
            !flash && (up24 ? 'text-emerald-400' : 'text-rose-400'),
          )}
        >
          {loading && !data ? '—' : formatUsd(data?.price)}
        </p>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div>
            <span className="text-white/30 mr-1">24h</span>
            <span className={pctClass(data?.change24h)}>
              {data?.change24h != null ? formatPct(data.change24h) : '—'}
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-white/30 mr-1">High</span>
            <span className="text-white/70 tabular-nums">{formatUsd(data?.high24h)}</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-white/30 mr-1">Low</span>
            <span className="text-white/70 tabular-nums">{formatUsd(data?.low24h)}</span>
          </div>
          <div className="hidden md:block">
            <span className="text-white/30 mr-1">Vol</span>
            <span className="text-white/70 tabular-nums">{formatUsd(data?.volume24h, true)}</span>
          </div>
          {data?.defi?.status === 'live' && data.defi.chainTvl != null ? (
            <div className="hidden lg:flex items-center gap-1 border-l border-white/[0.08] pl-3">
              <span className="text-white/30">{data.asset.symbol} DeFi</span>
              <span className="text-white/65 tabular-nums">TVL {formatUsd(data.defi.chainTvl, true)}</span>
              {data.defi.change != null ? (
                <>
                  <span className="text-white/20">·</span>
                  <span className="text-white/30">24h</span>
                  <span className={cn('tabular-nums', pctClass(data.defi.change))}>
                    {formatPct(data.defi.change)}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {gas ? (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-white/40">
            {data?.network?.chainLabel ? (
              <span className="text-white/25">{data.network.chainLabel}</span>
            ) : null}
            <span className="size-1 rounded-full bg-emerald-400/90" />
            <span>{gas.propose.toFixed(1)} gwei</span>
            <button
              type="button"
              onClick={() => void load()}
              className="ml-1 p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70"
              aria-label="Refresh"
            >
              <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void load()}
            className="ml-auto p-1 rounded hover:bg-white/[0.06] text-white/40"
            aria-label="Refresh"
          >
            <RefreshCw className={cn('size-3', loading && 'animate-spin')} />
          </button>
        )}
      </div>

      {statusNotice && !data ? (
        <p className="rounded border border-amber-500/25 bg-amber-500/10 text-amber-200/90 px-3 py-1.5 text-xs font-mono">
          {statusNotice}
        </p>
      ) : null}

      {/* Main: markets | chart | book/trades */}
      <div className="grid grid-cols-12 gap-1 items-stretch lg:min-h-[calc(100vh-7rem)]">
        {/* Markets */}
        <aside className="col-span-12 lg:col-span-2 rounded border border-white/[0.07] bg-[#0d1117] flex flex-col overflow-hidden max-h-[420px] lg:max-h-none">
          <div className="px-2 py-1.5 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-white/25" />
              <input
                value={watchQuery}
                onChange={e => setWatchQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded bg-black/40 border border-white/[0.08] pl-7 pr-2 py-1 text-[11px] text-white placeholder:text-white/25 outline-none focus:border-white/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-1 px-2 py-1 text-[9px] uppercase tracking-wider text-white/25 font-mono border-b border-white/[0.04]">
            <span className="pl-5">Pair</span>
            <span>Price</span>
            <span className="w-12 text-right">24h</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedWatch.map(item => {
              const active = item.id === asset
              const fav = favorites.includes(item.id)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center border-b border-white/[0.03]',
                    active ? 'bg-[#1a2332]' : 'hover:bg-white/[0.025]',
                  )}
                >
                  <button
                    type="button"
                    className="px-1 py-2 text-white/15 hover:text-amber-300"
                    onClick={() =>
                      setFavorites(prev =>
                        prev.includes(item.id)
                          ? prev.filter(x => x !== item.id)
                          : [...prev, item.id],
                      )
                    }
                  >
                    <Star className={cn('size-2.5', fav && 'fill-amber-300 text-amber-300')} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsset(item.id)}
                    className="flex-1 grid grid-cols-[1fr_auto_auto] gap-x-1.5 items-center pr-2 py-1.5 text-left"
                  >
                    <span className="text-[12px] text-white/90 font-medium truncate">
                      {item.symbol}
                      <span className="text-white/25 font-normal">/USDT</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-white/55">
                      {formatUsd(item.price)}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-mono tabular-nums w-12 text-right',
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
        <section className="col-span-12 lg:col-span-7 rounded border border-white/[0.07] bg-[#0d1117] flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-0 border-b border-white/[0.06] bg-[#0a0e13]/40">
            <div className="flex">
              {INTERVALS.map(iv => (
                <button
                  key={iv.key}
                  type="button"
                  onClick={() => setIntervalKey(iv.key)}
                  className={cn(
                    'px-2.5 py-1.5 text-[11px] font-mono border-b-2 -mb-px transition-colors',
                    interval === iv.key
                      ? 'text-[#f0b90b] border-[#f0b90b]'
                      : 'text-white/35 border-transparent hover:text-white/70',
                  )}
                >
                  {iv.label}
                </button>
              ))}
            </div>
            <span className="hidden sm:block w-px h-3.5 bg-white/[0.08] mx-1" aria-hidden />
            {(
              [
                ['EMA', uiEma, setShowEma],
                ['VOL', uiVol, setShowVolume],
                ['RSI', uiRsi, setShowRsi],
                ['MACD', uiMacd, setShowMacd],
              ] as const
            ).map(([lab, on, set]) => (
              <button
                key={lab}
                type="button"
                onClick={() => set(!on)}
                className={cn(
                  'px-1.5 py-1 text-[10px] font-mono rounded-sm transition-colors',
                  on
                    ? 'text-[#f0b90b] bg-[#f0b90b]/10'
                    : 'text-white/32 hover:text-white/58 hover:bg-white/[0.04]',
                )}
                suppressHydrationWarning
              >
                {lab}
              </button>
            ))}
            {statusNotice && data ? (
              <span className="text-[10px] font-mono text-amber-200/70 px-1 truncate max-w-[12rem] sm:max-w-none">
                {statusNotice}
              </span>
            ) : null}
            <div className="ml-auto flex items-center gap-0.5 text-[10px] font-mono text-white/28">
              <span className="px-1 py-1 hidden sm:inline text-white/22">Bars</span>
              {(
                [
                  [50, '50'],
                  [100, '100'],
                  [0, 'All'],
                ] as const
              ).map(([z, lab]) => (
                <button
                  key={lab}
                  type="button"
                  onClick={() => {
                    setZoom(z)
                    setChartResetToken(t => t + 1)
                  }}
                  className={cn(
                    'px-1.5 py-1 rounded-sm transition-colors',
                    zoom === z
                      ? 'text-white/80 bg-white/[0.06]'
                      : 'hover:text-white/50 hover:bg-white/[0.03]',
                  )}
                >
                  {lab}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setZoom(0)
                  setChartResetToken(t => t + 1)
                }}
                className="px-1.5 py-1 hover:text-white/45 text-white/40"
                title="Fit all bars and reset pan"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="relative p-1 flex-1 max-lg:flex-none min-h-0">
            {!chartMounted || (loading && !data) ? (
              <div className="aspect-[11/7] max-lg:aspect-[11/8] w-full bg-white/[0.03] animate-pulse rounded" />
            ) : chartSeries && data ? (
              <>
                {loading ? (
                  <div
                    className="pointer-events-none absolute inset-1 z-10 rounded bg-[#0d1117]/35 backdrop-blur-[1px]"
                    aria-hidden
                  />
                ) : null}
                <CandleChart
                  bars={chartSeries.bars}
                  ema20={chartSeries.ema20}
                  ema50={chartSeries.ema50}
                  rsi={chartSeries.rsi}
                  macd={chartSeries.macd}
                  macdSignal={chartSeries.macdSignal}
                  macdHist={chartSeries.macdHist}
                  support={data.tape.support}
                  resistance={data.tape.resistance}
                  buyFrom={botAdvice?.buyFrom}
                  buyTo={botAdvice?.buyTo}
                  sellFrom={botAdvice?.sellFrom}
                  sellTo={botAdvice?.sellTo}
                  showEma={uiEma}
                  showVolume={uiVol}
                  showRsi={uiRsi}
                  showMacd={uiMacd}
                  zoomPreset={zoom}
                  resetToken={chartResetToken}
                  pairLabel={`${data.asset.symbol}/USDT`}
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Order book + trades + lean form */}
        <aside className="col-span-12 lg:col-span-3 rounded border border-white/[0.07] bg-[#0d1117] flex flex-col overflow-hidden max-h-[640px] lg:max-h-none">
          <div className="flex border-b border-white/[0.06]">
            {(
              [
                ['book', 'Order book'],
                ['trades', 'Trades'],
              ] as const
            ).map(([id, lab]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSidePanel(id)}
                className={cn(
                  'flex-1 py-2 text-[11px] font-mono',
                  sidePanel === id ? 'text-white border-b-2 border-[#f0b90b]' : 'text-white/40',
                )}
              >
                {lab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {sidePanel === 'book' ? (
              <div className="px-2 py-1">
                <div className="grid grid-cols-3 text-[9px] uppercase tracking-wider text-white/25 font-mono px-1 pb-1">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>
                {book
                  .filter(r => r.side === 'ask')
                  .map(r => (
                    <div
                      key={`a-${r.price}`}
                      className="relative grid grid-cols-3 text-[11px] font-mono px-1 py-[2px]"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-rose-500/[0.12]"
                        style={{ width: `${(r.size / maxBookSize) * 100}%` }}
                      />
                      <span className="relative text-rose-400 tabular-nums">
                        {formatUsd(r.price)}
                      </span>
                      <span className="relative text-right text-white/55 tabular-nums">{r.size}</span>
                      <span className="relative text-right text-white/30 tabular-nums">{r.total}</span>
                    </div>
                  ))}
                <div className="px-1 py-1.5 my-0.5 flex items-center justify-between border-y border-white/[0.06]">
                  <span
                    className={cn(
                      'text-[15px] font-mono tabular-nums font-semibold',
                      up24 ? 'text-emerald-400' : 'text-rose-400',
                    )}
                  >
                    {formatUsd(data?.price)}
                  </span>
                  <div className="flex h-1 w-16 rounded overflow-hidden">
                    <div className="bg-emerald-400" style={{ width: `${candlePressure.buy}%` }} />
                    <div className="bg-rose-400" style={{ width: `${candlePressure.sell}%` }} />
                  </div>
                </div>
                {book
                  .filter(r => r.side === 'bid')
                  .map(r => (
                    <div
                      key={`b-${r.price}`}
                      className="relative grid grid-cols-3 text-[11px] font-mono px-1 py-[2px]"
                    >
                      <div
                        className="absolute inset-y-0 right-0 bg-emerald-500/[0.12]"
                        style={{ width: `${(r.size / maxBookSize) * 100}%` }}
                      />
                      <span className="relative text-emerald-400 tabular-nums">
                        {formatUsd(r.price)}
                      </span>
                      <span className="relative text-right text-white/55 tabular-nums">{r.size}</span>
                      <span className="relative text-right text-white/30 tabular-nums">{r.total}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                <div className="grid grid-cols-3 text-[9px] uppercase tracking-wider text-white/25 font-mono px-2 py-1">
                  <span>Amount</span>
                  <span className="text-right">Token</span>
                  <span className="text-right">Time</span>
                </div>
                {transfers.length === 0 ? (
                  <p className="text-[11px] text-white/30 py-10 text-center font-mono px-3">
                    Pick ETH, WBTC, LINK, or MATIC for live transfers
                  </p>
                ) : (
                  transfers.map(t => (
                    <a
                      key={t.hash}
                      href={`${explorerBase}${t.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid grid-cols-3 gap-1 px-2 py-1.5 hover:bg-white/[0.03] text-[11px] font-mono"
                    >
                      <span className="text-white/80 tabular-nums truncate">
                        {fmtAmt(t.amount)}
                      </span>
                      <span className="text-right text-white/45 truncate">{t.tokenSymbol}</span>
                      <span className="text-right text-white/30 tabular-nums" suppressHydrationWarning>
                        {chartMounted
                          ? new Date(t.timeStamp * 1000).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : '—'}
                      </span>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>

          <DeskBotPanel advice={botAdvice} loading={botAdviceLoading} />
        </aside>
      </div>
    </div>
  )
}
