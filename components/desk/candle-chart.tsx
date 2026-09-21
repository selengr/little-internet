'use client'

import { useMemo, useState } from 'react'
import type { OhlcBar } from '@/lib/desk-indicators'
import { formatUsd } from '@/lib/crypto-format'

type Props = {
  bars: OhlcBar[]
  ema20: (number | null)[]
  ema50: (number | null)[]
  rsi: (number | null)[]
  macd: (number | null)[]
  macdSignal: (number | null)[]
  macdHist: (number | null)[]
  showEma?: boolean
  showVolume?: boolean
  showRsi?: boolean
  showMacd?: boolean
}

const W = 1000
const PAD = { t: 10, r: 12, b: 18, l: 58 }

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
  showEma = true,
  showVolume = true,
  showRsi = true,
  showMacd = true,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const layout = useMemo(() => {
    const candleH = 280
    const volH = showVolume ? 56 : 0
    const rsiH = showRsi ? 72 : 0
    const macdH = showMacd ? 78 : 0
    const gap = 10
    let y = 0
    const candle = { top: y, h: candleH }
    y += candleH + gap
    const volume = { top: y, h: volH }
    if (showVolume) y += volH + gap
    const rsiPane = { top: y, h: rsiH }
    if (showRsi) y += rsiH + gap
    const macdPane = { top: y, h: macdH }
    if (showMacd) y += macdH
    return { candle, volume, rsiPane, macdPane, totalH: Math.max(y + PAD.b, 320) }
  }, [showVolume, showRsi, showMacd])

  const model = useMemo(() => {
    if (!bars.length) return null
    const plotW = W - PAD.l - PAD.r
    const slot = plotW / bars.length
    const bodyW = Math.max(1.8, Math.min(9, slot * 0.58))
    const x = (i: number) => PAD.l + i * slot + slot / 2

    const lows = bars.map(b => b.l)
    const highs = bars.map(b => b.h)
    const emaVals = [...ema20, ...ema50].filter((v): v is number => v != null)
    const minP = Math.min(...lows, ...(emaVals.length ? emaVals : lows))
    const maxP = Math.max(...highs, ...(emaVals.length ? emaVals : highs))
    const pad = (maxP - minP) * 0.05 || maxP * 0.01
    const pMin = minP - pad
    const pMax = maxP + pad

    const yPrice = (v: number) => paneY(v, pMin, pMax, layout.candle.top + PAD.t, layout.candle.h - PAD.t)

    const candles = bars.map((b, i) => {
      const up = b.c >= b.o
      const yO = yPrice(b.o)
      const yC = yPrice(b.c)
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
      pMin,
      pMax,
      x,
      slot,
    }
  }, [bars, ema20, ema50, rsi, macd, macdSignal, macdHist, layout, showEma])

  if (!model) {
    return <div className="h-[360px] rounded-lg bg-white/[0.03] animate-pulse" />
  }

  const activeIdx = hover ?? bars.length - 1
  const active = model.candles[activeIdx]
  const H = layout.totalH

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Trading chart with candles and indicators"
        onMouseLeave={() => setHover(null)}
      >
        {/* Candle grid */}
        {model.priceTicks.map((t, i) => (
          <g key={`pt-${i}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={t.y}
              y2={t.y}
              stroke="rgba(255,255,255,0.06)"
            />
            <text
              x={PAD.l - 6}
              y={t.y + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.35)"
              style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
            >
              {formatUsd(t.v)}
            </text>
          </g>
        ))}

        {showEma && model.ema50Path ? (
          <path d={model.ema50Path} fill="none" stroke="#7dd3fc" strokeWidth="1.2" opacity="0.85" />
        ) : null}
        {showEma && model.ema20Path ? (
          <path d={model.ema20Path} fill="none" stroke="#fbbf24" strokeWidth="1.35" opacity="0.95" />
        ) : null}

        {model.candles.map(c => (
          <g key={c.i} onMouseEnter={() => setHover(c.i)} style={{ cursor: 'crosshair' }}>
            <line
              x1={c.cx}
              x2={c.cx}
              y1={c.wickTop}
              y2={c.wickBot}
              stroke={c.up ? '#22c55e' : '#ef4444'}
              strokeWidth="1.1"
            />
            <rect
              x={c.cx - c.bodyW / 2}
              y={c.bodyY}
              width={c.bodyW}
              height={c.bodyH}
              fill={c.up ? '#22c55e' : '#ef4444'}
              opacity={hover == null || hover === c.i ? 1 : 0.28}
              rx="0.4"
            />
            <rect
              x={c.cx - Math.max(c.bodyW, 7) / 2}
              y={layout.candle.top}
              width={Math.max(c.bodyW, 7)}
              height={layout.candle.h}
              fill="transparent"
            />
          </g>
        ))}

        {/* Volume */}
        {showVolume
          ? model.volumes.map(v => (
              <rect
                key={`v-${v.i}`}
                x={v.x}
                y={v.y}
                width={v.w}
                height={v.h}
                fill={v.up ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)'}
                onMouseEnter={() => setHover(v.i)}
              />
            ))
          : null}

        {/* RSI */}
        {showRsi ? (
          <g>
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
              x={PAD.l - 6}
              y={layout.rsiPane.top + 12}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
            >
              RSI
            </text>
            {model.rsiPath ? (
              <path d={model.rsiPath} fill="none" stroke="#a78bfa" strokeWidth="1.4" />
            ) : null}
          </g>
        ) : null}

        {/* MACD */}
        {showMacd ? (
          <g>
            <text
              x={PAD.l - 6}
              y={layout.macdPane.top + 12}
              textAnchor="end"
              fill="rgba(255,255,255,0.4)"
              style={{ fontSize: 9, fontFamily: 'ui-monospace, monospace' }}
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
              <path d={model.macdPath} fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            ) : null}
            {model.signalPath ? (
              <path d={model.signalPath} fill="none" stroke="#fb7185" strokeWidth="1.2" />
            ) : null}
          </g>
        ) : null}

        {/* Crosshair */}
        {hover != null && active ? (
          <line
            x1={active.cx}
            x2={active.cx}
            y1={0}
            y2={H}
            stroke="rgba(255,255,255,0.18)"
            strokeDasharray="3 4"
            pointerEvents="none"
          />
        ) : null}
      </svg>

      {active ? (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] tabular-nums text-white/45 font-mono">
          <span className="text-white/70">
            {new Date(active.bar.t).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>O {formatUsd(active.bar.o)}</span>
          <span>H {formatUsd(active.bar.h)}</span>
          <span>L {formatUsd(active.bar.l)}</span>
          <span className={active.up ? 'text-emerald-400' : 'text-rose-400'}>
            C {formatUsd(active.bar.c)}
          </span>
          {active.bar.v != null ? <span>Vol {formatUsd(active.bar.v, true)}</span> : null}
          {rsi[activeIdx] != null ? <span>RSI {rsi[activeIdx]!.toFixed(1)}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
