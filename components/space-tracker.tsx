'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LAND_MASK,
  LAND_COLS,
  LAND_ROWS,
  LAND_LON_MIN,
  LAND_LON_MAX,
  LAND_LAT_MIN,
  LAND_LAT_MAX,
  isNearLand,
} from '@/lib/iss-land-mask'
import { describePlace } from '@/lib/iss-place'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Position = { lat: number; lon: number; timestamp: number; altitude?: number; velocity?: number }
type Crew = { count: number; craft: { name: string; people: string[] }[]; since?: number }
type SpacePayload = { position: Position | null }
type FeedStatus = 'connecting' | 'live' | 'reconnecting'

const CREW_CACHE_KEY = 'space-crew-v1'

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
  // Arithmetic rather than a loop, so a bad value can never hang the page.
  if (!Number.isFinite(lon)) return 0
  if (lon >= -180 && lon <= 180) return lon
  return lon - 360 * Math.ceil((lon - 180) / 360)
}

function shortestTurn(from: number, to: number) {
  const delta = to - from
  if (!Number.isFinite(delta)) return 0
  return delta - 360 * Math.round(delta / 360)
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

type LL = { lat: number; lon: number }
type Target = Position & { receivedAt: number }

const TRAIL_DEG = 150 // how far behind the station the path is drawn
const AHEAD_DEG = 200 // how far ahead
const STEP_DEG = 1 // sampling step along the orbit
const PATH_REFRESH_MS = 100 // the path is recomputed this often once the intro is over
const INTRO_MS = 3200
const INTRO_SWEEP_DEG = 75 // the intro starts this far behind the real position

/**
 * Where the station is right now: its last reading flown forward along the orbit. Uses the time
 * since the reading *arrived* (not the upstream timestamp), so a wrong device clock can't skew it.
 */
function predictPosition(reading: Target, nowMs: number): LL {
  const dt = Math.max(0, Math.min(120, (nowMs - reading.receivedAt) / 1000))
  if (dt === 0) return { lat: reading.lat, lon: reading.lon }
  const { p, heading } = orbitFrame(reading.lat, reading.lon)
  const point = trackPoint(p, heading, (dt * 360) / ORBIT_PERIOD_S)
  return { lat: point.lat, lon: wrapLon(point.lon) }
}

/**
 * Walks a path and hands each piece to `draw` as screen coordinates. A piece that crosses the map's
 * left/right edge is split in two at the exact crossing point, so the line runs all the way to the
 * edge and carries on from the opposite edge, with no gap.
 */
function forEachSegment(
  points: LL[],
  w: number,
  h: number,
  draw: (x1: number, y1: number, x2: number, y2: number, index: number) => void,
) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const lonA = wrapLon(a.lon)
    const lonB = wrapLon(b.lon)
    const delta = lonB - lonA

    if (Math.abs(delta) > 180) {
      const east = delta < 0 // e.g. 179° -> -179°: heading east across +180°
      const edge = east ? 180 : -180
      const lonBUnwrapped = east ? lonB + 360 : lonB - 360
      const t = (edge - lonA) / (lonBUnwrapped - lonA)
      const latEdge = a.lat + (b.lat - a.lat) * t
      draw(lonToX(lonA, w), latToY(a.lat, h), lonToX(edge, w), latToY(latEdge, h), i)
      draw(lonToX(-edge, w), latToY(latEdge, h), lonToX(lonB, w), latToY(b.lat, h), i)
    } else {
      draw(lonToX(lonA, w), latToY(a.lat, h), lonToX(lonB, w), latToY(b.lat, h), i)
    }
  }
}

