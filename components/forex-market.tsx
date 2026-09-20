'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownUp, RefreshCw } from 'lucide-react'
import type { ForexPeriod, FrankfurterCurrency } from '@/types/frankfurter'
import {
  FALLBACK_CURRENCIES,
  POPULAR_PAIRS,
  REFRESH_MS,
  formatConverted,
  formatRate,
  pctChange,
  periodLabel,
} from '@/lib/frankfurter'
import { ForexChart } from '@/components/forex-chart'
import { CurrencyCombobox } from '@/components/currency-combobox'
import { cn } from '@/lib/utils'

const PERIODS: ForexPeriod[] = ['today', '7', '30', '90', '365']
const DEFAULT_BASE = 'USD'
const DEFAULT_QUOTE = 'IRR'

const mono = { fontFamily: 'var(--font-fx-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-fx-display), Georgia, serif' } as const
const mark = { fontFamily: 'var(--font-fx-mark), system-ui, sans-serif' } as const

function Delta({ value, large }: { value: number; large?: boolean }) {
  const up = value >= 0
  return (
    <span
      className={cn('font-semibold tabular-nums', large ? 'text-base md:text-lg' : 'text-xs')}
      style={{ ...mono, color: up ? 'var(--fx-up)' : 'var(--fx-down)' }}
    >
      {up ? '+' : ''}
      {value.toFixed(2)}%
    </span>
  )
}

