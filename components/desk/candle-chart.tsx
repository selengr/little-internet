'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import type { OhlcBar } from '@/lib/desk-indicators'
import { formatUsd } from '@/lib/crypto-format'

export type ChartZoomPreset = 50 | 100 | 0

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
  buyFrom?: number | null
  buyTo?: number | null
  sellFrom?: number | null
  sellTo?: number | null
  showEma?: boolean
  showVolume?: boolean
  showRsi?: boolean
  showMacd?: boolean
  zoomPreset?: ChartZoomPreset
  resetToken?: number
  /** e.g. BTC/USDT — subtle corner watermark */
  pairLabel?: string
}

const W = 1100
const PAD = { t: 10, r: 76, b: 26, l: 10 }
const MIN_VISIBLE = 12
const PLOT_W = W - PAD.l - PAD.r

/** Binance-style candle colors */
const C = {
  up: '#0ECB81',
  upDim: 'rgba(14,203,129,0.48)',
  upFill: 'rgba(14,203,129,0.14)',
  down: '#F6465D',
  downDim: 'rgba(246,70,93,0.48)',
  downFill: 'rgba(246,70,93,0.14)',
  grid: 'rgba(255,255,255,0.04)',
  gridMajor: 'rgba(255,255,255,0.065)',
  axis: 'rgba(255,255,255,0.38)',
  axisMuted: 'rgba(255,255,255,0.22)',
  cross: 'rgba(255,255,255,0.34)',
  crossDash: 'rgba(255,255,255,0.22)',
  paneBg: 'rgba(0,0,0,0.18)',
  paneLine: 'rgba(255,255,255,0.07)',
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

function paneY(v: number, min: number, max: number, top: number, height: number) {
  return top + ((max - v) / (max - min || 1)) * height
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

function windowForPreset(barCount: number, preset: ChartZoomPreset) {
  if (barCount <= 0) return { start: 0, count: 0 }
  const count = preset === 0 ? barCount : Math.min(preset, barCount)
  return { start: Math.max(0, barCount - count), count }
}

function indexFromClientX(
  clientX: number,
  rect: DOMRect,
  start: number,
  count: number,
  scrollFrac: number,
) {
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
  const plotX = ratio * W
  const slot = PLOT_W / count
  const plotRatio = clamp((plotX - PAD.l + scrollFrac * slot) / PLOT_W, 0, 0.999999)
  return clamp(start + Math.floor(plotRatio * count), start, start + count - 1)
}

function clientYToPlotY(clientY: number, rect: DOMRect, viewH: number) {
  const ratio = clamp((clientY - rect.top) / rect.height, 0, 1)
  return ratio * viewH
}

function formatAxisTime(t: number, spanMs: number, mounted: boolean) {
  if (!mounted) return '—'
  const d = new Date(t)
  if (spanMs <= 36 * 3600 * 1000) {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  if (spanMs <= 120 * 24 * 3600 * 1000) {
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

function formatCompactPrice(v: number) {
  const s = formatUsd(v)
  return s.replace(/^\$/, '')
}

function paneDivider(y: number, w: number) {
  return (
    <line x1={PAD.l} x2={w - PAD.r} y1={y} y2={y} stroke={C.paneLine} strokeWidth="1" />
  )
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
  buyFrom,
  buyTo,
  sellFrom,
  sellTo,
  showEma = true,
  showVolume = true,
  showRsi = true,
  showMacd = true,
  zoomPreset = 100,
  resetToken = 0,
  pairLabel,
}: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const [hoverPlotY, setHoverPlotY] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [mobileTall, setMobileTall] = useState(false)
  const [viewWindow, setViewWindow] = useState(() => windowForPreset(bars.length, zoomPreset))
  const [scrollFrac, setScrollFrac] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const panRef = useRef<{ x: number; start: number; count: number; panning: boolean } | null>(null)
  const pinchRef = useRef<{ dist: number; count: number; start: number; anchorRatio: number } | null>(
    null,
  )
  const lastTapRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setMobileTall(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setViewWindow(windowForPreset(bars.length, zoomPreset))
    setScrollFrac(0)
  }, [zoomPreset, bars.length, resetToken])

  const layout = useMemo(() => {
    const candleH = mobileTall
      ? showRsi || showMacd
        ? 570
        : 650
      : showRsi || showMacd
        ? 384
        : 464
    const volH = showVolume ? 52 : 0
    const rsiH = showRsi ? 68 : 0
    const macdH = showMacd ? 72 : 0
    const gap = 4
    let y = 0
    const candle = { top: y, h: candleH }
    y += candleH + gap
    const volume = { top: y, h: volH }
    if (showVolume) y += volH + gap
    const rsiPane = { top: y, h: rsiH }
    if (showRsi) y += rsiH + gap
    const macdPane = { top: y, h: macdH }
    if (showMacd) y += macdH
    return {
      candle,
      volume,
      rsiPane,
      macdPane,
      totalH: Math.max(y + PAD.b, mobileTall ? 620 : 444),
    }
  }, [showVolume, showRsi, showMacd, mobileTall])

  const slice = useMemo(() => {
    const { start, count } = viewWindow
    const end = start + count
    return {
      bars: bars.slice(start, end),
      ema20: ema20.slice(start, end),
      ema50: ema50.slice(start, end),
      rsi: rsi.slice(start, end),
      macd: macd.slice(start, end),
      macdSignal: macdSignal.slice(start, end),
      macdHist: macdHist.slice(start, end),
      globalStart: start,
    }
  }, [bars, ema20, ema50, rsi, macd, macdSignal, macdHist, viewWindow])

  const model = useMemo(() => {
    const vis = slice.bars
    if (!vis.length) return null
    const plotW = PLOT_W
    const slot = plotW / vis.length
    const xShift = -scrollFrac * slot
    const bodyW = Math.max(1.1, Math.min(9, slot * 0.52))
    const x = (i: number) => PAD.l + i * slot + slot / 2 + xShift

    const lows = vis.map(b => b.l)
    const highs = vis.map(b => b.h)
    const emaVals = [...slice.ema20, ...slice.ema50].filter((v): v is number => v != null)
    const extras = [support, resistance, buyFrom, buyTo, sellFrom, sellTo].filter(
      (v): v is number => v != null,
    )
    const minP = Math.min(...lows, ...(emaVals.length ? emaVals : lows), ...extras)
    const maxP = Math.max(...highs, ...(emaVals.length ? emaVals : highs), ...extras)
    const pad = (maxP - minP) * 0.05 || maxP * 0.008
    const pMin = minP - pad
    const pMax = maxP + pad

    const candlePlotTop = layout.candle.top + PAD.t
    const candlePlotH = layout.candle.h - PAD.t - 6
    const yPrice = (v: number) => paneY(v, pMin, pMax, candlePlotTop, candlePlotH)

    const priceFromY = (y: number) => {
      const t = clamp((y - candlePlotTop) / candlePlotH, 0, 1)
      return pMax - t * (pMax - pMin)
    }

    const last = vis[vis.length - 1]
    const lastY = yPrice(last.c)

    const candles = vis.map((b, i) => {
      const up = b.c >= b.o
      const yO = yPrice(b.o)
      const yC = yPrice(b.c)
      const chg = b.o !== 0 ? ((b.c - b.o) / b.o) * 100 : 0
      return {
        i,
        globalI: slice.globalStart + i,
        up,
        cx: x(i),
        wickTop: yPrice(b.h),
        wickBot: yPrice(b.l),
        bodyY: Math.min(yO, yC),
        bodyH: Math.max(1, Math.abs(yC - yO)),
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

    const vols = vis.map(b => b.v ?? 0)
    const maxVol = Math.max(...vols, 1)
    const volumes = vis.map((b, i) => {
      const vh = ((b.v ?? 0) / maxVol) * (layout.volume.h - 6)
      return {
        i,
        globalI: slice.globalStart + i,
        up: b.c >= b.o,
        x: x(i) - bodyW / 2,
        y: layout.volume.top + layout.volume.h - vh - 2,
        w: bodyW,
        h: Math.max(1, vh),
      }
    })

    const rsiInner = { top: layout.rsiPane.top + 5, h: layout.rsiPane.h - 10 }
    const rsiPath = linePath(slice.rsi, v =>
      paneY(Math.min(100, Math.max(0, v)), 0, 100, rsiInner.top, rsiInner.h),
    )

    const macdVals = [...slice.macd, ...slice.macdSignal, ...slice.macdHist].filter(
      (v): v is number => v != null,
    )
    const mMin = macdVals.length ? Math.min(...macdVals) : -1
    const mMax = macdVals.length ? Math.max(...macdVals) : 1
    const mPad = (mMax - mMin) * 0.12 || 0.01
    const macdMin = mMin - mPad
    const macdMax = mMax + mPad
    const macdInner = { top: layout.macdPane.top + 5, h: layout.macdPane.h - 10 }
    const yMacd = (v: number) => paneY(v, macdMin, macdMax, macdInner.top, macdInner.h)
    const zeroY = yMacd(0)

    const hist = slice.macdHist.map((v, i) => {
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

    const priceTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map(p => {
      const v = pMax - (pMax - pMin) * p
      return { v, y: yPrice(v), major: p === 0 || p === 1 || p === 0.5 }
    })

    const spanMs =
      vis.length >= 2 ? vis[vis.length - 1].t - vis[0].t : 7 * 24 * 3600 * 1000
    const timeSlotCount = Math.min(6, Math.max(3, Math.floor(vis.length / 12)))
    const timeLabels = Array.from({ length: timeSlotCount }, (_, k) => {
      const i = Math.round((k / (timeSlotCount - 1)) * (vis.length - 1))
      const bar = vis[i]
      return {
        bar,
        x: x(i),
        anchor: k === 0 ? 'start' : k === timeSlotCount - 1 ? 'end' : 'middle',
      } as const
    }).filter(t => t.bar)

    const vGridCount = Math.min(8, Math.max(4, Math.floor(vis.length / 10)))
    const vGrids = Array.from({ length: vGridCount - 1 }, (_, k) => {
      const i = Math.round(((k + 1) / vGridCount) * (vis.length - 1))
      return x(i)
    })

    return {
      candles,
      volumes,
      hist,
      ema20Path: showEma ? linePath(slice.ema20, yPrice) : '',
      ema50Path: showEma ? linePath(slice.ema50, yPrice) : '',
      rsiPath,
      macdPath: linePath(slice.macd, yMacd),
      signalPath: linePath(slice.macdSignal, yMacd),
      zeroY,
      priceTicks,
      timeLabels,
      spanMs,
      vGrids,
      lastY,
      lastPrice: last.c,
      lastUp: last.c >= last.o,
      supportY: support != null ? yPrice(support) : null,
      resistanceY: resistance != null ? yPrice(resistance) : null,
      buyBand:
        buyFrom != null && buyTo != null
          ? { y1: yPrice(buyTo), y2: yPrice(buyFrom), from: buyFrom, to: buyTo }
          : null,
      sellBand:
        sellFrom != null && sellTo != null
          ? { y1: yPrice(sellTo), y2: yPrice(sellFrom), from: sellFrom, to: sellTo }
          : null,
      yPrice,
      priceFromY,
      pMin,
      pMax,
      candlePlotTop,
      candlePlotH,
      rsiInner,
      macdInner,
      slot,
    }
  }, [slice, layout, showEma, support, resistance, buyFrom, buyTo, sellFrom, sellTo, scrollFrac])

  const zoomAtRatio = useCallback(
    (ratio: number, factor: number) => {
      const n = bars.length
      if (n <= 0) return
      setScrollFrac(0)
      setViewWindow(prev => {
        let count = Math.round(prev.count * factor)
        count = clamp(count, Math.min(MIN_VISIBLE, n), n)
        const anchor = prev.start + prev.count * ratio
        let start = Math.round(anchor - count * ratio)
        start = clamp(start, 0, n - count)
        return { start, count }
      })
    },
    [bars.length],
  )

  const resetView = useCallback(() => {
    setScrollFrac(0)
    setViewWindow(windowForPreset(bars.length, zoomPreset))
  }, [bars.length, zoomPreset])

  const onWheel = useCallback(
    (e: ReactWheelEvent) => {
      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect?.width) return
      const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1)
      const plotRatio = clamp((ratio * W - PAD.l) / PLOT_W, 0, 1)
      const factor = e.deltaY > 0 ? 1.08 : 0.925
      zoomAtRatio(plotRatio, factor)
    },
    [zoomAtRatio],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const wheelHandler = (e: WheelEvent) => {
      if (!el.contains(e.target as Node)) return
      e.preventDefault()
    }
    const touchHandler = (e: TouchEvent) => {
      if (e.touches.length >= 1) e.preventDefault()
    }
    el.addEventListener('wheel', wheelHandler, { passive: false })
    el.addEventListener('touchmove', touchHandler, { passive: false })
    return () => {
      el.removeEventListener('wheel', wheelHandler)
      el.removeEventListener('touchmove', touchHandler)
    }
  }, [])

  const updateHoverFromEvent = useCallback(
    (clientX: number, clientY?: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect?.width || !model) return
      const idx = indexFromClientX(
        clientX,
        rect,
        viewWindow.start,
        viewWindow.count,
        scrollFrac,
      )
      const local = idx - viewWindow.start
      if (local >= 0 && local < model.candles.length) setHover(local)
      if (clientY != null) {
        const svgY = clientYToPlotY(clientY, rect, layout.totalH)
        setHoverPlotY(svgY)
      }
    },
    [model, viewWindow.count, viewWindow.start, scrollFrac, layout.totalH],
  )

  const applyPan = useCallback(
    (clientX: number, pan: NonNullable<typeof panRef.current>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect?.width) return
      const dx = clientX - pan.x
      const barsPerPx = pan.count / Math.max(1, rect.width)
      const exactStart = pan.start - dx * barsPerPx
      const n = bars.length
      const maxStart = Math.max(0, n - pan.count)
      let start = clamp(Math.floor(exactStart), 0, maxStart)
      let frac = exactStart - start
      if (frac < 0 && start > 0) {
        start -= 1
        frac += 1
      }
      frac = clamp(frac, 0, 0.999)
      setViewWindow({ start, count: pan.count })
      setScrollFrac(frac)
    },
    [bars.length],
  )

  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    e.preventDefault()
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()]
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const rect = containerRef.current?.getBoundingClientRect()
      const midX = (pts[0].x + pts[1].x) / 2
      const ratio = rect?.width ? clamp((midX - rect.left) / rect.width, 0, 1) : 0.5
      const plotRatio = clamp((ratio * W - PAD.l) / PLOT_W, 0, 1)
      pinchRef.current = {
        dist,
        count: viewWindow.count,
        start: viewWindow.start,
        anchorRatio: plotRatio,
      }
      panRef.current = null
      return
    }

    let start = viewWindow.start
    let count = viewWindow.count
    const n = bars.length
    if (n > MIN_VISIBLE && count >= n) {
      const rect = containerRef.current?.getBoundingClientRect()
      const ratio = rect?.width ? clamp((e.clientX - rect.left) / rect.width, 0, 1) : 0.85
      count = clamp(Math.round(n * 0.55), MIN_VISIBLE, n - 1)
      start = clamp(Math.round(n * ratio - count * ratio), 0, n - count)
      setViewWindow({ start, count })
      setScrollFrac(0)
    }

    panRef.current = {
      x: e.clientX,
      start,
      count,
      panning: false,
    }
    pinchRef.current = null
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) {
      if (e.pointerType === 'mouse' && pointersRef.current.size === 0) {
        updateHoverFromEvent(e.clientX, e.clientY)
      }
      return
    }
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      e.preventDefault()
      setScrollFrac(0)
      const pts = [...pointersRef.current.values()]
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const scale = pinchRef.current.dist / (dist || 1)
      const n = bars.length
      let count = Math.round(pinchRef.current.count * scale)
      count = clamp(count, Math.min(MIN_VISIBLE, n), n)
      const anchor =
        pinchRef.current.start + pinchRef.current.count * pinchRef.current.anchorRatio
      let start = Math.round(anchor - count * pinchRef.current.anchorRatio)
      start = clamp(start, 0, n - count)
      setViewWindow({ start, count })
      return
    }

    const pan = panRef.current
    if (!pan) return
    const dx = e.clientX - pan.x
    const threshold = e.pointerType === 'touch' ? 2 : 4
    if (!pan.panning && Math.abs(dx) > threshold) pan.panning = true

    if (pan.panning && bars.length > 0) {
      e.preventDefault()
      applyPan(e.clientX, pan)
      setHover(null)
      setHoverPlotY(null)
    } else if (pointersRef.current.size === 1) {
      updateHoverFromEvent(e.clientX, e.clientY)
    }
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }

    if (pointersRef.current.size < 2) pinchRef.current = null

    const pan = panRef.current
    if (pointersRef.current.size === 0) {
      if (pan?.panning && scrollFrac > 0.35) {
        const n = bars.length
        const maxStart = Math.max(0, n - viewWindow.count)
        const next = clamp(viewWindow.start + 1, 0, maxStart)
        setViewWindow({ start: next, count: viewWindow.count })
      }
      setScrollFrac(0)

      if (pan && !pan.panning && e.pointerType === 'touch') {
        const now = Date.now()
        if (now - lastTapRef.current < 280) resetView()
        lastTapRef.current = now
        updateHoverFromEvent(e.clientX, e.clientY)
      }
      panRef.current = null
    }
  }

  if (!model) {
    return (
      <div className="relative w-full">
        <div className="aspect-[11/7] max-lg:aspect-[11/8] w-full rounded-lg bg-white/[0.02] animate-pulse" />
      </div>
    )
  }

  const activeIdx = hover ?? model.candles.length - 1
  const active = model.candles[activeIdx]
  const H = layout.totalH
  const zoomPct = bars.length > 0 ? Math.round((viewWindow.count / bars.length) * 100) : 100
  const crosshairPrice =
    hoverPlotY != null && hover != null
      ? model.priceFromY(
          clamp(hoverPlotY, model.candlePlotTop, model.candlePlotTop + model.candlePlotH),
        )
      : null
  const crosshairY =
    hoverPlotY != null
      ? clamp(hoverPlotY, model.candlePlotTop, model.candlePlotTop + model.candlePlotH)
      : null

  const lastTagW = PAD.r - 10
  const hoverPriceLabel = crosshairPrice != null ? formatCompactPrice(crosshairPrice) : ''

  return (
    <div
      ref={containerRef}
      className="relative w-full touch-none select-none cursor-grab active:cursor-grabbing"
      style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={e => {
        if (e.pointerType === 'mouse' && pointersRef.current.size === 0) {
          setHover(null)
          setHoverPlotY(null)
        }
      }}
      onDoubleClick={resetView}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Trading chart with candles and indicators"
      >
        <defs>
          <linearGradient id="buyBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.up} stopOpacity="0.02" />
            <stop offset="50%" stopColor={C.up} stopOpacity="0.14" />
            <stop offset="100%" stopColor={C.up} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="sellBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.down} stopOpacity="0.02" />
            <stop offset="50%" stopColor={C.down} stopOpacity="0.14" />
            <stop offset="100%" stopColor={C.down} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Plot backgrounds */}
        <rect
          x={PAD.l}
          y={layout.candle.top}
          width={PLOT_W}
          height={layout.candle.h}
          fill={C.paneBg}
          rx="2"
        />
        {showVolume ? (
          <rect
            x={PAD.l}
            y={layout.volume.top}
            width={PLOT_W}
            height={layout.volume.h}
            fill="rgba(255,255,255,0.015)"
            rx="1"
          />
        ) : null}
        {showRsi ? (
          <rect
            x={PAD.l}
            y={layout.rsiPane.top}
            width={PLOT_W}
            height={layout.rsiPane.h}
            fill="rgba(255,255,255,0.015)"
            rx="1"
          />
        ) : null}
        {showMacd ? (
          <rect
            x={PAD.l}
            y={layout.macdPane.top}
            width={PLOT_W}
            height={layout.macdPane.h}
            fill="rgba(255,255,255,0.015)"
            rx="1"
          />
        ) : null}

        {model.vGrids.map((gx, i) => (
          <line
            key={`vg-${i}`}
            x1={gx}
            x2={gx}
            y1={layout.candle.top}
            y2={layout.candle.top + layout.candle.h}
            stroke={C.grid}
          />
        ))}

        {model.priceTicks.map((t, i) => (
          <g key={`pt-${i}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={t.y}
              y2={t.y}
              stroke={t.major ? C.gridMajor : C.grid}
            />
            <text
              x={W - PAD.r + 8}
              y={t.y + 3.5}
              textAnchor="start"
              fill={C.axis}
              style={{ fontSize: 9.5, fontFamily: MONO, fontWeight: 500 }}
            >
              {formatCompactPrice(t.v)}
            </text>
          </g>
        ))}

        {/* Right price gutter */}
        <rect
          x={W - PAD.r}
          y={layout.candle.top}
          width={PAD.r}
          height={layout.candle.h}
          fill="rgba(13,17,23,0.55)"
        />

        {model.buyBand ? (
          <g>
            {(() => {
              const maxH = 14
              const rawH = Math.max(2, model.buyBand.y2 - model.buyBand.y1)
              const h = Math.min(rawH, maxH)
              const y = model.buyBand.y2 - h
              return (
                <>
                  <rect
                    x={PAD.l}
                    y={y}
                    width={PLOT_W}
                    height={h}
                    fill="url(#buyBandGrad)"
                  />
                  <line
                    x1={PAD.l}
                    x2={W - PAD.r}
                    y1={model.buyBand.y2}
                    y2={model.buyBand.y2}
                    stroke={C.up}
                    strokeOpacity="0.65"
                    strokeWidth="1"
                  />
                  <rect
                    x={PAD.l + 4}
                    y={y + 1}
                    width={34}
                    height={11}
                    rx="2"
                    fill="rgba(14,203,129,0.22)"
                    stroke={C.up}
                    strokeOpacity="0.35"
                    strokeWidth="0.5"
                  />
                  <text
                    x={PAD.l + 8}
                    y={y + 9}
                    fill={C.up}
                    style={{ fontSize: 8, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em' }}
                  >
                    BUY
                  </text>
                </>
              )
            })()}
          </g>
        ) : null}
        {model.sellBand ? (
          <g>
            {(() => {
              const maxH = 14
              const rawH = Math.max(2, model.sellBand.y2 - model.sellBand.y1)
              const h = Math.min(rawH, maxH)
              const y = model.sellBand.y1
              return (
                <>
                  <rect
                    x={PAD.l}
                    y={y}
                    width={PLOT_W}
                    height={h}
                    fill="url(#sellBandGrad)"
                  />
                  <line
                    x1={PAD.l}
                    x2={W - PAD.r}
                    y1={model.sellBand.y1}
                    y2={model.sellBand.y1}
                    stroke={C.down}
                    strokeOpacity="0.65"
                    strokeWidth="1"
                  />
                  <rect
                    x={PAD.l + 4}
                    y={y + 1}
                    width={34}
                    height={11}
                    rx="2"
                    fill="rgba(246,70,93,0.2)"
                    stroke={C.down}
                    strokeOpacity="0.35"
                    strokeWidth="0.5"
                  />
                  <text
                    x={PAD.l + 8}
                    y={y + 9}
                    fill={C.down}
                    style={{ fontSize: 8, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.06em' }}
                  >
                    SELL
                  </text>
                </>
              )
            })()}
          </g>
        ) : null}

        {model.resistanceY != null && resistance != null ? (
          <g>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={model.resistanceY}
              y2={model.resistanceY}
              stroke={C.down}
              strokeOpacity="0.5"
              strokeDasharray="4 3"
              strokeWidth="0.85"
            />
            <text
              x={W - PAD.r + 8}
              y={model.resistanceY - 3}
              fill={C.down}
              style={{ fontSize: 8, fontFamily: MONO }}
            >
              R {formatCompactPrice(resistance)}
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
              stroke={C.up}
              strokeOpacity="0.5"
              strokeDasharray="4 3"
              strokeWidth="0.85"
            />
            <text
              x={W - PAD.r + 8}
              y={model.supportY + 10}
              fill={C.up}
              style={{ fontSize: 8, fontFamily: MONO }}
            >
              S {formatCompactPrice(support)}
            </text>
          </g>
        ) : null}

        {showEma && model.ema50Path ? (
          <path d={model.ema50Path} fill="none" stroke="#60a5fa" strokeWidth="1.15" opacity="0.88" />
        ) : null}
        {showEma && model.ema20Path ? (
          <path d={model.ema20Path} fill="none" stroke="#f0b90b" strokeWidth="1.25" opacity="0.92" />
        ) : null}

        {model.candles.map(c => {
          const col = c.up ? C.up : C.down
          const isHovered = hover != null && hover === c.i
          return (
            <g key={c.globalI}>
              <line
                x1={c.cx}
                x2={c.cx}
                y1={c.wickTop}
                y2={c.wickBot}
                stroke={col}
                strokeWidth={isHovered ? 1.35 : 1}
              />
              <rect
                x={c.cx - c.bodyW / 2}
                y={c.bodyY}
                width={c.bodyW}
                height={c.bodyH}
                fill={col}
                rx="0.35"
              />
              {isHovered ? (
                <rect
                  x={c.cx - c.bodyW / 2 - 0.75}
                  y={c.bodyY - 0.75}
                  width={c.bodyW + 1.5}
                  height={Math.max(c.bodyH + 1.5, 2.25)}
                  fill="none"
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth="0.65"
                  rx="0.45"
                />
              ) : null}
            </g>
          )
        })}

        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={model.lastY}
          y2={model.lastY}
          stroke={model.lastUp ? C.up : C.down}
          strokeOpacity={hover != null ? 0.32 : 0.58}
          strokeWidth="0.85"
          strokeDasharray="5 4"
        />
        <rect
          x={W - PAD.r + 4}
          y={model.lastY - 9}
          width={lastTagW}
          height={18}
          rx="2"
          fill={model.lastUp ? '#0b3d2c' : '#4a1520'}
          stroke={model.lastUp ? C.up : C.down}
          strokeWidth="0.85"
          opacity={hover != null ? 0.72 : 1}
        />
        <polygon
          points={`${W - PAD.r + 2},${model.lastY} ${W - PAD.r + 6},${model.lastY - 3.5} ${W - PAD.r + 6},${model.lastY + 3.5}`}
          fill={model.lastUp ? C.up : C.down}
          opacity={hover != null ? 0.5 : 0.85}
        />
        <text
          x={W - PAD.r + 8}
          y={model.lastY + 3.5}
          fill={model.lastUp ? '#b8f5dc' : '#ffb8c4'}
          style={{ fontSize: 9.5, fontFamily: MONO, fontWeight: 700 }}
          opacity={hover != null ? 0.75 : 1}
        >
          {formatCompactPrice(model.lastPrice)}
        </text>

        {showVolume ? (
          <>
            {paneDivider(layout.volume.top, W)}
            {model.volumes.map(v => (
              <rect
                key={`v-${v.globalI}`}
                x={v.x}
                y={v.y}
                width={v.w}
                height={v.h}
                fill={v.up ? C.upDim : C.downDim}
                rx="0.25"
              />
            ))}
            <text
              x={PAD.l + 4}
              y={layout.volume.top + 11}
              fill={C.axisMuted}
              style={{ fontSize: 8, fontFamily: MONO, fontWeight: 600 }}
            >
              Vol
            </text>
          </>
        ) : null}

        {showRsi ? (
          <g>
            {paneDivider(layout.rsiPane.top, W)}
            <rect
              x={PAD.l}
              y={paneY(70, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              width={PLOT_W}
              height={
                paneY(30, 0, 100, model.rsiInner.top, model.rsiInner.h) -
                paneY(70, 0, 100, model.rsiInner.top, model.rsiInner.h)
              }
              fill="rgba(167,139,250,0.04)"
            />
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={paneY(70, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              y2={paneY(70, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              stroke={C.down}
              strokeOpacity="0.28"
              strokeDasharray="3 4"
            />
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={paneY(30, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              y2={paneY(30, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              stroke={C.up}
              strokeOpacity="0.28"
              strokeDasharray="3 4"
            />
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={paneY(50, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              y2={paneY(50, 0, 100, model.rsiInner.top, model.rsiInner.h)}
              stroke={C.grid}
            />
            <text
              x={PAD.l + 4}
              y={layout.rsiPane.top + 11}
              fill={C.axisMuted}
              style={{ fontSize: 8, fontFamily: MONO, fontWeight: 600 }}
            >
              RSI 14
            </text>
            {model.rsiPath ? (
              <path d={model.rsiPath} fill="none" stroke="#a78bfa" strokeWidth="1.35" opacity="0.95" />
            ) : null}
          </g>
        ) : null}

        {showMacd ? (
          <g>
            {paneDivider(layout.macdPane.top, W)}
            <text
              x={PAD.l + 4}
              y={layout.macdPane.top + 11}
              fill={C.axisMuted}
              style={{ fontSize: 8, fontFamily: MONO, fontWeight: 600 }}
            >
              MACD
            </text>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={model.zeroY}
              y2={model.zeroY}
              stroke={C.gridMajor}
            />
            {model.hist.map(h =>
              h ? (
                <rect
                  key={`h-${h.i}`}
                  x={h.x}
                  y={h.y}
                  width={h.w}
                  height={h.h}
                  fill={h.up ? 'rgba(14,203,129,0.62)' : 'rgba(246,70,93,0.62)'}
                  rx="0.25"
                />
              ) : null,
            )}
            {model.macdPath ? (
              <path d={model.macdPath} fill="none" stroke="#38bdf8" strokeWidth="1.2" opacity="0.9" />
            ) : null}
            {model.signalPath ? (
              <path d={model.signalPath} fill="none" stroke="#f472b6" strokeWidth="1.15" opacity="0.88" />
            ) : null}
          </g>
        ) : null}

        {mounted
          ? model.timeLabels.map((t, i) => (
              <text
                key={`tl-${i}`}
                x={t.x}
                y={H - 6}
                textAnchor={t.anchor}
                fill={C.axisMuted}
                style={{ fontSize: 9, fontFamily: MONO }}
                suppressHydrationWarning
              >
                {formatAxisTime(t.bar.t, model.spanMs, mounted)}
              </text>
            ))
          : null}

        {pairLabel ? (
          <text
            x={PAD.l + 8}
            y={layout.candle.top + layout.candle.h - 10}
            fill="rgba(255,255,255,0.07)"
            style={{ fontSize: 22, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.04em' }}
            pointerEvents="none"
          >
            {pairLabel}
          </text>
        ) : null}

        {hover != null && active ? (
          <g pointerEvents="none">
            <line
              x1={active.cx}
              x2={active.cx}
              y1={layout.candle.top}
              y2={H - PAD.b}
              stroke={C.crossDash}
              strokeWidth="0.75"
              strokeDasharray="3 4"
            />
            <line
              x1={active.cx}
              x2={active.cx}
              y1={layout.candle.top}
              y2={layout.candle.top + layout.candle.h}
              stroke={C.cross}
              strokeWidth="0.9"
            />
            {crosshairY != null ? (
              <>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={crosshairY}
                  y2={crosshairY}
                  stroke={C.crossDash}
                  strokeWidth="0.75"
                  strokeDasharray="4 3"
                />
                {crosshairPrice != null ? (
                  <>
                    <rect
                      x={W - PAD.r + 4}
                      y={crosshairY - 8}
                      width={lastTagW}
                      height={16}
                      rx="2"
                      fill="#151c28"
                      stroke="rgba(255,255,255,0.28)"
                      strokeWidth="0.65"
                    />
                    <polygon
                      points={`${W - PAD.r + 2},${crosshairY} ${W - PAD.r + 6},${crosshairY - 3} ${W - PAD.r + 6},${crosshairY + 3}`}
                      fill="rgba(255,255,255,0.35)"
                    />
                    <text
                      x={W - PAD.r + 8}
                      y={crosshairY + 3.5}
                      fill="#f1f5f9"
                      style={{ fontSize: 9, fontFamily: MONO, fontWeight: 600 }}
                    >
                      {hoverPriceLabel}
                    </text>
                  </>
                ) : null}
              </>
            ) : null}
            <circle
              cx={active.cx}
              cy={model.yPrice(active.bar.c)}
              r="3"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="0.75"
            />
            <circle cx={active.cx} cy={model.yPrice(active.bar.c)} r="1.75" fill="#fff" opacity="0.92" />
          </g>
        ) : null}
      </svg>

      {active ? (
        <div className="pointer-events-none absolute top-1.5 left-1.5 z-10 max-w-[calc(100%-5.5rem)] rounded border border-white/[0.08] bg-[#0d1117]/88 px-2 py-1 font-mono text-[10px] leading-snug tabular-nums shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <span className="text-white/40 shrink-0" suppressHydrationWarning>
              {mounted
                ? new Date(active.bar.t).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </span>
            <span className="text-white/45">
              O <span className="text-white/85">{formatUsd(active.bar.o)}</span>
            </span>
            <span className="text-white/45">
              H <span style={{ color: C.up }}>{formatUsd(active.bar.h)}</span>
            </span>
            <span className="text-white/45">
              L <span style={{ color: C.down }}>{formatUsd(active.bar.l)}</span>
            </span>
            <span className="text-white/45">
              C{' '}
              <span style={{ color: active.up ? C.up : C.down }}>{formatUsd(active.bar.c)}</span>
            </span>
            <span style={{ color: active.up ? C.up : C.down, opacity: 0.9 }}>
              {active.chg >= 0 ? '+' : ''}
              {active.chg.toFixed(2)}%
            </span>
            {active.bar.v != null ? (
              <span className="text-white/45">
                V{' '}
                <span className="text-white/60">
                  {active.bar.v >= 1e6
                    ? `${(active.bar.v / 1e6).toFixed(2)}M`
                    : active.bar.v >= 1e3
                      ? `${(active.bar.v / 1e3).toFixed(1)}K`
                      : active.bar.v.toFixed(2)}
                </span>
              </span>
            ) : null}
            {slice.rsi[activeIdx] != null ? (
              <span className="text-white/45">
                RSI <span className="text-violet-300/95">{slice.rsi[activeIdx]!.toFixed(1)}</span>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute top-1.5 right-[5rem] z-10 font-mono text-[9px] text-white/22 tabular-nums">
        {viewWindow.count}/{bars.length} · {zoomPct}%
      </div>

      <button
        type="button"
        onClick={resetView}
        className="absolute top-1.5 right-1.5 z-20 rounded border border-white/[0.1] bg-[#0d1117]/92 px-2 py-0.5 font-mono text-[9px] text-white/50 hover:text-white/80 hover:border-white/22 transition-colors"
        title="Reset zoom (double-click chart)"
      >
        Reset
      </button>
    </div>
  )
}
