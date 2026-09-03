'use client'

import { useEffect, useRef, useState } from 'react'

type Position = { lat: number; lon: number; timestamp: number }
type Crew = { count: number; craft: { name: string; people: string[] }[] }
type SpacePayload = { position: Position | null; crew: Crew | null }

const POLL_MS = 5000
const DEG = Math.PI / 180
const INCLINATION = 51.64 * DEG
const ORBIT_SCALE = 1.11
const CAMERA_TILT = 10 * DEG

type Vec3 = [number, number, number]

function toVec(latDeg: number, lonDeg: number): Vec3 {
  const lat = latDeg * DEG
  const lon = lonDeg * DEG
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

/** Orthographic projection. x/y are screen offsets, depth > 0 means facing us. */
function project(v: Vec3, radius: number) {
  const ct = Math.cos(CAMERA_TILT)
  const st = Math.sin(CAMERA_TILT)
  return {
    x: v[1] * radius,
    y: -(-v[0] * st + v[2] * ct) * radius,
    depth: v[0] * ct + v[2] * st,
  }
}

/**
 * The great circle the station rides on: the one passing through its current
 * position at the ISS orbital inclination. Returns the position vector plus the
 * unit vector pointing along its direction of travel.
 */
function orbitFrame(latDeg: number, lonDeg: number) {
  const p = toVec(latDeg, lonDeg)
  const flat = Math.hypot(p[0], p[1])

  let normal: Vec3 = [0, 0, 1]
  if (flat > 1e-6) {
    const ratio = Math.max(-1, Math.min(1, -p[2] / Math.tan(INCLINATION) / flat))
    const node = Math.asin(ratio) - Math.atan2(-p[1], p[0])
    normal = [
      Math.sin(INCLINATION) * Math.sin(node),
      -Math.sin(INCLINATION) * Math.cos(node),
      Math.cos(INCLINATION),
    ]
  }

  return { p, heading: normalize(cross(normal, p)) }
}

function ringPoint(p: Vec3, heading: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [
    p[0] * c + heading[0] * s,
    p[1] * c + heading[1] * s,
    p[2] * c + heading[2] * s,
  ]
}

const STARS = (() => {
  let seed = 20231
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  return Array.from({ length: 54 }, () => ({
    x: rnd(),
    y: rnd(),
    r: 0.35 + rnd() * 0.85,
    phase: rnd() * Math.PI * 2,
  }))
})()

function shortestTurn(from: number, to: number) {
  let delta = to - from
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  return delta
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  size: number,
  time: number,
  view: { lat: number; lon: number; camLon: number },
  still: boolean,
) {
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.33

  ctx.clearRect(0, 0, size, size)

  for (const star of STARS) {
    const sx = star.x * size
    const sy = star.y * size
    if (Math.hypot(sx - cx, sy - cy) < R * 1.22) continue
    const twinkle = still ? 0.5 : 0.35 + 0.3 * Math.sin(time * 0.0012 + star.phase)
    ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.5})`
    ctx.beginPath()
    ctx.arc(sx, sy, star.r, 0, Math.PI * 2)
    ctx.fill()
  }

  const body = ctx.createRadialGradient(
    cx - R * 0.35,
    cy - R * 0.4,
    R * 0.1,
    cx,
    cy,
    R * 1.05,
  )
  body.addColorStop(0, 'rgba(38,74,124,0.55)')
  body.addColorStop(0.55, 'rgba(14,30,58,0.5)')
  body.addColorStop(1, 'rgba(4,8,18,0.75)')
  ctx.fillStyle = body
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()

  const lonOffset = view.camLon

  const strokePath = (points: Vec3[], radius: number, alpha: number, dash?: number[]) => {
    ctx.save()
    if (dash) ctx.setLineDash(dash)
    ctx.lineWidth = 1
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`
    ctx.beginPath()
    let drawing = false
    for (const v of points) {
      const pt = project(v, radius)
      if (pt.depth <= 0) {
        drawing = false
        continue
      }
      if (drawing) ctx.lineTo(cx + pt.x, cy + pt.y)
      else {
        ctx.moveTo(cx + pt.x, cy + pt.y)
        drawing = true
      }
    }
    ctx.stroke()
    ctx.restore()
  }

  for (let lon = 0; lon < 360; lon += 30) {
    const points: Vec3[] = []
    for (let lat = -90; lat <= 90; lat += 4) points.push(toVec(lat, lon - lonOffset))
    strokePath(points, R, 0.09)
  }

  for (let lat = -60; lat <= 60; lat += 30) {
    const points: Vec3[] = []
    for (let lon = 0; lon <= 360; lon += 4) points.push(toVec(lat, lon - lonOffset))
    strokePath(points, R, lat === 0 ? 0.16 : 0.09)
  }

  ctx.strokeStyle = 'rgba(140,190,255,0.28)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()

  const { p, heading } = orbitFrame(view.lat, view.lon - lonOffset)

  const groundTrack: Vec3[] = []
  for (let a = 0; a <= 360; a += 3) groundTrack.push(ringPoint(p, heading, a * DEG))
  strokePath(groundTrack, R * 1.002, 0.14, [2, 5])

  for (let a = 0; a < 360; a += 3) {
    const from = ringPoint(p, heading, a * DEG)
    const to = ringPoint(p, heading, (a + 3) * DEG)
    const f = project(from, R * ORBIT_SCALE)
    const t = project(to, R * ORBIT_SCALE)
    const facing = (f.depth + t.depth) / 2 > 0
    ctx.strokeStyle = `rgba(156,205,255,${facing ? 0.3 : 0.08})`
    ctx.lineWidth = facing ? 1.1 : 0.8
    ctx.beginPath()
    ctx.moveTo(cx + f.x, cy + f.y)
    ctx.lineTo(cx + t.x, cy + t.y)
    ctx.stroke()
  }

  // Recent path, brightening as it reaches the station
  for (let a = -54; a < 0; a += 2) {
    const from = ringPoint(p, heading, a * DEG)
    const to = ringPoint(p, heading, (a + 2) * DEG)
    const f = project(from, R * ORBIT_SCALE)
    const t = project(to, R * ORBIT_SCALE)
    if (f.depth <= 0 || t.depth <= 0) continue
    ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 + a / 54)})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.moveTo(cx + f.x, cy + f.y)
    ctx.lineTo(cx + t.x, cy + t.y)
    ctx.stroke()
  }

  const station = project(p, R * ORBIT_SCALE)
  const nadir = project(p, R)
  if (station.depth > -0.12) {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx + nadir.x, cy + nadir.y)
    ctx.lineTo(cx + station.x, cy + station.y)
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(cx + nadir.x, cy + nadir.y, 1.6, 0, Math.PI * 2)
    ctx.fill()

    const sx = cx + station.x
    const sy = cy + station.y
    const pulse = still ? 0.5 : (Math.sin(time * 0.0022) + 1) / 2

    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 16)
    glow.addColorStop(0, 'rgba(190,225,255,0.5)')
    glow.addColorStop(1, 'rgba(190,225,255,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(sx, sy, 16, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(255,255,255,${0.4 - pulse * 0.32})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(sx, sy, 5 + pulse * 8, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(sx, sy, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function OrbitGlobe({
  position,
  active,
}: {
  position: Position | null
  active: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetRef = useRef<Position | null>(null)
  const viewRef = useRef<{ lat: number; lon: number; camLon: number } | null>(null)

  useEffect(() => {
    if (!position) return
    targetRef.current = position
    if (!viewRef.current) {
      viewRef.current = { lat: position.lat, lon: position.lon, camLon: position.lon }
    }
  }, [position])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !active) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let size = 0
    let raf = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      size = Math.max(1, Math.round(rect.width))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const render = (time: number) => {
      const view = viewRef.current
      const target = targetRef.current

      if (view && target) {
        // Readings land every few seconds; glide between them so the station
        // never jumps across the globe.
        const ease = still ? 1 : 0.045
        view.lat += (target.lat - view.lat) * ease
        view.lon += shortestTurn(view.lon, target.lon) * ease
        view.camLon += shortestTurn(view.camLon, target.lon) * ease
        if (view.lon > 180) view.lon -= 360
        if (view.lon < -180) view.lon += 360
        drawScene(ctx, size, time, view, still)
      } else {
        drawScene(ctx, size, time, { lat: 0, lon: 0, camLon: 0 }, still)
      }

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
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!active) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      try {
        const res = await fetch('/api/space', { cache: 'no-store' })
        if (!res.ok) throw new Error(String(res.status))
        const payload = (await res.json()) as SpacePayload
        if (!cancelled) {
          setData(payload)
          setFailed(false)
        }
      } catch {
        if (!cancelled) setFailed(true)
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

  return { data, failed }
}

