'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RefreshCw } from 'lucide-react'
import type { CoinMarket, GlobalMarketData } from '@/types/coingecko'
import { Sparkline } from '@/components/crypto-sparkline'
import { formatPct, formatUsd } from '@/lib/crypto-format'
import { cn } from '@/lib/utils'

const REFRESH_MS = 30_000

const mono = { fontFamily: 'var(--font-cx-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-cx-display), Georgia, serif' } as const
const mark = { fontFamily: 'var(--font-cx-mark), system-ui, sans-serif' } as const

function Delta({ value, large }: { value: number; large?: boolean }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        'font-semibold tabular-nums tracking-tight',
        large ? 'text-base md:text-lg' : 'text-[11px] md:text-xs',
      )}
      style={{
        ...mono,
        color: up ? 'var(--cx-up)' : 'var(--cx-down)',
      }}
    >
      {formatPct(value)}
    </span>
  )
}

function TickerTape({ coins }: { coins: CoinMarket[] }) {
  const items = [...coins.slice(0, 14), ...coins.slice(0, 14)]
  if (!items.length) return null

  return (
    <div className="relative overflow-hidden border-y border-[color:var(--cx-line)] bg-[color:var(--cx-tape)] py-3">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10"
        style={{ background: 'linear-gradient(90deg, var(--cx-bg), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10"
        style={{ background: 'linear-gradient(270deg, var(--cx-bg), transparent)' }}
      />
      <div
        className="flex gap-10 whitespace-nowrap w-max"
        style={{ animation: 'cx-ticker 55s linear infinite' }}
      >
        {items.map((coin, i) => (
          <span
            key={`${coin.id}-${i}`}
            className="inline-flex items-center gap-2.5 text-sm shrink-0"
            style={mono}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coin.image} alt="" className="size-4 rounded-full opacity-90" />
            <span className="uppercase text-[11px] tracking-wider text-[color:var(--cx-mute)]">
              {coin.symbol}
            </span>
            <span className="tabular-nums text-[color:var(--cx-fg)]">
              {formatUsd(coin.current_price)}
            </span>
            <Delta value={coin.price_change_percentage_24h} />
          </span>
        ))}
      </div>
      <style>{`
        @keyframes cx-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

type SortKey = 'rank' | 'price' | 'change24h' | 'market_cap' | 'volume'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'price', label: 'Price' },
  { key: 'change24h', label: '24h' },
  { key: 'market_cap', label: 'MCap' },
  { key: 'volume', label: 'Vol' },
]

export function CryptoMarket() {
  const [coins, setCoins] = useState<CoinMarket[]>([])
  const [global, setGlobal] = useState<GlobalMarketData['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('rank')
  const [countdown, setCountdown] = useState(30)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (search?: string) => {
    setRefreshing(true)
    try {
      const params = new URLSearchParams({ per_page: '50' })
      if (search?.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/crypto?${params}&t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setCoins(json.coins ?? [])
      if (json.global?.data) setGlobal(json.global.data)
      setError(null)
      setCountdown(30)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(query || undefined), REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchData, query])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchData(query || undefined), 400)
    return () => clearTimeout(t)
  }, [query, fetchData])

  const sorted = useMemo(() => {
    const list = [...coins]
    switch (sort) {
      case 'price':
        return list.sort((a, b) => b.current_price - a.current_price)
      case 'change24h':
        return list.sort(
          (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h,
        )
      case 'market_cap':
        return list.sort((a, b) => b.market_cap - a.market_cap)
      case 'volume':
        return list.sort((a, b) => b.total_volume - a.total_volume)
      default:
        return list.sort((a, b) => a.market_cap_rank - b.market_cap_rank)
    }
  }, [coins, sort])

  const hero = sorted[0]
  const board = sorted.slice(0, 5)

  if (loading && coins.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 space-y-6">
        <div className="h-16 w-48 bg-[color:var(--cx-fg)]/10 animate-pulse" />
        <div className="h-24 w-full max-w-xl bg-[color:var(--cx-fg)]/10 animate-pulse" />
        <div className="h-12 w-full bg-[color:var(--cx-fg)]/8 animate-pulse" />
        <div className="grid md:grid-cols-5 gap-px">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-40 bg-[color:var(--cx-fg)]/8 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mb-10 md:mb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10"
        >
          <div className="max-w-xl">
            <h1
              className="text-[clamp(3.5rem,14vw,8rem)] leading-[0.85] tracking-tight text-[color:var(--cx-fg)]"
              style={display}
            >
              Crypto
              <span style={{ color: 'var(--cx-signal)' }}>.</span>
            </h1>
          </div>

          {hero ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.55 }}
              className="relative border border-[color:var(--cx-line)] bg-[color:var(--cx-panel)] backdrop-blur-sm px-6 py-6 md:px-8 md:py-7 min-w-[min(100%,320px)]"
            >
              <div className="pointer-events-none absolute top-3 left-3 size-3 border-l border-t border-[color:var(--cx-signal)]" />
              <div className="pointer-events-none absolute top-3 right-3 size-3 border-r border-t border-[color:var(--cx-signal)]" />
              <div className="pointer-events-none absolute bottom-3 left-3 size-3 border-l border-b border-[color:var(--cx-signal)]" />
              <div className="pointer-events-none absolute bottom-3 right-3 size-3 border-r border-b border-[color:var(--cx-signal)]" />

              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero.image} alt="" className="size-9 rounded-full" />
                <div>
                  <p className="text-sm text-[color:var(--cx-fg)]" style={mark}>
                    {hero.name}
                  </p>
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    #{hero.market_cap_rank} · {hero.symbol}
                  </p>
                </div>
              </div>
              <p
                className="text-[clamp(1.8rem,5vw,2.75rem)] font-bold tabular-nums tracking-tight leading-none text-[color:var(--cx-fg)]"
                style={mono}
              >
                {formatUsd(hero.current_price)}
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <Delta value={hero.price_change_percentage_24h} large />
                <Sparkline
                  data={hero.sparkline_in_7d?.price ?? []}
                  positive={(hero.price_change_percentage_7d_in_currency ?? 0) >= 0}
                />
              </div>
            </motion.div>
          ) : null}
        </motion.div>
      </section>

      {/* Full-bleed tape */}
      <TickerTape coins={sorted} />

      {/* ── GLOBAL LEDGER ────────────────────────────────────────────────── */}
      {global ? (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-12">
          <div className="border-y border-[color:var(--cx-line)]">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                {
                  label: 'Market Cap',
                  value: formatUsd(global.total_market_cap.usd, true),
                  sub: formatPct(global.market_cap_change_percentage_24h_usd),
                },
                {
                  label: '24h Volume',
                  value: formatUsd(global.total_volume.usd, true),
                  sub: `${global.markets.toLocaleString()} venues`,
                },
                {
                  label: 'BTC Dom',
                  value: `${global.market_cap_percentage.btc.toFixed(1)}%`,
                  sub: `ETH ${global.market_cap_percentage.eth.toFixed(1)}%`,
                },
                {
                  label: 'Universe',
                  value: global.active_cryptocurrencies.toLocaleString(),
                  sub: 'assets tracked',
                },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={cn(
                    'px-4 py-5 md:py-6',
                    i % 2 === 1 && 'border-l border-[color:var(--cx-line-soft)]',
                    i >= 2 && 'border-t md:border-t-0 border-[color:var(--cx-line-soft)]',
                    i === 2 && 'md:border-l',
                  )}
                >
                  <p
                    className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
                    style={mono}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-xl md:text-2xl tabular-nums tracking-tight text-[color:var(--cx-fg)]"
                    style={mono}
                  >
                    {item.value}
                  </p>
                  <p className="mt-1 text-[11px] text-[color:var(--cx-mute)]" style={mono}>
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── TOP BOARD ────────────────────────────────────────────────────── */}
      {board.length > 0 ? (
        <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-14">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--cx-mute)] mb-1"
                style={mono}
              >
                Board
              </p>
              <h2 className="text-2xl md:text-3xl tracking-tight" style={display}>
                Top of tape
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[color:var(--cx-line)] border border-[color:var(--cx-line)]">
            {board.map((coin, i) => {
              const up = coin.price_change_percentage_24h >= 0
              return (
                <motion.div
                  key={coin.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="bg-[color:var(--cx-bg)] p-4 md:p-5 flex flex-col min-h-[160px]"
                >
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className="text-[10px] tabular-nums text-[color:var(--cx-mute)]"
                      style={mono}
                    >
                      {String(coin.market_cap_rank).padStart(2, '0')}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coin.image} alt="" className="size-6 rounded-full" />
                  </div>
                  <p
                    className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    {coin.symbol}
                  </p>
                  <p className="text-sm mt-0.5 text-[color:var(--cx-fg)] truncate" style={mark}>
                    {coin.name}
                  </p>
                  <p
                    className="mt-auto pt-4 text-lg font-semibold tabular-nums tracking-tight"
                    style={mono}
                  >
                    {formatUsd(coin.current_price)}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Delta value={coin.price_change_percentage_24h} />
                    <div className="opacity-80">
                      <Sparkline
                        data={coin.sparkline_in_7d?.price ?? []}
                        positive={(coin.price_change_percentage_7d_in_currency ?? 0) >= 0}
                      />
                    </div>
                  </div>
                  <div
                    className="mt-3 h-px w-full"
                    style={{ background: up ? 'var(--cx-up)' : 'var(--cx-down)', opacity: 0.45 }}
                  />
                </motion.div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ── CONTROLS + LEDGER ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 mt-10 md:mt-14">
        <div className="flex flex-col md:flex-row md:items-end gap-5 mb-6">
          <div className="flex-1">
            <label
              className="block text-[10px] uppercase tracking-[0.28em] text-[color:var(--cx-mute)] mb-2"
              style={mono}
            >
              Search tape
            </label>
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-[color:var(--cx-mute)]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="bitcoin, sol, eth…"
                className="w-full bg-transparent border-0 border-b border-[color:var(--cx-line)] focus:border-[color:var(--cx-signal)] pl-7 pr-2 py-3 text-base outline-none transition-colors placeholder:text-[color:var(--cx-mute)]"
                style={mono}
                aria-label="Search assets"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchData(query || undefined)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 h-11 px-4 border border-[color:var(--cx-line)] text-[10px] uppercase tracking-[0.2em] hover:bg-[color:var(--cx-signal)] hover:text-[color:var(--cx-signal-ink)] hover:border-[color:var(--cx-signal)] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            style={mono}
          >
            <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} />
            Live · {countdown}s
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mb-6">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSort(opt.key)}
              className={cn(
                'text-[10px] uppercase tracking-[0.18em] px-3 py-2 border transition-colors cursor-pointer',
                sort === opt.key
                  ? 'bg-[color:var(--cx-fg)] text-[color:var(--cx-bg)] border-[color:var(--cx-fg)]'
                  : 'border-[color:var(--cx-line)] text-[color:var(--cx-mute)] hover:text-[color:var(--cx-fg)]',
              )}
              style={mono}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error ? (
          <p
            className="mb-4 text-sm border border-[color:var(--cx-down)]/30 bg-[color:var(--cx-down)]/10 text-[color:var(--cx-down)] px-4 py-2.5"
            style={mono}
          >
            {error}
          </p>
        ) : null}

        {/* Desktop ledger header */}
        <div
          className="hidden lg:grid grid-cols-[3rem_minmax(0,1.4fr)_7.5rem_4rem_4.5rem_4rem_6.5rem_6.5rem] gap-3 px-1 py-3 border-b border-[color:var(--cx-line)] text-[10px] uppercase tracking-[0.22em] text-[color:var(--cx-mute)]"
          style={mono}
        >
          <span>#</span>
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">1h</span>
          <span className="text-right">24h</span>
          <span className="text-right">7d</span>
          <span className="text-right">MCap</span>
          <span className="text-right">Trend</span>
        </div>

        <div className="divide-y divide-[color:var(--cx-line-soft)]">
          <AnimatePresence mode="popLayout">
            {sorted.map((coin, i) => {
              const up24 = coin.price_change_percentage_24h >= 0
              return (
                <motion.div
                  key={coin.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.012, 0.25) }}
                  className="group relative grid grid-cols-1 lg:grid-cols-[3rem_minmax(0,1.4fr)_7.5rem_4rem_4.5rem_4rem_6.5rem_6.5rem] gap-2 lg:gap-3 px-1 py-4 items-center hover:bg-[color:var(--cx-tape)] transition-colors"
                >
                  <span
                    className="absolute left-0 top-3 bottom-3 w-px opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: up24 ? 'var(--cx-up)' : 'var(--cx-down)' }}
                  />

                  <span
                    className="hidden lg:block text-[11px] tabular-nums text-[color:var(--cx-mute)]"
                    style={mono}
                  >
                    {String(coin.market_cap_rank).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coin.image} alt="" className="size-8 rounded-full" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate text-[color:var(--cx-fg)]" style={mark}>
                        {coin.name}
                      </p>
                      <p
                        className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--cx-mute)]"
                        style={mono}
                      >
                        {coin.symbol}
                        <span className="lg:hidden ml-2 normal-case tracking-normal">
                          #{coin.market_cap_rank}
                        </span>
                      </p>
                    </div>
                    <div className="lg:hidden text-right">
                      <p className="text-sm font-semibold tabular-nums" style={mono}>
                        {formatUsd(coin.current_price)}
                      </p>
                      <Delta value={coin.price_change_percentage_24h} />
                    </div>
                  </div>

                  <span
                    className="hidden lg:block text-right text-sm font-semibold tabular-nums"
                    style={mono}
                  >
                    {formatUsd(coin.current_price)}
                  </span>

                  <span className="hidden lg:flex justify-end">
                    {coin.price_change_percentage_1h_in_currency != null ? (
                      <Delta value={coin.price_change_percentage_1h_in_currency} />
                    ) : (
                      <span className="text-[color:var(--cx-mute)] text-xs">—</span>
                    )}
                  </span>

                  <span className="hidden lg:flex justify-end">
                    <Delta value={coin.price_change_percentage_24h} />
                  </span>

                  <span className="hidden lg:flex justify-end">
                    {coin.price_change_percentage_7d_in_currency != null ? (
                      <Delta value={coin.price_change_percentage_7d_in_currency} />
                    ) : (
                      <span className="text-[color:var(--cx-mute)] text-xs">—</span>
                    )}
                  </span>

                  <span
                    className="hidden lg:block text-right text-xs text-[color:var(--cx-mute)] tabular-nums"
                    style={mono}
                  >
                    {formatUsd(coin.market_cap, true)}
                  </span>

                  <div className="hidden lg:flex justify-end opacity-75 group-hover:opacity-100 transition-opacity">
                    <Sparkline
                      data={coin.sparkline_in_7d?.price ?? []}
                      positive={(coin.price_change_percentage_7d_in_currency ?? 0) >= 0}
                    />
                  </div>

                  <div className="flex lg:hidden items-center justify-between col-span-full pt-2 border-t border-[color:var(--cx-line-soft)] mt-1">
                    <span className="text-[11px] text-[color:var(--cx-mute)]" style={mono}>
                      MCap {formatUsd(coin.market_cap, true)} · Vol{' '}
                      {formatUsd(coin.total_volume, true)}
                    </span>
                    <Sparkline
                      data={coin.sparkline_in_7d?.price ?? []}
                      positive={(coin.price_change_percentage_7d_in_currency ?? 0) >= 0}
                    />
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
