'use client'

import { useEffect, useRef, useState } from 'react'
import {
  LAND_MASK,
  LAND_COLS,
  LAND_ROWS,
  LAND_LON_MIN,
  LAND_LON_MAX,
  LAND_LAT_MIN,
  LAND_LAT_MAX,
} from '@/lib/iss-land-mask'

type Position = { lat: number; lon: number; timestamp: number }
type Crew = { count: number; craft: { name: string; people: string[] }[] }
type SpacePayload = { position: Position | null; crew: Crew | null }

const POLL_MS = 5000
const DEG = Math.PI / 180
const INCLINATION = 51.64 * DEG
const ORBIT_PERIOD_S = 5580
const SIDEREAL_DAY_S = 86164
const FOOTPRINT_DEG = 20.3

type Vec3 = [number, number, number]

const toVec = (latDeg: number, lonDeg: number): Vec3 => [
  Math.cos(latDeg * DEG) * Math.cos(lonDeg * DEG),
  Math.cos(latDeg * DEG) * Math.sin(lonDeg * DEG),
  Math.sin(latDeg * DEG),
]

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

/** Great circle through the current position at the ISS inclination. */
function orbitFrame(latDeg: number, lonDeg: number) {
  const p = toVec(latDeg, lonDeg)
  const flat = Math.hypot(p[0], p[1])

  let n: Vec3 = [0, 0, 1]
  if (flat > 1e-6) {
    const ratio = Math.max(-1, Math.min(1, -p[2] / Math.tan(INCLINATION) / flat))
    const node = Math.asin(ratio) - Math.atan2(-p[1], p[0])
    n = [
      Math.sin(INCLINATION) * Math.sin(node),
      -Math.sin(INCLINATION) * Math.cos(node),
      Math.cos(INCLINATION),
    ]
  }

  const heading = normalize([
    n[1] * p[2] - n[2] * p[1],
    n[2] * p[0] - n[0] * p[2],
    n[0] * p[1] - n[1] * p[0],
  ])

  return { p, heading }
}

/**
 * Ground track sample. The Earth turns underneath while the station flies, so
 * each point is shifted west by however far the planet rotated to reach it.
 */
function trackPoint(p: Vec3, heading: Vec3, angleDeg: number) {
  const a = angleDeg * DEG
  const c = Math.cos(a)
  const s = Math.sin(a)
  const v: Vec3 = [
    p[0] * c + heading[0] * s,
    p[1] * c + heading[1] * s,
    p[2] * c + heading[2] * s,
  ]
  const drift = (angleDeg * ORBIT_PERIOD_S) / SIDEREAL_DAY_S
  return {
    lat: Math.asin(Math.max(-1, Math.min(1, v[2]))) / DEG,
    lon: Math.atan2(v[1], v[0]) / DEG - drift,
  }
}

/** Point at a given angular distance and bearing — used for the coverage ring. */
function offsetPoint(latDeg: number, lonDeg: number, distDeg: number, bearingDeg: number) {
  const lat = latDeg * DEG
  const lon = lonDeg * DEG
  const d = distDeg * DEG
  const b = bearingDeg * DEG
  const outLat = Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d) * Math.cos(b))
  const outLon =
    lon +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat),
      Math.cos(d) - Math.sin(lat) * Math.sin(outLat),
    )
  return { lat: outLat / DEG, lon: outLon / DEG }
}

function subsolarPoint(date: Date) {
  const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0
  const meanLon = 280.46 + 0.9856474 * n
  const meanAnom = (357.528 + 0.9856003 * n) * DEG
  const ecliptic =
    (meanLon + 1.915 * Math.sin(meanAnom) + 0.02 * Math.sin(2 * meanAnom)) * DEG
  const obliquity = (23.439 - 0.0000004 * n) * DEG
  const hours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  return {
    lat: Math.asin(Math.sin(obliquity) * Math.sin(ecliptic)) / DEG,
    lon: -15 * (hours - 12),
  }
}

function wrapLon(lon: number) {
  let out = lon
  while (out > 180) out -= 360
  while (out < -180) out += 360
  return out
}

function shortestTurn(from: number, to: number) {
  let delta = to - from
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return delta
}

