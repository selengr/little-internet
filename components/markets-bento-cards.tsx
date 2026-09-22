'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { CoinMarket } from '@/types/coingecko'
import { formatPct, formatUsd } from '@/lib/crypto-format'

const REFRESH_MS = 30_000

const CARD_IMAGES = {
  // Gold bitcoin on dark keyboard — premium, readable under text
  crypto:
    'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=1400&q=85',
  // Cool-toned dollar field — clear “currency convert” signal
  convert:
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1400&q=85',
  // Glowing trading screens — charts / candles
  charts:
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=85',
} as const

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true)
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function MarketBentoCard({
  children,
  className = '',
  delay = 0,
  image,
  wash = 'from-[#0f1419]/45 via-[#0f1419]/55 to-[#0f1419]/92',
  imagePosition = 'object-center',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  image: string
  wash?: string
  imagePosition?: string
}) {
  const { ref, inView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl border border-white/10 overflow-hidden transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        aria-hidden
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.05] ${imagePosition}`}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${wash}`} />
      <div className="absolute inset-0 bg-[#0f1419]/30" />
      {children}
    </div>
  )
}

function pctColor(pct: number) {
  if (Number.isNaN(pct)) return 'rgba(255,255,255,0.5)'
  return pct >= 0 ? '#6ee7b7' : '#fda4af'
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300/90">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  )
}

function CardArrow() {
  return (
    <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/85 backdrop-blur-md transition-all duration-500 ease-out group-hover:scale-110 group-hover:bg-white group-hover:text-stone-900 group-hover:border-white group-hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.55)]">
      <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </span>
  )
}

export function MarketsBentoCards() {
  const [btc, setBtc] = useState<CoinMarket | null>(null)
  const [eth, setEth] = useState<CoinMarket | null>(null)
  const [usdIrr, setUsdIrr] = useState<{ rate: number; changePct: number | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [cryptoRes, usdIrrRes] = await Promise.all([
          fetch('/api/crypto?per_page=5', { cache: 'no-store' }),
          fetch('/api/forex?action=rate&base=USD&quote=IRR', { cache: 'no-store' }),
        ])

        const cryptoJson = await cryptoRes.json()
        const usdIrrJson = await usdIrrRes.json()

        if (!cancelled) {
          const coins: CoinMarket[] = cryptoJson.coins ?? []
          setBtc(coins.find(c => c.symbol.toLowerCase() === 'btc') ?? coins[0] ?? null)
          setEth(coins.find(c => c.symbol.toLowerCase() === 'eth') ?? coins[1] ?? null)

          if (usdIrrJson?.rate?.rate != null) {
            setUsdIrr({
              rate: Number(usdIrrJson.rate.rate),
              changePct:
                typeof usdIrrJson.meta?.changePct === 'number' ? usdIrrJson.meta.changePct : null,
            })
          }
        }
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

  const btcPrice = loading && !btc ? '—' : btc ? formatUsd(btc.current_price) : '—'
  const btcPctNum = btc?.price_change_percentage_24h
  const btcPct = loading && !btc ? null : btcPctNum != null ? formatPct(btcPctNum) : null

  const ethPrice = loading && !eth ? '—' : eth ? formatUsd(eth.current_price) : '—'
  const ethPctNum = eth?.price_change_percentage_24h
  const ethPct = loading && !eth ? null : ethPctNum != null ? formatPct(ethPctNum) : null

  const irrRate = usdIrr?.rate
  const irrFormatted =
    loading && !usdIrr
      ? '—'
      : irrRate != null
        ? Math.round(irrRate).toLocaleString()
        : '—'
  const tomanFormatted =
    irrRate != null ? Math.round(irrRate / 10).toLocaleString() : null
  const irrPct =
    usdIrr?.changePct != null
      ? `${usdIrr.changePct >= 0 ? '+' : ''}${usdIrr.changePct.toFixed(2)}%`
      : null

  return (
    <>
      {/* Crypto — live BTC hero */}
      <Link href="/crypto" className="col-span-12 md:col-span-4 block">
        <MarketBentoCard
          className="p-0 min-h-[240px] h-full cursor-pointer"
          delay={120}
          image={CARD_IMAGES.crypto}
          imagePosition="object-[center_35%]"
          wash="from-[#0a0c0e]/55 via-[#0a0c0e]/50 to-[#0a0c0e]/94"
        >
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[240px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <p className="text-[10px] tracking-[0.22em] uppercase text-white/50">Crypto</p>
                <LiveBadge />
              </div>
              <CardArrow />
            </div>

            <div className="mt-8 mb-4">
              <p className="text-[13px] text-white/55 mb-2 tracking-wide">Bitcoin · BTC</p>
              <p className="text-[clamp(1.85rem,4vw,2.35rem)] font-light leading-none tracking-tight text-white tabular-nums">
                {btcPrice}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
                {btcPct ? (
                  <span style={{ color: pctColor(btcPctNum ?? NaN) }}>{btcPct} 24h</span>
                ) : null}
                {eth ? (
                  <span>
                    ETH {ethPrice}
                    {ethPct ? (
                      <span className="ml-1.5" style={{ color: pctColor(ethPctNum ?? NaN) }}>
                        {ethPct}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-[15px] font-light text-white mb-2">Live crypto prices</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Bitcoin, Ethereum, and the top coins — refreshed every 30 seconds.
              </p>
            </div>
          </div>
        </MarketBentoCard>
      </Link>

      {/* Convert — live USD → IRR */}
      <Link href="/convert" className="col-span-12 md:col-span-4 block">
        <MarketBentoCard
          className="p-0 min-h-[240px] h-full cursor-pointer"
          delay={160}
          image={CARD_IMAGES.convert}
          wash="from-[#071018]/50 via-[#071018]/55 to-[#071018]/94"
        >
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[240px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <p className="text-[10px] tracking-[0.22em] uppercase text-white/50">Convert</p>
                <LiveBadge />
              </div>
              <CardArrow />
            </div>

            <div className="mt-8 mb-4">
              <p className="text-[13px] text-white/55 mb-2 tracking-wide">1 USD → IRR</p>
              <p className="text-[clamp(1.85rem,4vw,2.35rem)] font-light leading-none tracking-tight text-white tabular-nums">
                {irrFormatted}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
                {tomanFormatted ? <span>≈ {tomanFormatted} toman</span> : null}
                {irrPct ? (
                  <span style={{ color: pctColor(parseFloat(irrPct)) }}>{irrPct}</span>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-[15px] font-light text-white mb-2">Convert currency</h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Free-market rates — convert any pair, starting with live USD to Iranian Rial.
              </p>
            </div>
          </div>
        </MarketBentoCard>
      </Link>

      <Link href="/charts" className="col-span-12 md:col-span-4 block">
        <MarketBentoCard
          className="p-0 min-h-[240px] h-full cursor-pointer"
          delay={200}
          image={CARD_IMAGES.charts}
          imagePosition="object-[center_40%]"
          wash="from-[#0a1210]/45 via-[#0a1210]/60 to-[#0a1210]/94"
        >
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[240px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <p className="text-[10px] tracking-[0.22em] uppercase text-white/50">Charts</p>
                <LiveBadge />
              </div>
              <CardArrow />
            </div>

            <div className="mt-auto pt-10">
              <h3 className="text-[clamp(1.85rem,4vw,2.35rem)] font-light leading-none tracking-tight text-white">
                Live charts
              </h3>
              <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-[18rem]">
                Candles and buy/sell tips for major coins.
              </p>
            </div>
          </div>
        </MarketBentoCard>
      </Link>
    </>
  )
}