function formatIrr(rate: number): string {
  return rate.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function ForexMarket() {
  const [currencies, setCurrencies] = useState<FrankfurterCurrency[]>([
    ...FALLBACK_CURRENCIES,
    { iso_code: 'IRR', name: 'Iranian Rial (free market)', symbol: '﷼' },
  ])
  const [base, setBase] = useState(DEFAULT_BASE)
  const [quote, setQuote] = useState(DEFAULT_QUOTE)
  const [period, setPeriod] = useState<ForexPeriod>('today')
  const [amount, setAmount] = useState('1')
  const [rate, setRate] = useState<number | null>(null)
  const [rateDate, setRateDate] = useState<string | null>(null)
  const [series, setSeries] = useState<{ date: string; rate: number }[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pulse, setPulse] = useState(false)
  const [rateSource, setRateSource] = useState<string | null>(null)
  const prevRateRef = useRef<number | null>(null)

  useEffect(() => {
    fetch('/api/forex?action=currencies')
      .then(r => r.json())
      .then(json => {
        if (json.currencies?.length) {
          const list = json.currencies as FrankfurterCurrency[]
          if (!list.some(c => c.iso_code === 'IRR')) {
            list.push({ iso_code: 'IRR', name: 'Iranian Rial (free market)', symbol: '﷼' })
          }
          setCurrencies(list)
        }
      })
      .catch(() => {})
  }, [])

  const fetchRate = useCallback(async () => {
    if (base === quote) {
      setError('Choose two different currencies.')
      setLoading(false)
      return
    }

    setRefreshing(true)
    try {
      const res = await fetch(
        `/api/forex?action=rate&base=${base}&quote=${quote}&t=${Date.now()}`,
        { cache: 'no-store' },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Rate fetch failed')

      const next = json.rate.rate as number
      if (prevRateRef.current != null && prevRateRef.current !== next) {
        setPulse(true)
        setTimeout(() => setPulse(false), 600)
      }
      prevRateRef.current = next
      setRate(next)
      setRateDate(json.rate.date)
      setRateSource(json.meta?.source ?? null)
      setLastUpdated(new Date())
      setCountdown(30)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rate')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [base, quote])

  const fetchHistory = useCallback(async () => {
    if (base === quote) return
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({ base, quote })
      const res = await fetch(`/api/forex?action=series&days=${period}&${params}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'History fetch failed')
      setSeries(json.series ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
      setSeries([])
    } finally {
      setHistoryLoading(false)
    }
  }, [base, quote, period])

  useEffect(() => {
    void fetchRate()
    const interval = setInterval(() => void fetchRate(), REFRESH_MS)
    return () => clearInterval(interval)
  }, [fetchRate])

  useEffect(() => {
    void fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c <= 1 ? 30 : c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const swap = () => {
    setBase(quote)
    setQuote(base)
  }

  const change = useMemo(() => {
    if (series.length < 2) return 0
    return pctChange(series[0].rate, series[series.length - 1].rate)
  }, [series])

  const converted = useMemo(() => {
    const n = parseFloat(amount)
    if (!rate || Number.isNaN(n)) return null
    return n * rate
  }, [amount, rate])

  const sortedCurrencies = useMemo(
    () => [...currencies].sort((a, b) => a.iso_code.localeCompare(b.iso_code)),
    [currencies],
  )

  const displayRate = (value: number, code: string) =>
    code === 'IRR' ? formatIrr(value) : formatRate(value, code)

  const quoteName = currencies.find(c => c.iso_code === quote)?.name ?? quote
  const involvesIrr = base === 'IRR' || quote === 'IRR'
  const isFreeMarket = involvesIrr || rateSource === 'tgju-free-market'
  const tomanHint =
    quote === 'IRR' && rate != null
      ? `≈ ${Math.round(rate / 10).toLocaleString()} toman`
      : null

  if (loading && rate == null) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10 space-y-6">
        <div className="h-14 w-40 bg-[color:var(--fx-fg)]/10 animate-pulse" />
        <div className="h-24 w-full max-w-lg bg-[color:var(--fx-fg)]/10 animate-pulse" />
        <div className="h-64 w-full bg-[color:var(--fx-fg)]/8 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 space-y-12 md:space-y-16 pb-8">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10"
        >
          <div className="max-w-xl">
            <p
              className="text-[10px] uppercase tracking-[0.35em] text-[color:var(--fx-mute)] mb-3"
              style={mono}
            >
              Exchange
            </p>
            <h1
              className="text-[clamp(2.75rem,10vw,5.5rem)] leading-[0.9] tracking-tight text-[color:var(--fx-fg)]"
              style={display}
            >
              Convert currency
            </h1>
            <p className="mt-3 text-sm text-[color:var(--fx-mute)] max-w-md">
              Live rates, popular pairs, and history — including USD to Iranian Rial.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border border-[color:var(--fx-line)] bg-[color:var(--fx-panel)] backdrop-blur-sm px-6 py-6 md:px-8 md:py-7 min-w-[min(100%,340px)] shadow-[var(--fx-shadow)] transition-shadow',
              pulse && 'shadow-[0_0_0_1px_var(--fx-accent)]',
            )}
          >
            <div className="pointer-events-none absolute top-3 left-3 size-3 border-l border-t border-[color:var(--fx-accent)] rounded-tl-sm" />
            <div className="pointer-events-none absolute top-3 right-3 size-3 border-r border-t border-[color:var(--fx-accent)] rounded-tr-sm" />
            <div className="pointer-events-none absolute bottom-3 left-3 size-3 border-l border-b border-[color:var(--fx-accent)] rounded-bl-sm" />
            <div className="pointer-events-none absolute bottom-3 right-3 size-3 border-r border-b border-[color:var(--fx-accent)] rounded-br-sm" />

            <p
              className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--fx-mute)] mb-3"
              style={mono}
            >
              {base} → {quote}
              {rateDate ? ` · ${rateDate}` : ''}
              {isFreeMarket ? ' · free market' : ''}
            </p>
            <p className="text-sm text-[color:var(--fx-mute)] mb-1" style={mono}>
              1 <span className="text-[color:var(--fx-fg)]">{base}</span> =
            </p>
            <p
              className="text-[clamp(1.9rem,5vw,2.85rem)] font-bold tabular-nums tracking-tight leading-none text-[color:var(--fx-fg)]"
              style={mono}
            >
              {rate != null ? displayRate(rate, quote) : '—'}{' '}
              <span className="text-xl font-medium text-[color:var(--fx-mute)]">{quote}</span>
            </p>
            {tomanHint ? (
              <p className="mt-2 text-sm text-[color:var(--fx-mute)]" style={mono}>
                {tomanHint}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <Delta value={change} large />
                <p className="mt-1 text-[10px] text-[color:var(--fx-mute)]" style={mono}>
                  {period === 'today' ? 'vs prior session' : `${periodLabel(period)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void fetchRate()}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--fx-mute)] hover:text-[color:var(--fx-accent)] transition-colors cursor-pointer disabled:opacity-50"
                style={mono}
              >
                <RefreshCw className={cn('size-3', refreshing && 'animate-spin')} />
                {countdown}s
              </button>
            </div>
            <p className="mt-3 text-xs text-[color:var(--fx-mute)]">
              {involvesIrr
                ? 'Iran free-market rate (TGJU) · not ECB/official'
                : quoteName}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── CONVERTER ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--fx-mute)] mb-1"
              style={mono}
            >
              Desk
            </p>
            <h2 className="text-2xl md:text-3xl tracking-tight" style={display}>
              Convert
            </h2>
          </div>
          <p className="text-xs tabular-nums text-[color:var(--fx-mute)] hidden sm:block" style={mono}>
            1 {base} = {rate != null ? displayRate(rate, quote) : '—'} {quote}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--fx-line)] bg-[color:var(--fx-panel)] backdrop-blur-sm shadow-[var(--fx-shadow)]">
          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-0">
            {/* From */}
            <div className="p-5 md:p-7 border-b lg:border-b-0 lg:border-r border-[color:var(--fx-line-soft)]">
              <CurrencyCombobox
                label="From"
                value={base}
                currencies={sortedCurrencies}
                onChange={setBase}
              />
              <div className="mt-5">
                <p
                  className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--fx-mute)]"
                  style={mono}
                >
                  Amount
                </p>
                <div className="relative border-b-2 border-[color:var(--fx-line)] focus-within:border-[color:var(--fx-fg)] transition-colors">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-transparent py-3 pr-14 text-3xl font-light tabular-nums tracking-tight outline-none placeholder:text-[color:var(--fx-mute)]"
                    style={mono}
                    placeholder="0"
                  />
                  <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-[color:var(--fx-mute)]"
                    style={mono}
                  >
                    {base}
                  </span>
                </div>
              </div>
            </div>

            {/* Swap */}
            <div className="flex items-center justify-center py-3 lg:py-0 lg:px-3 border-b lg:border-b-0 lg:border-r border-[color:var(--fx-line-soft)]">
              <button
                type="button"
                onClick={swap}
                className="inline-flex size-11 items-center justify-center rounded-full border border-[color:var(--fx-line)] text-[color:var(--fx-fg)] hover:bg-[color:var(--fx-accent)] hover:text-[color:var(--fx-on-accent)] hover:border-[color:var(--fx-accent)] transition-colors cursor-pointer"
                aria-label="Swap currencies"
              >
                <ArrowDownUp className="size-4" />
              </button>
            </div>

            {/* To */}
            <div className="p-5 md:p-7">
              <CurrencyCombobox
                label="To"
                value={quote}
                currencies={sortedCurrencies}
                onChange={setQuote}
              />
              <div className="mt-5">
                <p
                  className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--fx-mute)]"
                  style={mono}
                >
                  You get
                </p>
                <div className="border-b border-[color:var(--fx-line)] py-3 flex items-baseline justify-between gap-3">
                  <p
                    className="text-3xl font-light tabular-nums tracking-tight truncate text-[color:var(--fx-fg)]"
                    style={mono}
                  >
                    {converted != null
                      ? quote === 'IRR'
                        ? formatIrr(converted)
                        : formatConverted(converted, quote)
                      : '—'}
                  </p>
                  <span className="text-xs text-[color:var(--fx-mute)] shrink-0" style={mono}>
                    {quote}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Signature pairs */}
          <div className="border-t border-[color:var(--fx-line-soft)] px-5 md:px-7 py-4">
            <p
              className="mb-3 text-[10px] uppercase tracking-[0.22em] text-[color:var(--fx-mute)]"
              style={mono}
            >
              Signature crosses
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { base: 'USD', quote: 'IRR', label: 'USD/IRR' },
                ...POPULAR_PAIRS.map(p => ({
                  base: p.base,
                  quote: p.quote,
                  label: `${p.base}/${p.quote}`,
                })),
              ].map(p => {
                const active = base === p.base && quote === p.quote
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setBase(p.base)
                      setQuote(p.quote)
                    }}
                    className={cn(
                      'text-[11px] px-3 py-2 rounded-full border transition-colors cursor-pointer',
                      active
                        ? 'bg-[color:var(--fx-fg)] text-[color:var(--fx-bg)] border-[color:var(--fx-fg)]'
                        : 'border-[color:var(--fx-line)] text-[color:var(--fx-mute)] hover:text-[color:var(--fx-fg)] hover:border-[color:var(--fx-fg)]/40 hover:bg-[color:var(--fx-line-soft)]',
                    )}
                    style={mono}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── HISTORY ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <p
              className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--fx-mute)] mb-1"
              style={mono}
            >
              Series
            </p>
            <h2 className="text-2xl md:text-3xl tracking-tight" style={display}>
              {period === 'today' ? 'Session' : 'History'}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setPeriod(d)}
                className={cn(
                  'text-[10px] uppercase tracking-[0.16em] px-3 py-2 rounded-full border transition-colors cursor-pointer',
                  period === d
                    ? 'bg-[color:var(--fx-fg)] text-[color:var(--fx-bg)] border-[color:var(--fx-fg)]'
                    : 'border-[color:var(--fx-line)] text-[color:var(--fx-mute)] hover:text-[color:var(--fx-fg)] hover:bg-[color:var(--fx-line-soft)]',
                )}
                style={mono}
              >
                {periodLabel(d)}
              </button>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'overflow-hidden rounded-2xl border border-[color:var(--fx-line)] bg-[color:var(--fx-panel)] backdrop-blur-sm p-5 md:p-7 shadow-[var(--fx-shadow)] transition-opacity',
            historyLoading && 'opacity-60',
          )}
        >
          <div className="flex items-center justify-between gap-3 mb-6">
            <p className="text-xs text-[color:var(--fx-mute)]" style={mono}>
              {base}/{quote}
              {lastUpdated
                ? ` · updated ${lastUpdated.toLocaleTimeString()}`
                : ''}
            </p>
            <Delta value={change} />
          </div>

          {error ? (
            <p
              className="text-sm rounded-xl border border-[color:var(--fx-down)]/30 bg-[color:var(--fx-down)]/10 text-[color:var(--fx-down)] px-4 py-3"
              style={mono}
            >
              {error}
            </p>
          ) : period === 'today' ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-px overflow-hidden rounded-xl bg-[color:var(--fx-line)] border border-[color:var(--fx-line)]">
                <div className="bg-[color:var(--fx-panel)] p-5">
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--fx-mute)] mb-2"
                    style={mono}
                  >
                    Latest
                  </p>
                  <p
                    className="text-3xl font-semibold tabular-nums text-[color:var(--fx-fg)]"
                    style={mono}
                  >
                    {series[series.length - 1]
                      ? displayRate(series[series.length - 1].rate, quote)
                      : rate != null
                        ? displayRate(rate, quote)
                        : '—'}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--fx-mute)]" style={mono}>
                    {series[series.length - 1]?.date ?? rateDate ?? '—'}
                  </p>
                </div>
                <div className="bg-[color:var(--fx-panel)] p-5">
                  <p
                    className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--fx-mute)] mb-2"
                    style={mono}
                  >
                    Previous
                  </p>
                  <p
                    className="text-3xl font-semibold tabular-nums text-[color:var(--fx-fg)]"
                    style={mono}
                  >
                    {series.length > 1 ? displayRate(series[0].rate, quote) : '—'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-xs text-[color:var(--fx-mute)]" style={mono}>
                      {series.length > 1 ? series[0].date : 'Waiting for prior fix'}
                    </p>
                    {series.length > 1 && <Delta value={change} />}
                  </div>
                </div>
              </div>
              {series.length >= 2 && (
                <ForexChart data={series} positive={change >= 0} height={180} />
              )}
            </div>
          ) : (
            <ForexChart data={series} positive={change >= 0} />
          )}
        </div>
      </section>
    </div>
  )
}