const lonToX = (lon: number, w: number) =>
  ((wrapLon(lon) - LAND_LON_MIN) / (LAND_LON_MAX - LAND_LON_MIN)) * w
const latToY = (lat: number, h: number) =>
  ((LAND_LAT_MAX - lat) / (LAND_LAT_MAX - LAND_LAT_MIN)) * h

/** Dot grid with daylight baked in. Slow to build, so it is cached and blitted. */
function buildBaseMap(w: number, h: number, dpr: number) {
  const off = document.createElement('canvas')
  off.width = Math.max(1, Math.round(w * dpr))
  off.height = Math.max(1, Math.round(h * dpr))
  const ctx = off.getContext('2d')
  if (!ctx) return off
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const sun = subsolarPoint(new Date())
  const sunLat = sun.lat * DEG
  const cellW = w / LAND_COLS
  const cellH = h / LAND_ROWS
  const dot = Math.min(cellW, cellH) * 0.42

  for (let r = 0; r < LAND_ROWS; r++) {
    const lat = LAND_LAT_MAX - ((r + 0.5) / LAND_ROWS) * (LAND_LAT_MAX - LAND_LAT_MIN)
    const latRad = lat * DEG
    for (let c = 0; c < LAND_COLS; c++) {
      const isLand = LAND_MASK[r * LAND_COLS + c] === 1
      const lon = LAND_LON_MIN + ((c + 0.5) / LAND_COLS) * (LAND_LON_MAX - LAND_LON_MIN)

      const elevation =
        Math.asin(
          Math.max(
            -1,
            Math.min(
              1,
              Math.sin(latRad) * Math.sin(sunLat) +
                Math.cos(latRad) * Math.cos(sunLat) * Math.cos((lon - sun.lon) * DEG),
            ),
          ),
        ) / DEG

      const daylight = Math.max(0, Math.min(1, (elevation + 8) / 16))

      const alpha = isLand ? 0.1 + daylight * 0.52 : 0.03 + daylight * 0.075

      ctx.fillStyle = isLand
        ? `rgba(${Math.round(132 + daylight * 92)},${Math.round(180 + daylight * 62)},255,${alpha})`
        : `rgba(120,150,200,${alpha})`

      ctx.beginPath()
      ctx.arc(c * cellW + cellW / 2, r * cellH + cellH / 2, dot, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return off
}

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: { lat: number; lon: number }[],
  w: number,
  h: number,
) {
  ctx.beginPath()
  let previousX: number | null = null
  for (const point of points) {
    const x = lonToX(point.lon, w)
    const y = latToY(point.lat, h)
    if (previousX !== null && Math.abs(x - previousX) > w * 0.5) ctx.moveTo(x, y)
    else if (previousX === null) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    previousX = x
  }
  ctx.stroke()
}

function TrackerMap({ position, active }: { position: Position | null; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef<Position | null>(null)
  const viewRef = useRef<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (!position) return
    targetRef.current = position
    if (!viewRef.current) viewRef.current = { lat: position.lat, lon: position.lon }
  }, [position])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let dpr = 1
    let base: HTMLCanvasElement | null = null
    let baseKey = ''
    let raf = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      base = null
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const render = (time: number) => {
      // Daylight shifts slowly, so the dot grid is rebuilt at most once a minute.
      const key = `${w}x${h}x${Math.floor(Date.now() / 60000)}`
      if (!base || key !== baseKey) {
        base = buildBaseMap(w, h, dpr)
        baseKey = key
      }

      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(base, 0, 0, w, h)

      const view = viewRef.current
      const target = targetRef.current
      if (!view || !target) {
        raf = requestAnimationFrame(render)
        return
      }

      const ease = still ? 1 : 0.045
      view.lat += (target.lat - view.lat) * ease
      view.lon += shortestTurn(view.lon, target.lon) * ease
      view.lon = wrapLon(view.lon)

      const { p, heading } = orbitFrame(view.lat, view.lon)

      const past: { lat: number; lon: number }[] = []
      for (let a = -150; a <= 0; a += 2) past.push(trackPoint(p, heading, a))
      const ahead: { lat: number; lon: number }[] = []
      for (let a = 0; a <= 200; a += 2) ahead.push(trackPoint(p, heading, a))

      ctx.save()
      ctx.lineWidth = 1.2
      ctx.setLineDash([4, 4])
      ctx.strokeStyle = 'rgba(125,211,252,0.55)'
      drawPolyline(ctx, ahead, w, h)
      ctx.restore()

      ctx.save()
      ctx.lineWidth = 1.8
      ctx.strokeStyle = 'rgba(224,242,254,0.9)'
      drawPolyline(ctx, past, w, h)
      ctx.restore()

      const ring: { lat: number; lon: number }[] = []
      for (let b = 0; b <= 360; b += 4) ring.push(offsetPoint(view.lat, view.lon, FOOTPRINT_DEG, b))
      ctx.save()
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(56,189,248,0.35)'
      drawPolyline(ctx, ring, w, h)
      ctx.restore()

      const x = lonToX(view.lon, w)
      const y = latToY(view.lat, h)

      ctx.save()
      ctx.setLineDash([2, 5])
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
      ctx.restore()

      const pulse = still ? 0.5 : (Math.sin(time * 0.0024) + 1) / 2

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 22)
      glow.addColorStop(0, 'rgba(125,211,252,0.42)')
      glow.addColorStop(1, 'rgba(125,211,252,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(x, y, 22, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(186,230,253,${0.5 - pulse * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y, 6 + pulse * 12, 0, Math.PI * 2)
      ctx.stroke()

      ctx.fillStyle = '#e0f2fe'
      ctx.beginPath()
      ctx.arc(x, y, 3.2, 0, Math.PI * 2)
      ctx.fill()

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [active])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
}

function useSpaceFeed(active: boolean) {
  const [data, setData] = useState<SpacePayload | null>(null)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        const res = await fetch('/api/space', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const payload = (await res.json()) as SpacePayload
        if (!cancelled) setData(payload)
      } catch {
        /* keep the last good reading */
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS)
      }
    }

    void tick()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active])

  return data
}