/** True while the section is on screen and the tab is in the foreground. */
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

function formatCoord(value: number | undefined, positive: string, negative: string) {
  if (value == null) return '—'
  return `${Math.abs(value).toFixed(4)}° ${value >= 0 ? positive : negative}`
}

export function SpaceStation() {
  const sectionRef = useRef<HTMLElement>(null)
  const active = useOnScreen(sectionRef)
  const { data, failed } = useSpaceFeed(active)

  const position = data?.position ?? null
  const crew = data?.crew ?? null

  return (
    <section
      ref={sectionRef}
      id="orbit"
      className="relative overflow-hidden border-y border-white/10 bg-[#05070e] text-white"
    >
      <div className="pointer-events-none absolute -left-40 top-[-30%] h-[420px] w-[420px] rounded-full bg-sky-500/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-[-40%] h-[420px] w-[420px] rounded-full bg-indigo-500/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 py-14 md:px-12 md:py-16 lg:px-20">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/50">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-sky-400" />
              </span>
              Live from orbit
            </span>

            <h2 className="mt-5 text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
              {crew ? crew.count : '—'} people are
              <br />
              off the planet
              <br />
              right now.
            </h2>

            <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-white/45">
              The station laps the Earth every 90 minutes at 28,000 km/h.
            </p>

            <div className="mt-8 flex gap-10">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">
                  Latitude
                </div>
                <div className="mt-1.5 font-mono text-lg tabular-nums text-white/90">
                  {formatCoord(position?.lat, 'N', 'S')}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">
                  Longitude
                </div>
                <div className="mt-1.5 font-mono text-lg tabular-nums text-white/90">
                  {formatCoord(position?.lon, 'E', 'W')}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="mx-auto aspect-square w-full max-w-[320px]">
              <OrbitGlobe position={position} active={active} />
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/35">
            Who is up there
          </div>

          <div className="mt-4 flex flex-wrap gap-x-12 gap-y-5">
            {crew?.craft.map(craft => (
              <div key={craft.name}>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-light text-white/80">{craft.name}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    {craft.people.length} aboard
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {craft.people.map(name => (
                    <span
                      key={name}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-light text-white/60"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
