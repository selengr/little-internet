'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Instrument_Serif } from 'next/font/google'
import type { CoinMarket } from '@/types/coingecko'
import { formatPct, formatUsd } from '@/lib/crypto-format'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
})

const REFRESH_MS = 30_000

const CARD_IMAGES = {
  crypto:
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80',
  convert:
    'https://images.unsplash.com/photo-1579621970795-87facc2f976d?auto=format&fit=crop&w=1200&q=80',
  soon:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
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
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  image: string
  wash?: string
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
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${wash}`} />
      <div className="absolute inset-0 bg-[#0f1419]/25" />
      {children}
    </div>
  )
}

function pctColor(pct: number) {
  if (Number.isNaN(pct)) return 'rgba(255,255,255,0.5)'
  return pct >= 0 ? '#6ee7b7' : '#fda4af'
}

function sampleSparkline(prices: number[], count = 11): number[] {
  if (prices.length <= count) return prices
  const step = (prices.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => prices[Math.round(i * step)])
}

function buildChartPaths(
  prices: number[],
  width = 300,
  yBottom = 150,
  yRange = 90,
) {
  const sampled = sampleSparkline(prices)
  if (sampled.length < 2) return null

  const min = Math.min(...sampled)
  const max = Math.max(...sampled)
  const range = max - min || 1

  const pts = sampled.map((v, i) => ({
    x: (i / (sampled.length - 1)) * width,
    y: yBottom - ((v - min) / range) * yRange,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(0)},${p.y.toFixed(1)}`).join(' ')
  const fill = `${line} L${width},240 L0,240 Z`
  const last = pts[pts.length - 1]

  return { line, fill, lastX: last.x, lastY: last.y }
}

function PriceLabel({
  x,
  pairLabel,
  pairColor,
  price,
  pct,
  priceX = x,
  pctX,
}: {
  x: number
  pairLabel: string
  pairColor: string
  price: string
  pct: string
  priceX?: number
  pctX: number
}) {
  const change = parseFloat(pct)
  return (
    <>
      <text x={x} y="22" fill={pairColor} fontSize="8.5" fontFamily="monospace" opacity=".85">
        {pairLabel}
      </text>
      <text x={priceX} y="38" fill="#ffffff" fontSize="12" fontFamily="monospace" fontWeight="700">
        {price}
      </text>
      <text x={pctX} y="38" fill={pctColor(change)} fontSize="9" fontFamily="monospace">
        {pct}
      </text>
    </>
  )
}

export function MarketsBentoCards() {
  const [btc, setBtc] = useState<CoinMarket | null>(null)
  const [eth, setEth] = useState<CoinMarket | null>(null)
  const [usdIrr, setUsdIrr] = useState<{ rate: number; changePct: number | null; date: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [cryptoRes, usdIrrRes] = await Promise.all([
          fetch('/api/crypto?per_page=2', { cache: 'no-store' }),
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
              date: usdIrrJson.rate.date ?? null,
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

  const btcChart = btc?.sparkline_in_7d?.price
    ? buildChartPaths(btc.sparkline_in_7d.price)
    : null

  const btcPrice = loading && !btc ? '—' : btc ? formatUsd(btc.current_price) : '—'
  const btcPct = loading && !btc ? '—' : btc ? formatPct(btc.price_change_percentage_24h) : '—'
  const ethPrice = loading && !eth ? '—' : eth ? formatUsd(eth.current_price) : '—'
  const ethPct = loading && !eth ? '—' : eth ? formatPct(eth.price_change_percentage_24h) : '—'

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
      {/* Crypto */}
      <Link href="/crypto" className="col-span-12 md:col-span-4 block">
        <MarketBentoCard
          className="p-0 min-h-[240px] h-full cursor-pointer"
          delay={120}
          image={CARD_IMAGES.crypto}
          wash="from-[#0c1210]/30 via-[#0c1210]/50 to-[#0c1210]/92"
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 300 240"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity=".28" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            {btcChart ? (
              <>
                <path d={btcChart.fill} fill="url(#cg)" />
                <path d={btcChart.line} fill="none" stroke="#6ee7b7" strokeWidth="1.6" />
                <circle cx={btcChart.lastX} cy={btcChart.lastY} r="3" fill="#6ee7b7" />
              </>
            ) : null}
            <PriceLabel x={16} pairLabel="BTC / USD" pairColor="#a7f3d0" price={btcPrice} pct={btcPct} pctX={88} />
            <PriceLabel x={168} pairLabel="ETH / USD" pairColor="#e7e5e4" price={ethPrice} pct={ethPct} pctX={236} />
          </svg>

          <div className="relative z-10 flex flex-col justify-end h-full p-6 pt-28">
            <p className="text-[10px] tracking-[0.22em] uppercase text-white/50 mb-2">Crypto</p>
            <h3 className="text-[15px] font-light text-white mb-2">Live crypto prices</h3>
            <p className="text-sm text-white/55 leading-relaxed">
              Bitcoin, Ethereum, and the top coins — updated every 30 seconds.
            </p>
          </div>
        </MarketBentoCard>
      </Link>

      {/* Convert — live USD → IRR */}
      <Link href="/convert" className="col-span-12 md:col-span-4 block">
        <MarketBentoCard
          className="p-0 min-h-[240px] h-full cursor-pointer"
          delay={160}
          image={CARD_IMAGES.convert}
          wash="from-[#0a1018]/40 via-[#0a1018]/60 to-[#0a1018]/94"
        >
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[240px] p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/50">Convert</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300/90">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            </div>

            <div className="mt-8 mb-4">
              <p
                className="text-[13px] text-white/55 mb-2 tracking-wide"
                style={{ fontFamily: display.style.fontFamily }}
              >
                1 USD → IRR
              </p>
              <p
                className="text-[clamp(1.85rem,4vw,2.35rem)] leading-none tracking-tight text-white tabular-nums"
                style={{ fontFamily: display.style.fontFamily }}
              >
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
              <h3
                className="text-[1.35rem] leading-tight tracking-tight text-white mb-1.5"
                style={{ fontFamily: display.style.fontFamily }}
              >
                Convert currency
              </h3>
              <p className="text-sm text-white/55 leading-relaxed">
                Free-market rates — convert any pair, starting with live USD to Iranian Rial.
              </p>
            </div>
          </div>
        </MarketBentoCard>
      </Link>

      {/* Soon */}
      <MarketBentoCard
        className="col-span-12 md:col-span-4 p-0 min-h-[240px]"
        delay={200}
        image={CARD_IMAGES.soon}
        wash="from-[#12110f]/40 via-[#12110f]/60 to-[#12110f]/94"
      >
        <div className="relative z-10 flex flex-col justify-end h-full p-6 min-h-[240px]">
          <p className="text-[10px] tracking-[0.22em] uppercase text-white/50 mb-2">Soon</p>
          <h3 className="text-[15px] font-light text-white mb-2">More markets</h3>
          <p className="text-sm text-white/55 leading-relaxed">
            Stocks, commodities, and other finance tools will land here next.
          </p>
        </div>
      </MarketBentoCard>
    </>
  )
}