function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(false)
  const [foreground, setForeground] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: '160px',
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  useEffect(() => {
    const sync = () => setForeground(!document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  return onScreen && foreground
}

function UtcClock() {
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return <span className="tabular-nums">{now ?? '--:--:--'}</span>
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-xl tabular-nums text-sky-100/90 md:text-2xl">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-sky-200/35">{label}</div>
    </div>
  )
}

export function SpaceTracker() {
  const sectionRef = useRef<HTMLElement>(null)
  const active = useOnScreen(sectionRef)
  const data = useSpaceFeed(active)

  const position = data?.position ?? null
  const crew = data?.crew ?? null

  return (
    <section
      ref={sectionRef}
      id="tracking"
      className="relative overflow-hidden border-y border-white/10 bg-[#03060f]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 py-12 md:px-12 md:py-14 lg:px-20">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-sky-200/45">
          <span className="flex items-center gap-2">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-sky-400" />
            </span>
            Live from orbit
          </span>
          <span className="flex items-center gap-5">
            <span>
              {position ? `${position.lat >= 0 ? 'N' : 'S'} ${Math.abs(position.lat).toFixed(2)}°` : 'N --.--°'}
            </span>
            <span>
              {position ? `${position.lon >= 0 ? 'E' : 'W'} ${Math.abs(position.lon).toFixed(2)}°` : 'E ---.--°'}
            </span>
            <span className="hidden sm:inline">
              <UtcClock /> UTC
            </span>
          </span>
        </div>

        <h2 className="mt-8 max-w-3xl text-left text-[2.75rem] font-light leading-[1.08] tracking-tight text-sky-50 sm:text-5xl md:text-6xl">
          {crew ? crew.count : '—'} people are
          <br />
          off the planet
          <br />
          right now.
        </h2>

        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#050b18]">
          <div className="aspect-[168/64] w-full">
            <TrackerMap position={position} active={active} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="flex flex-wrap gap-x-12 gap-y-5">
            <Stat value="420 km" label="Altitude" />
            <Stat value="27,600" label="km / hour" />
            <Stat value="16" label="Sunrises a day" />
          </div>
          <p className="max-w-xs text-xs font-light leading-relaxed text-sky-200/40">
            Sixteen sunrises a day. You get one. Nobody said it was fair.
          </p>
        </div>
      </div>
    </section>
  )
}
