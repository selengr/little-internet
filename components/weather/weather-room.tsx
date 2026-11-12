'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { GrainGradient } from '@paper-design/shaders-react'
import { ArrowDown, Droplets, MapPin, Wind } from 'lucide-react'
import { ScrollChapter } from '@/components/rooms/scroll-chapter'
import { RoomNav } from '@/components/rooms/room-nav'
import type { WeatherBundle } from '@/lib/weather'
import { SKY_PALETTES, wmoLabel, wmoMood, type SkyMood } from '@/lib/wmo'

const mono = { fontFamily: 'var(--font-wx-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-wx-display), Georgia, serif' } as const

function formatTime(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    }).format(new Date(iso))
  } catch {
    return iso.slice(11, 16)
  }
}

function formatDay(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

function WeatherHero({
  progress,
  data,
  loading,
  error,
  placeLine,
  mood,
}: {
  progress: MotionValue<number>
  data: WeatherBundle | null
  loading: boolean
  error: string | null
  placeLine: string
  mood: SkyMood
}) {
  const palette = SKY_PALETTES[mood]
  const y = useTransform(progress, [0, 0.35, 1], ['0%', '-8%', '-22%'])
  const scale = useTransform(progress, [0, 0.5, 1], [1, 1.06, 1.14])
  const opacityFade = useTransform(progress, [0.55, 0.95], [1, 0])
  const titleY = useTransform(progress, [0, 0.45], [0, -120])
  const tempScale = useTransform(progress, [0, 0.55], [0.92, 1.08])
  const metaOpacity = useTransform(progress, [0, 0.2], [0.4, 1])

  return (
    <div className="relative h-full w-full">
      <motion.div className="absolute inset-0 -z-20" style={{ scale, y }}>
        <GrainGradient
          style={{ height: '120%', width: '100%' }}
          colorBack={palette.back}
          softness={0.82}
          intensity={0.62}
          noise={0.12}
          shape="corners"
          offsetX={0}
          offsetY={-0.08}
          scale={1.15}
          rotation={0}
          speed={loading ? 0.2 : 0.85}
          colors={palette.colors}
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_120%,rgba(0,0,0,.55),transparent_58%)]" />

      <motion.div
        className="relative mx-auto flex h-full max-w-5xl flex-col justify-between px-6 pb-16 pt-28 md:px-12 md:pt-32"
        style={{ opacity: opacityFade, y: titleY }}
      >
        <motion.p className="text-[11px] uppercase tracking-[0.38em] text-white/50" style={mono}>
          Open-Meteo · no API key
        </motion.p>

        <div className="flex flex-1 flex-col justify-center gap-6 md:gap-8">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
            <motion.div style={{ scale: tempScale }} className="origin-left">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/45" style={mono}>
                {loading ? '…' : wmoLabel(data?.current.code ?? 0)}
              </p>
              <p
                className="mt-1 text-[clamp(5.5rem,18vw,11rem)] font-light leading-[0.85] tracking-tight tabular-nums"
                style={display}
              >
                {loading ? '—' : Math.round(data!.current.temperature)}
                <span className="ml-2 text-[0.28em] align-top text-white/40">°</span>
              </p>
            </motion.div>
            <p className="max-w-sm text-lg font-light leading-snug text-white/70 md:text-xl" style={display}>
              {placeLine}
              <span className="mt-3 block text-sm text-white/45" style={{ fontFamily: 'system-ui' }}>
                Feels like {loading ? '—' : Math.round(data!.current.apparent)}° · humidity{' '}
                {loading ? '—' : data!.current.humidity}%
              </span>
            </p>
          </div>

          <motion.div className="flex flex-wrap gap-6 text-[12px] text-white/55" style={{ ...mono, opacity: metaOpacity }}>
            <span className="inline-flex items-center gap-2">
              <Wind className="size-3.5 text-sky-300/80" />
              {loading ? '—' : `${Math.round(data!.current.wind)} km/h`}
            </span>
            <span className="inline-flex items-center gap-2">
              <Droplets className="size-3.5 text-sky-300/80" />
              {loading ? '—' : placeLine}
            </span>
            <Link
              href="/location"
              className="inline-flex items-center gap-2 text-sky-200/90 underline decoration-sky-400/30 underline-offset-4 hover:text-white"
            >
              <MapPin className="size-3.5" />
              Pin on map
            </Link>
          </motion.div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="max-w-xs text-xs leading-relaxed text-white/40">
            Scroll — the sky deepens as the next chapter loads your hours and week ahead.
          </p>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="text-white/35"
          >
            <ArrowDown className="size-5" />
          </motion.div>
        </div>
      </motion.div>

      {error ? (
        <div className="absolute inset-x-6 bottom-24 rounded-2xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  )
}

function HourRibbon({ progress, data }: { progress: MotionValue<number>; data: WeatherBundle }) {
  const x = useTransform(progress, [0, 1], ['8%', '-42%'])
  const fade = useTransform(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0.6])

  return (
    <div className="relative flex h-full flex-col justify-center bg-[#020617] px-6 md:px-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(56,189,248,.12),transparent_55%)]" />
      <motion.div style={{ opacity: fade }}>
        <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/45" style={mono}>
          Next 24 hours
        </p>
        <h2 className="mt-2 text-4xl font-light tracking-tight md:text-5xl" style={display}>
          Hour by hour.
        </h2>
      </motion.div>
      <motion.div className="mt-12 flex gap-4 md:gap-5" style={{ x, opacity: fade }}>
        {data.hourly.time.map((t, i) => (
          <HourCard key={t} t={t} i={i} data={data} progress={progress} />
        ))}
      </motion.div>
    </div>
  )
}

function HourCard({
  t,
  i,
  data,
  progress,
}: {
  t: string
  i: number
  data: WeatherBundle
  progress: MotionValue<number>
}) {
  const cardY = useTransform(progress, [0, 1], [40 + i * 2, -8 - i])
  return (
    <motion.div
      className="min-w-[88px] shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 backdrop-blur-md"
      style={{ y: cardY }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/45" style={mono}>
        {formatTime(t, data.timezone)}
      </p>
      <p className="mt-3 text-3xl font-light tabular-nums" style={display}>
        {Math.round(data.hourly.temperature[i])}°
      </p>
      <p className="mt-2 text-[10px] text-white/40">{wmoLabel(data.hourly.code[i])}</p>
    </motion.div>
  )
}

function WeekChapter({ progress, data }: { progress: MotionValue<number>; data: WeatherBundle }) {
  const cardsY = useTransform(progress, [0, 0.4], [80, 0])
  const sunRotate = useTransform(progress, [0.2, 0.9], [-8, 24])
  const cardsOpacity = useTransform(progress, [0, 0.25], [0, 1])
  const sunScale = useTransform(progress, [0.3, 0.8], [0.6, 1])

  return (
    <div className="relative flex h-full flex-col justify-center gap-10 bg-gradient-to-b from-[#020617] to-[#0c1222] px-6 pb-24 pt-20 md:px-12">
      <div>
        <p className="text-[11px] uppercase tracking-[0.32em] text-white/40" style={mono}>
          Seven-day arc
        </p>
        <h2 className="mt-2 text-4xl font-light md:text-5xl" style={display}>
          Sunrise. Sunset. Repeat.
        </h2>
      </div>
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        style={{ y: cardsY, opacity: cardsOpacity }}
      >
        {data.daily.dates.slice(0, 7).map((d, i) => (
          <DayCard key={d} d={d} i={i} data={data} progress={progress} />
        ))}
      </motion.div>

      <motion.div
        className="mx-auto mt-4 h-px w-full max-w-3xl origin-center bg-gradient-to-r from-transparent via-amber-200/50 to-transparent"
        style={{ rotate: sunRotate, scaleX: sunScale }}
        aria-hidden
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
        <p className="max-w-md text-sm text-white/45">
          Your window to the sky — same place as location, tuned for forecast.
        </p>
        <Link
          href="/space"
          className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/90 backdrop-blur transition hover:bg-white/10"
        >
          Continue to space →
        </Link>
      </div>
    </div>
  )
}

function DayCard({
  d,
  i,
  data,
  progress,
}: {
  d: string
  i: number
  data: WeatherBundle
  progress: MotionValue<number>
}) {
  const cardScale = useTransform(progress, [0.1 + i * 0.04, 0.55 + i * 0.04], [0.94, 1])
  return (
    <motion.div
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
      style={{ scale: cardScale }}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/45" style={mono}>
        {formatDay(d, data.timezone)}
      </p>
      <p className="mt-2 text-2xl font-light" style={display}>
        <span className="text-white">{Math.round(data.daily.tempMax[i])}°</span>
        <span className="mx-2 text-white/25">/</span>
        <span className="text-white/55">{Math.round(data.daily.tempMin[i])}°</span>
      </p>
      <p className="mt-3 text-xs text-white/45" style={mono}>
        ↑ {formatTime(data.daily.sunrise[i], data.timezone)} · ↓{' '}
        {formatTime(data.daily.sunset[i], data.timezone)}
      </p>
    </motion.div>
  )
}

export function WeatherRoom({ fontVars }: { fontVars: string }) {
  const [data, setData] = useState<WeatherBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const locRes = await fetch('/api/location', { cache: 'no-store' })
        const loc = (await locRes.json()) as {
          latitude?: number
          longitude?: number
          city?: string
          country_name?: string
          country_code?: string
          error?: string
        }
        if (!locRes.ok || loc.error) throw new Error(loc.error ?? 'Could not read your place')
        const lat = loc.latitude
        const lon = loc.longitude
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          throw new Error('No coordinates — try /location first')
        }
        const q = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          ...(loc.city ? { city: loc.city } : {}),
          ...(loc.country_name ? { country: loc.country_name } : {}),
          ...(loc.country_code ? { countryCode: loc.country_code } : {}),
        })
        const wxRes = await fetch(`/api/weather?${q}`, { cache: 'no-store' })
        const wx = (await wxRes.json()) as WeatherBundle & { error?: string }
        if (!wxRes.ok || wx.error) throw new Error(wx.error ?? 'Forecast failed')
        if (!cancelled) setData(wx)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const mood = useMemo(() => (data ? wmoMood(data.current.code) : 'partly'), [data])

  const placeLine = data
    ? [data.place.city, data.place.country].filter(Boolean).join(' · ') ||
      `${data.place.lat.toFixed(2)}°, ${data.place.lon.toFixed(2)}°`
    : 'Locating your sky'

  return (
    <main className={`${fontVars} relative bg-[#030712] text-white selection:bg-sky-400/30`}>
      <RoomNav badge="SKY WINDOW" nextHref="/space" nextLabel="Space" />

      <ScrollChapter id="hero" runwayVh={220}>
        {({ progress }) => (
          <WeatherHero
            progress={progress}
            data={data}
            loading={loading}
            error={error}
            placeLine={placeLine}
            mood={mood}
          />
        )}
      </ScrollChapter>

      {data ? (
        <ScrollChapter id="hours" runwayVh={140}>
          {({ progress }) => <HourRibbon progress={progress} data={data} />}
        </ScrollChapter>
      ) : null}

      {data ? (
        <ScrollChapter id="week" runwayVh={150}>
          {({ progress }) => <WeekChapter progress={progress} data={data} />}
        </ScrollChapter>
      ) : null}

      {loading && !data ? (
        <div className="px-6 py-32 text-center text-white/50" style={mono}>
          Reading clouds…
        </div>
      ) : null}
    </main>
  )
}
