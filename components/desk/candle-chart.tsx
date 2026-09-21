'use client'

import { useMemo, useState } from 'react'
import type { OhlcBar } from '@/lib/desk-indicators'
import { formatUsd } from '@/lib/crypto-format'
import { cn } from '@/lib/utils'

type Props = {
  bars: OhlcBar[]
  ema20: (number | null)[]
  ema50: (number | null)[]
  rsi: (number | null)[]
  macd: (number | null)[]
  macdSignal: (number | null)[]
  macdHist: (number | null)[]
  support?: number | null
  resistance?: number | null
  showEma?: boolean
  showVolume?: boolean
  showRsi?: boolean
  showMacd?: boolean
}

const W = 1100
const PAD = { t: 8, r: 64, b: 16, l: 8 }

function paneY(v: number, min: number, max: number, top: number, height: number) {
  return top + ((max - v) / (max - min || 1)) * height
}

export function CandleChart({
  bars,
  ema20,
  ema50,
  rsi,
  macd,
  macdSignal,
  macdHist,
  support,
  resistance,
  showEma = true,
  showVolume = true,
  showRsi = true,
  showMacd = true,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const layout = useMemo(() => {
    const candleH = 340
    const volH = showVolume ? 52 : 0
    const rsiH = showRsi ? 68 : 0
    const macdH = showMacd ? 74 : 0
    const gap = 8
    let y = 0
    const candle = { top: y, h: candleH }
    y += candleH + gap
    const volume = { top: y, h: volH }
    if (showVolume) y += volH + gap
    const rsiPane = { top: y, h: rsiH }
    if (showRsi) y += rsiH + gap
    const macdPane = { top: y, h: macdH }
    if (showMacd) y += macdH
    return { candle, volume, rsiPane, macdPane, totalH: Math.max(y + PAD.b, 360) }
  }, [showVolume, showRsi, showMacd])

  const model = useMemo(() => {
    if (!bars.length) return null
    const plotW = W - PAD.l - PAD.r
    const slot = plotW / bars.length
    const bodyW = Math.max(1.6, Math.min(10, slot * 0.62))
    const x = (i: number) => PAD.l + i * slot + slot / 2

    const lows = bars.map(b => b.l)
    const highs = bars.map(b => b.h)
    const emaVals = [...ema20, ...ema50].filter((v): v is number => v != null)
    const extras = [support, resistance].filter((v): v is number => v != null)
    const minP = Math.min(...lows, ...(emaVals.length ? emaVals : lows), ...extras)
    const maxP = Math.max(...highs, ...(emaVals.length ? emaVals : highs), ...extras)
    const pad = (maxP - minP) * 0.06 || maxP * 0.01
    const pMin = minP - pad
    const pMax = maxP + pad

    const yPrice = (v: number) =>
      paneY(v, pMin, pMax, layout.candle.top + PAD.t, layout.candle.h - PAD.t - 4)

    const last = bars[bars.length - 1]
    const lastY = yPrice(last.c)

    const candles = bars.map((b, i) => {
      const up = b.c >= b.o
      const yO = yPrice(b.o)
      const yC = yPrice(b.c)
      const chg = b.o !== 0 ? ((b.c - b.o) / b.o) * 100 : 0
      return {
        i,
        up,
        cx: x(i),
        wickTop: yPrice(b.h),
        wickBot: yPrice(b.l),
        bodyY: Math.min(yO, yC),
        bodyH: Math.max(1.2, Math.abs(yC - yO)),
        bodyW,
        bar: b,
        chg,
      }
    })

    const linePath = (series: (number | null)[], yFn: (v: number) => number) => {
      let d = ''
      let started = false
      series.forEach((v, i) => {
        if (v == null) return
        d += `${started ? 'L' : 'M'}${x(i).toFixed(1)},${yFn(v).toFixed(1)} `
        started = true
      })
      return d.trim()
    }

    const vols = bars.map(b => b.v ?? 0)
    const maxVol = Math.max(...vols, 1)
    const volumes = bars.map((b, i) => {
      const vh = ((b.v ?? 0) / maxVol) * (layout.volume.h - 4)
      return {
        i,
        up: b.c >= b.o,
        x: x(i) - bodyW / 2,
        y: layout.volume.top + layout.volume.h - vh,
        w: bodyW,
        h: Math.max(1, vh),
      }
    })

    const rsiPath = linePath(rsi, v =>
      paneY(Math.min(100, Math.max(0, v)), 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8),
    )

    const macdVals = [...macd, ...macdSignal, ...macdHist].filter((v): v is number => v != null)
    const mMin = macdVals.length ? Math.min(...macdVals) : -1
    const mMax = macdVals.length ? Math.max(...macdVals) : 1
    const mPad = (mMax - mMin) * 0.1 || 0.01
    const macdMin = mMin - mPad
    const macdMax = mMax + mPad
    const yMacd = (v: number) =>
      paneY(v, macdMin, macdMax, layout.macdPane.top + 4, layout.macdPane.h - 8)
    const zeroY = yMacd(0)

    const hist = macdHist.map((v, i) => {
      if (v == null) return null
      const y = yMacd(v)
      return {
        i,
        x: x(i) - bodyW / 2,
        y: Math.min(y, zeroY),
        h: Math.max(1, Math.abs(y - zeroY)),
        w: bodyW,
        up: v >= 0,
      }
    })

    const priceTicks = [0, 0.25, 0.5, 0.75, 1].map(p => {
      const v = pMax - (pMax - pMin) * p
      return { v, y: yPrice(v) }
    })

    return {
      candles,
      volumes,
      hist,
      ema20Path: showEma ? linePath(ema20, yPrice) : '',
      ema50Path: showEma ? linePath(ema50, yPrice) : '',
      rsiPath,
      macdPath: linePath(macd, yMacd),
      signalPath: linePath(macdSignal, yMacd),
      zeroY,
      priceTicks,
      lastY,
      lastPrice: last.c,
      lastUp: last.c >= last.o,
      supportY: support != null ? yPrice(support) : null,
      resistanceY: resistance != null ? yPrice(resistance) : null,
      yPrice,
    }
  }, [
    bars,
    ema20,
    ema50,
    rsi,
    macd,
    macdSignal,
    macdHist,
    layout,
    showEma,
    support,
    resistance,
  ])

  if (!model) {
    return <div className="h-[420px] rounded-lg bg-white/[0.03] animate-pulse" />
  }

  const activeIdx = hover ?? bars.length - 1
  const active = model.candles[activeIdx]
  const H = layout.totalH
  const tipLeft = active ? Math.min(Math.max(active.cx + 12, 80), W - 170) : 80

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Trading chart with candles and indicators"
        onMouseLeave={() => setHover(null)}
      >
        {model.priceTicks.map((t, i) => (
          <g key={`pt-${i}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={t.y}
              y2={t.y}
              stroke="rgba(255,255,255,0.045)"
            />
            <text
              x={W - PAD.r + 6}
              y={t.y + 3}
              textAnchor="start"
              fill="rgba(255,255,255,0.32)"
              style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
            >
              {formatUsd(t.v)}
            </text>
          </g>
        ))}

        {/* Support / resistance */}
        {model.resistanceY != null && resistance != null ? (
          <g>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={model.resistanceY}
              y2={model.resistanceY}
              stroke="#fb7185"
              strokeOpacity="0.55"
              strokeDasharray="5 4"
            />
            <text
              x={W - PAD.r + 6}
              y={model.resistanceY - 4}
              fill="#fb7185"
              style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace' }}
            >
              R {formatUsd(resistance)}
            </text>
          </g>
        ) : null}
        {model.supportY != null && support != null ? (
          <g>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={model.supportY}
              y2={model.supportY}
              stroke="#34d399"
              strokeOpacity="0.55"
              strokeDasharray="5 4"
            />
            <text
              x={W - PAD.r + 6}
              y={model.supportY + 10}
              fill="#34d399"
              style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace' }}
            >
              S {formatUsd(support)}
            </text>
          </g>
        ) : null}

        {showEma && model.ema50Path ? (
          <path d={model.ema50Path} fill="none" stroke="#7dd3fc" strokeWidth="1.25" opacity="0.9" />
        ) : null}
        {showEma && model.ema20Path ? (
          <path d={model.ema20Path} fill="none" stroke="#fbbf24" strokeWidth="1.4" opacity="0.95" />
        ) : null}

        {model.candles.map(c => (
          <g key={c.i} onMouseEnter={() => setHover(c.i)} style={{ cursor: 'crosshair' }}>
            <line
              x1={c.cx}
              x2={c.cx}
              y1={c.wickTop}
              y2={c.wickBot}
              stroke={c.up ? '#22c55e' : '#ef4444'}
              strokeWidth="1.15"
            />
            <rect
              x={c.cx - c.bodyW / 2}
              y={c.bodyY}
              width={c.bodyW}
              height={c.bodyH}
              fill={c.up ? '#22c55e' : '#ef4444'}
              opacity={hover == null || hover === c.i ? 1 : 0.25}
              rx="0.4"
            />
            <rect
              x={c.cx - Math.max(c.bodyW, 8) / 2}
              y={layout.candle.top}
              width={Math.max(c.bodyW, 8)}
              height={layout.candle.h}
              fill="transparent"
            />
          </g>
        ))}

        {/* Last price line */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={model.lastY}
          y2={model.lastY}
          stroke={model.lastUp ? '#22c55e' : '#ef4444'}
          strokeOpacity="0.75"
          strokeWidth="1"
        />
        <rect
          x={W - PAD.r + 2}
          y={model.lastY - 8}
          width={PAD.r - 6}
          height={16}
          rx="3"
          fill={model.lastUp ? '#14532d' : '#7f1d1d'}
        />
        <text
          x={W - PAD.r + 6}
          y={model.lastY + 3.5}
          fill={model.lastUp ? '#86efac' : '#fda4af'}
          style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}
        >
          {formatUsd(model.lastPrice)}
        </text>

        {showVolume
          ? model.volumes.map(v => (
              <rect
                key={`v-${v.i}`}
                x={v.x}
                y={v.y}
                width={v.w}
                height={v.h}
                fill={v.up ? 'rgba(34,197,94,0.42)' : 'rgba(239,68,68,0.42)'}
                onMouseEnter={() => setHover(v.i)}
              />
            ))
          : null}

        {showVolume ? (
          <text
            x={PAD.l + 2}
            y={layout.volume.top + 10}
            fill="rgba(255,255,255,0.35)"
            style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace' }}
          >
            VOL
          </text>
        ) : null}

        {showRsi ? (
          <g>
            <rect
              x={PAD.l}
              y={paneY(70, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8)}
              width={W - PAD.l - PAD.r}
              height={
                paneY(30, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8) -
                paneY(70, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8)
              }
              fill="rgba(167,139,250,0.05)"
            />
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={paneY(70, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8)}
              y2={paneY(70, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8)}
              stroke="rgba(239,68,68,0.35)"
              strokeDasharray="3 3"
            />
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={paneY(30, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8)}
              y2={paneY(30, 0, 100, layout.rsiPane.top + 4, layout.rsiPane.h - 8)}
              stroke="rgba(34,197,94,0.35)"
              strokeDasharray="3 3"
            />
            <text
              x={PAD.l + 2}
              y={layout.rsiPane.top + 10}
              fill="rgba(255,255,255,0.35)"
              style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace' }}
            >
              RSI 14
            </text>
            {model.rsiPath ? (
              <path d={model.rsiPath} fill="none" stroke="#a78bfa" strokeWidth="1.45" />
            ) : null}
          </g>
        ) : null}

        {showMacd ? (
          <g>
            <text
              x={PAD.l + 2}
              y={layout.macdPane.top + 10}
              fill="rgba(255,255,255,0.35)"
              style={{ fontSize: 8, fontFamily: 'ui-monospace, monospace' }}
            >
              MACD
            </text>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={model.zeroY}
              y2={model.zeroY}
              stroke="rgba(255,255,255,0.12)"
            />
            {model.hist.map(h =>
              h ? (
                <rect
                  key={`h-${h.i}`}
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  fill={h.up ? 'rgba(34,197,94,0.55)' : 'rgba(239,68,68,0.55)'}
                />
              ) : null,
            )}
            {model.macdPath ? (
              <path d={model.macdPath} fill="none" stroke="#38bdf8" strokeWidth="1.25" />
            ) : null}
            {model.signalPath ? (
              <path d={model.signalPath} fill="none" stroke="#fb7185" strokeWidth="1.25" />
            ) : null}
          </g>
        ) : null}

        {hover != null && active ? (
          <>
            <line
              x1={active.cx}
              x2={active.cx}
              y1={0}
              y2={H}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 4"
              pointerEvents="none"
            />
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={model.yPrice(active.bar.c)}
              y2={model.yPrice(active.bar.c)}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="2 3"
              pointerEvents="none"
            />
          </>
        ) : null}
      </svg>

      {/* Floating OHLC card */}
      {active ? (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-white/10 bg-[#0c1015]/92 px-2.5 py-2 shadow-xl backdrop-blur-sm"
          style={{ left: `min(${(tipLeft / W) * 100}%, calc(100% - 11rem))` }}
        >
          <p className="text-[9px] uppercase tracking-wider text-white/40 font-mono mb-1">
            {new Date(active.bar.t).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono tabular-nums">
            <span className="text-white/40">O</span>
            <span className="text-white/80 text-right">{formatUsd(active.bar.o)}</span>
            <span className="text-white/40">H</span>
            <span className="text-emerald-400/90 text-right">{formatUsd(active.bar.h)}</span>
            <span className="text-white/40">L</span>
            <span className="text-rose-400/90 text-right">{formatUsd(active.bar.l)}</span>
            <span className="text-white/40">C</span>
            <span className={cn('text-right', active.up ? 'text-emerald-400' : 'text-rose-400')}>
              {formatUsd(active.bar.c)}
            </span>
            <span className="text-white/40">Δ</span>
            <span className={cn('text-right', active.up ? 'text-emerald-400' : 'text-rose-400')}>
              {active.chg >= 0 ? '+' : ''}
              {active.chg.toFixed(2)}%
            </span>
            {rsi[activeIdx] != null ? (
              <>
                <span className="text-white/40">RSI</span>
                <span className="text-violet-300 text-right">{rsi[activeIdx]!.toFixed(1)}</span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