function TrackerMap({
  position,
  active,
  introPlayed,
}: {
  position: Position | null
  active: boolean
  introPlayed: { current: boolean }
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef<Target | null>(null)
  const viewRef = useRef<LL | null>(null)

  useEffect(() => {
    if (!position) return
    targetRef.current = { ...position, receivedAt: Date.now() }
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
    let introStart: number | null = null
    let pathCache: { at: number; past: LL[]; ahead: LL[] } | null = null

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

      // The real position keeps moving between readings, so the marker flies continuously.
      const live = predictPosition(target, Date.now())

      // First time on screen: the path sweeps in from behind and settles on the real position.
      let progress = 1
      if (!still && !introPlayed.current) {
        if (introStart === null) introStart = time
        progress = Math.min(1, (time - introStart) / INTRO_MS)
        if (progress >= 1) introPlayed.current = true
      }
      const eased = 1 - Math.pow(1 - progress, 3)
      const fade = progress >= 1 ? 1 : 0.2 + 0.8 * eased

      let frame: ReturnType<typeof orbitFrame>
      let offset = 0
      if (progress < 1) {
        frame = orbitFrame(live.lat, live.lon)
        offset = -INTRO_SWEEP_DEG * (1 - eased)
        const point = trackPoint(frame.p, frame.heading, offset)
        view.lat = point.lat
        view.lon = wrapLon(point.lon)
      } else {
        const ease = still ? 1 : 0.08
        view.lat += (live.lat - view.lat) * ease
        view.lon += shortestTurn(view.lon, live.lon) * ease
        view.lon = wrapLon(view.lon)
        frame = orbitFrame(view.lat, view.lon)
      }
      const at = (angle: number) => trackPoint(frame.p, frame.heading, offset + angle)

      // The path barely moves between frames, so it is reused for a moment instead of being
      // recomputed 60 times a second (the marker itself is still updated every frame).
      if (!pathCache || progress < 1 || time - pathCache.at > PATH_REFRESH_MS) {
        const past: LL[] = []
        for (let a = -TRAIL_DEG; a <= 0; a += STEP_DEG) past.push(at(a))
        const ahead: LL[] = []
        for (let a = 0; a <= AHEAD_DEG; a += STEP_DEG) ahead.push(at(a))
        pathCache = { at: time, past, ahead }
      }
      const { past, ahead } = pathCache

      // Path behind the station: a comet tail, bright and thick at the station, fading to nothing.
      const tailBands = 10
      const tail = Array.from({ length: tailBands }, () => new Path2D())
      forEachSegment(past, w, h, (x1, y1, x2, y2, i) => {
        const band = Math.min(tailBands - 1, Math.floor((i / (past.length - 1)) * tailBands))
        tail[band].moveTo(x1, y1)
        tail[band].lineTo(x2, y2)
      })
      ctx.save()
      ctx.lineCap = 'round'
      tail.forEach((path, band) => {
        const t = (band + 0.5) / tailBands
        ctx.strokeStyle = `rgba(224,242,254,${(0.9 * Math.pow(t, 1.6) * fade).toFixed(3)})`
        ctx.lineWidth = 0.6 + 1.5 * t
        ctx.stroke(path)
      })
      ctx.restore()

      // Path ahead: dashes that march in the direction of travel and fade out with distance.
      const aheadBands = 8
      const route = Array.from({ length: aheadBands }, () => new Path2D())
      const phase = still ? 0 : time * 0.011
      forEachSegment(ahead, w, h, (x1, y1, x2, y2, i) => {
        if ((((i - phase) % 10) + 10) % 10 >= 5) return
        const band = Math.min(aheadBands - 1, Math.floor((i / (ahead.length - 1)) * aheadBands))
        route[band].moveTo(x1, y1)
        route[band].lineTo(x2, y2)
      })
      ctx.save()
      ctx.lineWidth = 1.3
      route.forEach((path, band) => {
        const t = (band + 0.5) / aheadBands
        ctx.strokeStyle = `rgba(125,211,252,${(0.6 * Math.pow(1 - t, 1.2) * fade).toFixed(3)})`
        ctx.stroke(path)
      })
      ctx.restore()

      // Coverage ring: grows out from the station during the intro.
      const ringRadius = FOOTPRINT_DEG * (progress >= 1 ? 1 : 0.15 + 0.85 * eased)
      const ring: LL[] = []
      for (let b = 0; b <= 360; b += 4) ring.push(offsetPoint(view.lat, view.lon, ringRadius, b))
      const ringPath = new Path2D()
      forEachSegment(ring, w, h, (x1, y1, x2, y2) => {
        ringPath.moveTo(x1, y1)
        ringPath.lineTo(x2, y2)
      })
      ctx.save()
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgba(56,189,248,${(0.35 * fade).toFixed(3)})`
      ctx.stroke(ringPath)
      ctx.restore()

      const x = lonToX(view.lon, w)
      const y = latToY(view.lat, h)

      ctx.save()
      ctx.setLineDash([2, 5])
      ctx.strokeStyle = `rgba(255,255,255,${(0.16 * fade).toFixed(3)})`
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
  }, [active, introPlayed])

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
}

function useSpaceFeed(active: boolean) {
  const [data, setData] = useState<SpacePayload | null>(null)
  const [status, setStatus] = useState<FeedStatus>('connecting')

  useEffect(() => {
    if (!active) return

    let cancelled = false
    let failures = 0
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        const res = await fetch('/api/space', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const payload = (await res.json()) as SpacePayload
        if (!cancelled) {
          failures = 0
          setData(payload)
          setStatus('live')
        }
      } catch {
        // Keep the last good reading on the map, but stop calling it live after two misses.
        failures += 1
        if (!cancelled && failures >= 2) setStatus('reconnecting')
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

  return { data, status }
}

const isCrew = (value: unknown): value is Crew =>
  !!value &&
  typeof (value as Crew).count === 'number' &&
  Array.isArray((value as Crew).craft)

/**
 * The head-count. Fetched as soon as the page loads (not when the section scrolls into view), and
 * remembered on the device, so it is usually on screen instantly. The server response is cached, so
 * a first visit is a fast edge hit too.
 */
function useCrew() {
  const [crew, setCrew] = useState<Crew | null>(null)

  useEffect(() => {
    let cancelled = false

    try {
      const saved = JSON.parse(localStorage.getItem(CREW_CACHE_KEY) ?? 'null')
      if (isCrew(saved)) setCrew(saved)
    } catch {
      /* no saved copy, or storage unavailable */
    }

    fetch('/api/space/crew')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (cancelled || !isCrew(json?.crew)) return
        setCrew(json.crew)
        try {
          localStorage.setItem(CREW_CACHE_KEY, JSON.stringify(json.crew))
        } catch {
          /* storage full or blocked */
        }
      })
      .catch(() => {
        /* keep the saved copy, if any */
      })

    return () => {
      cancelled = true
    }
  }, [])

  return crew
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
  const introPlayed = useRef(false)
  const active = useOnScreen(sectionRef)
  const { data, status } = useSpaceFeed(active)
  const crew = useCrew()
  const [crewOpen, setCrewOpen] = useState(false)

  const position = data?.position ?? null
  const place = useMemo(
    () =>
      position ? describePlace(position.lat, position.lon, isNearLand(position.lat, position.lon)) : null,
    [position],
  )
  const daysAboard =
    crew?.since && crew.since > 0 ? Math.floor((Date.now() / 1000 - crew.since) / 86400) : null

  return (
    <section
      ref={sectionRef}
      id="tracking"
      className="relative overflow-hidden border-y border-white/10 bg-[#03060f]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-6 py-6 md:px-12 md:py-8 lg:px-20">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-sky-200/45">
          <span className="flex items-center gap-2" role="status">
            <span className="relative flex size-1.5">
              {status === 'live' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70 motion-reduce:animate-none" />
              )}
              <span
                className={`relative inline-flex size-1.5 rounded-full ${
                  status === 'reconnecting' ? 'bg-amber-400' : status === 'live' ? 'bg-sky-400' : 'bg-sky-400/50'
                }`}
              />
            </span>
            {status === 'reconnecting'
              ? 'Signal lost · retrying'
              : status === 'live'
                ? 'Live from orbit'
                : 'Connecting to orbit'}
          </span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {place && <span className="text-sky-100/70">Over {place}</span>}
            <span className="hidden sm:inline">
              {position ? `${position.lat >= 0 ? 'N' : 'S'} ${Math.abs(position.lat).toFixed(2)}°` : 'N --.--°'}
            </span>
            <span className="hidden sm:inline">
              {position ? `${position.lon >= 0 ? 'E' : 'W'} ${Math.abs(position.lon).toFixed(2)}°` : 'E ---.--°'}
            </span>
            <span className="hidden sm:inline">
              <UtcClock /> UTC
            </span>
          </span>
        </div>

        <h2 className="mt-4 max-w-5xl text-left text-[2.05rem] font-light leading-[1.1] tracking-tight text-sky-50 sm:text-4xl md:text-5xl">
          {crew ? (
            <button
              type="button"
              onClick={() => setCrewOpen(true)}
              aria-haspopup="dialog"
              aria-label={`${crew.count} people. Show who they are`}
              className="cursor-pointer rounded-sm underline decoration-sky-300/40 decoration-dotted decoration-2 underline-offset-[0.14em] transition-colors hover:decoration-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
            >
              {crew.count}
              <span
                aria-hidden
                className="ml-1 align-super font-mono text-[10px] uppercase tracking-[0.2em] text-sky-300/60"
              >
                who?
              </span>
            </button>
          ) : (
            <>
              <span
                aria-hidden
                className="inline-block h-[0.8em] w-[1.1em] animate-pulse rounded-md bg-sky-200/15 align-baseline motion-reduce:animate-none"
              />
              <span className="sr-only">Loading</span>
            </>
          )}{' '}
          people are
          off the planet
          right now.
        </h2>

        <div
          role="img"
          aria-label={place ? `World map: the space station is over ${place}` : 'World map showing the space station'}
          className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#050b18]"
        >
          <div className="aspect-[168/64] w-full">
            <TrackerMap position={position} active={active} introPlayed={introPlayed} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:gap-x-10 md:gap-x-12">
            <Stat
              value={position?.altitude ? `${Math.round(position.altitude)} km` : '420 km'}
              label="Altitude"
            />
            <Stat
              value={position?.velocity ? Math.round(position.velocity).toLocaleString('en-US') : '27,600'}
              label="km / hour"
            />
            <Stat value="16" label="Sunrises a day" />
            {daysAboard !== null && daysAboard >= 1 && (
              <Stat value={`${daysAboard} days`} label="Longest stay aboard" />
            )}
          </div>
          <p className="max-w-xs text-xs font-light leading-relaxed text-sky-200/40">
            Sixteen sunrises a day. You get one. Nobody said it was fair.
          </p>
        </div>
      </div>

      {crew && (
        <Dialog open={crewOpen} onOpenChange={setCrewOpen}>
          <DialogContent className="max-h-[85dvh] gap-5 overflow-y-auto border-white/10 bg-[#050b18] text-sky-50 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-light tracking-tight text-sky-50">
                {crew.count} people in orbit
              </DialogTitle>
              <DialogDescription className="text-sky-200/55">
                Who is up there right now, by spacecraft.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              {crew.craft.map(c => (
                <section key={c.name}>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-sky-200/45">
                    {c.name === 'ISS' ? 'On the ISS' : `On ${c.name}`} · {c.people.length}
                  </h3>
                  <ul className="space-y-1.5">
                    {c.people.map(person => (
                      <li key={person} className="flex items-center gap-2.5 text-[15px] text-sky-50/90">
                        <span aria-hidden className="size-1 shrink-0 rounded-full bg-sky-300/60" />
                        {person}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            {daysAboard !== null && daysAboard >= 1 && (
              <p className="border-t border-white/10 pt-4 text-xs font-light leading-relaxed text-sky-200/45">
                The longest current stay is {daysAboard} days. The crew list is refreshed every 30 minutes.
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
