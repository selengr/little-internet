'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { CoinMarket } from '@/types/coingecko'
import { formatPct, formatUsd } from '@/lib/crypto-format'

const REFRESH_MS = 30_000

/** Night city lights — cinematic depth, cool atmosphere for the pulse */
const ATMOSPHERE =
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=2000&q=85'

function buildHorizon(prices: number[], w = 1200, h = 280) {
  if (prices.length < 2) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const pts = prices.map((v, i) => {
    const x = (i / (prices.length - 1)) * w
    const y = h - ((v - min) / range) * (h * 0.62) - h * 0.18
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const fill = `${line} L${w},${h} L0,${h} Z`
  const last = pts[pts.length - 1]
  // approximate path length for draw animation
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0]
    const dy = pts[i][1] - pts[i - 1][1]
    len += Math.hypot(dx, dy)
  }
  return { line, fill, lastX: last[0], lastY: last[1], len }
}

export function MarketsBanner() {
  const [btc, setBtc] = useState<CoinMarket | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawn, setDrawn] = useState(false)
  const gradId = useId().replace(/:/g, '')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/crypto?per_page=1', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled && json.coins?.[0]) setBtc(json.coins[0])
      } catch {
        // keep last good data
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!btc?.sparkline_in_7d?.price?.length) return
    const t = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(t)
  }, [btc])

  const change24h = btc?.price_change_percentage_24h ?? 0
  const up = change24h >= 0
  const ink = up ? '#6ee7b7' : '#fda4af'
  const prices = btc?.sparkline_in_7d?.price ?? []
  const horizon = useMemo(() => buildHorizon(prices), [prices])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 min-h-[340px] md:min-h-[400px] text-white group/banner">
      {/* Atmosphere */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ATMOSPHERE}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-[center_40%] scale-105 transition-transform duration-[1.4s] ease-out group-hover/banner:scale-110"
      />

      {/* Cinematic wash */}
      <div className="absolute inset-0 bg-[#07090c]/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#07090c]/95 via-[#07090c]/70 to-[#07090c]/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#07090c] via-[#07090c]/40 to-transparent" />
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: up
            ? 'radial-gradient(ellipse 70% 55% at 75% 45%, rgba(110,231,183,0.14), transparent 60%)'
            : 'radial-gradient(ellipse 70% 55% at 75% 45%, rgba(253,164,175,0.12), transparent 60%)',
        }}
      />

      {/* Luminous 7-day pulse */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full h-[55%] md:h-[60%] opacity-95 pointer-events-none"
        viewBox="0 0 1200 280"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ink} stopOpacity="0.28" />
            <stop offset="55%" stopColor={ink} stopOpacity="0.06" />
            <stop offset="100%" stopColor={ink} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${gradId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={ink} stopOpacity="0.15" />
            <stop offset="35%" stopColor={ink} stopOpacity="0.95" />
            <stop offset="100%" stopColor={ink} stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {horizon ? (
          <>
            <path d={horizon.fill} fill={`url(#fill-${gradId})`} />
            <path
              d={horizon.line}
              fill="none"
              stroke={`url(#stroke-${gradId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${gradId})`}
              style={{
                strokeDasharray: horizon.len,
                strokeDashoffset: drawn ? 0 : horizon.len,
                transition: 'stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />
            <circle
              cx={horizon.lastX}
              cy={horizon.lastY}
              r="5"
              fill={ink}
              style={{
                opacity: drawn ? 1 : 0,
                transition: 'opacity 0.4s ease 1.5s',
              }}
            />
            <circle cx={horizon.lastX} cy={horizon.lastY} r="14" fill={ink} opacity="0.22">
              <animate attributeName="r" values="10;20;10" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.28;0.08;0.28" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </>
        ) : null}
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between min-h-[340px] md:min-h-[400px] p-7 md:p-10 lg:p-12">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-emerald-300/90">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
            <span className="text-white/25">·</span>
            <p className="text-[10px] tracking-[0.22em] uppercase text-white/45">
              Bitcoin · 7-day pulse
            </p>
          </div>

          <Link
            href="/crypto"
            className="inline-flex items-center gap-1.5 text-[12px] tracking-wide text-white/60 hover:text-white transition-colors"
          >
            Open board
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-auto pt-16 md:pt-20 max-w-2xl">
          <p className="text-[11px] tracking-[0.28em] uppercase text-white/40 mb-4">
            BTC / USD
          </p>

          {loading && !btc ? (
            <div className="h-16 md:h-[4.5rem] w-64 md:w-80 bg-white/10 rounded-lg animate-pulse" />
          ) : (
            <p className="font-light tracking-tight tabular-nums leading-none text-[clamp(3rem,9vw,5.75rem)] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.5)]">
              {btc ? formatUsd(btc.current_price) : '—'}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span
              className="inline-flex items-center gap-2 text-base md:text-lg font-light tabular-nums"
              style={{ color: ink }}
            >
              <span className="text-lg leading-none opacity-80">{up ? '↑' : '↓'}</span>
              {formatPct(change24h)}
              <span className="text-white/35 text-sm font-normal">24h</span>
            </span>

            <span className="hidden sm:inline text-white/20">|</span>

            <span className="text-sm text-white/45 tabular-nums">
              Cap {btc ? formatUsd(btc.market_cap, true) : '—'}
            </span>
            <span className="text-sm text-white/45 tabular-nums">
              Vol {btc ? formatUsd(btc.total_volume, true) : '—'}
            </span>
            <span className="text-sm text-white/35">
              Rank #{btc?.market_cap_rank ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
