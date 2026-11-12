'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, MapPin, RefreshCw, Search, Wind } from 'lucide-react'
import { RoomNav } from '@/components/rooms/room-nav'
import type { WeatherBundle } from '@/lib/weather'
import {
  browserGeolocation,
  defaultPlace,
  fromIpstack,
  geocodeQuery,
  type ResolvedPlace,
} from '@/lib/resolve-place'
import type { IpstackData } from '@/types/ipstack'
import { wmoLabel, wmoMood } from '@/lib/wmo'
import { useTheme } from '@/components/theme-provider'

const mono = { fontFamily: 'var(--font-wx-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-wx-display), Georgia, serif' } as const

function formatTime(iso: string, tz: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(
      new Date(iso),
    )
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

async function loadWeather(place: ResolvedPlace): Promise<WeatherBundle> {
  const q = new URLSearchParams({
    lat: String(place.lat),
    lon: String(place.lon),
    ...(place.city ? { city: place.city } : {}),
    ...(place.country ? { country: place.country } : {}),
    ...(place.countryCode ? { countryCode: place.countryCode } : {}),
  })
  const res = await fetch(`/api/weather?${q}`, { cache: 'no-store' })
  const json = (await res.json()) as WeatherBundle & { error?: string }
  if (!res.ok || json.error) throw new Error(json.error ?? 'Forecast failed')
  return json
}

async function resolvePlace(): Promise<ResolvedPlace> {
  try {
    const res = await fetch('/api/location', { cache: 'no-store' })
    if (res.ok) {
      const json = (await res.json()) as IpstackData & { error?: string }
      if (!json.error) {
        const fromIp = fromIpstack(json)
        if (fromIp) return fromIp
      }
    }
  } catch {
    /* try geolocation */
  }
  const geo = await browserGeolocation()
  if (geo) return geo
  return defaultPlace()
}

export function WeatherRoom({ fontVars }: { fontVars: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [place, setPlace] = useState<ResolvedPlace | null>(null)
  const [data, setData] = useState<WeatherBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  const refresh = useCallback(async (nextPlace?: ResolvedPlace) => {
    setLoading(true)
    setError(null)
    try {
      const p = nextPlace ?? (await resolvePlace())
      setPlace(p)
      const wx = await loadWeather(p)
      setData(wx)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load weather')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    try {
      const hit = await geocodeQuery(query)
      if (!hit) {
        setError('No place found — try another spelling.')
        return
      }
      setPlace(hit)
      const wx = await loadWeather(hit)
      setData(wx)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const mood = data ? wmoMood(data.current.code) : 'partly'
  const placeLabel = useMemo(() => {
    if (!place) return '…'
    const parts = [place.city, place.country].filter(Boolean)
    if (parts.length) return parts.join(', ')
    return `${place.lat.toFixed(2)}°, ${place.lon.toFixed(2)}°`
  }, [place])

  const skyWash =
    mood === 'rain' || mood === 'storm'
      ? 'var(--wx-wash-storm)'
      : mood === 'clear'
        ? 'var(--wx-wash-clear)'
        : 'var(--wx-wash-default)'

  return (
    <main
      data-wx-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip text-[var(--wx-fg)]`}
      style={{ background: 'var(--wx-bg)' }}
    >
      <style>{`
        [data-wx-theme="light"] {
          --wx-bg: #e8f1f8;
          --wx-fg: #0e1a24;
          --wx-mute: rgba(14, 26, 36, 0.55);
          --wx-panel: rgba(255, 255, 255, 0.82);
          --wx-line: rgba(14, 26, 36, 0.12);
          --wx-signal: #0b7ea8;
          --wx-wash-clear: radial-gradient(ellipse 80% 55% at 20% 0%, rgba(14,165,233,.22), transparent 55%),
            linear-gradient(165deg, #e8f1f8 0%, #d4e5f0 100%);
          --wx-wash-default: radial-gradient(ellipse 70% 50% at 100% 0%, rgba(100,116,139,.12), transparent 50%),
            linear-gradient(165deg, #e8f1f8 0%, #dce8f0 100%);
          --wx-wash-storm: radial-gradient(ellipse 65% 45% at 50% 0%, rgba(51,65,85,.18), transparent 55%),
            linear-gradient(165deg, #dde4ec 0%, #cfd9e3 100%);
        }
        [data-wx-theme="dark"] {
          --wx-bg: #071218;
          --wx-fg: #e6f0f6;
          --wx-mute: rgba(230, 240, 246, 0.52);
          --wx-panel: rgba(12, 28, 38, 0.82);
          --wx-line: rgba(230, 240, 246, 0.12);
          --wx-signal: #38bdf8;
          --wx-wash-clear: radial-gradient(ellipse 75% 50% at 15% 0%, rgba(56,189,248,.16), transparent 52%),
            linear-gradient(165deg, #071218 0%, #0a1c28 100%);
          --wx-wash-default: radial-gradient(ellipse 60% 45% at 100% 100%, rgba(71,85,105,.2), transparent 48%),
            linear-gradient(165deg, #071218 0%, #0b1a22 100%);
          --wx-wash-storm: radial-gradient(ellipse 70% 50% at 50% 0%, rgba(30,41,59,.35), transparent 55%),
            linear-gradient(165deg, #050a10 0%, #0a121a 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: skyWash }} />

      <RoomNav badge="WEATHER" nextHref="/space" nextLabel="Space" />

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-24 md:px-8 md:pt-28">
        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--wx-mute)]" style={mono}>
            Open-Meteo · live forecast
          </p>
          <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl" style={display}>
            Sky over <span className="text-[var(--wx-signal)]">{placeLabel}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--wx-mute)]">
            Uses your IP or browser location, or search any city. No API keys.
          </p>

          <form onSubmit={onSearch} className="mt-6 flex flex-wrap gap-2">
            <label className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--wx-mute)]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search city…"
                className="w-full rounded-xl border border-[var(--wx-line)] bg-[var(--wx-panel)] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--wx-signal)]"
              />
            </label>
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl border border-[var(--wx-line)] bg-[var(--wx-signal)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {searching ? 'Looking…' : 'Go'}
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--wx-line)] bg-[var(--wx-panel)] px-4 py-2.5 text-sm"
            >
              <RefreshCw className="size-4" />
              Use my location
            </button>
          </form>
        </header>

        {error ? (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-100">
            {error}
          </div>
        ) : null}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--wx-line)] bg-[var(--wx-panel)] p-6 md:p-8 shadow-sm"
        >
          <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--wx-mute)]" style={mono}>
            {loading ? 'Loading…' : wmoLabel(data?.current.code ?? 0)}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-6">
            <p className="text-7xl font-light tabular-nums md:text-8xl" style={display}>
              {loading ? '—' : Math.round(data!.current.temperature)}
              <span className="text-3xl text-[var(--wx-mute)]">°C</span>
            </p>
            <dl className="flex flex-wrap gap-6 text-sm" style={mono}>
              <div>
                <dt className="text-[var(--wx-mute)]">Feels like</dt>
                <dd className="text-lg">{loading ? '—' : `${Math.round(data!.current.apparent)}°`}</dd>
              </div>
              <div>
                <dt className="text-[var(--wx-mute)]">Humidity</dt>
                <dd className="text-lg">{loading ? '—' : `${data!.current.humidity}%`}</dd>
              </div>
              <div>
                <dt className="text-[var(--wx-mute)]">Wind</dt>
                <dd className="inline-flex items-center gap-1 text-lg">
                  <Wind className="size-4" />
                  {loading ? '—' : `${Math.round(data!.current.wind)} km/h`}
                </dd>
              </div>
            </dl>
          </div>
        </motion.section>

        {data ? (
          <>
            <section className="mt-10">
              <h2 className="text-xl font-light" style={display}>
                Next 24 hours
              </h2>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {data.hourly.time.map((t, i) => (
                  <div
                    key={t}
                    className="min-w-[88px] shrink-0 rounded-xl border border-[var(--wx-line)] bg-[var(--wx-panel)] px-3 py-4 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-[var(--wx-mute)]" style={mono}>
                      {formatTime(t, data.timezone)}
                    </p>
                    <p className="mt-2 text-2xl font-light" style={display}>
                      {Math.round(data.hourly.temperature[i])}°
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="text-xl font-light" style={display}>
                Seven days
              </h2>
              <ul className="mt-4 space-y-2">
                {data.daily.dates.slice(0, 7).map((d, i) => (
                  <li
                    key={d}
                    className="flex items-center justify-between rounded-xl border border-[var(--wx-line)] bg-[var(--wx-panel)] px-4 py-3"
                  >
                    <span className="text-sm" style={mono}>
                      {formatDay(d, data.timezone)}
                    </span>
                    <span className="tabular-nums" style={display}>
                      {Math.round(data.daily.tempMax[i])}°{' '}
                      <span className="text-[var(--wx-mute)]">/ {Math.round(data.daily.tempMin[i])}°</span>
                    </span>
                    <span className="hidden text-xs text-[var(--wx-mute)] sm:inline" style={mono}>
                      ↑ {formatTime(data.daily.sunrise[i], data.timezone)} · ↓{' '}
                      {formatTime(data.daily.sunset[i], data.timezone)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        <footer className="mt-14 flex flex-wrap gap-3 border-t border-[var(--wx-line)] pt-8">
          <Link
            href="/location"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--wx-line)] px-4 py-2 text-sm"
          >
            <MapPin className="size-4" />
            Location map
          </Link>
          <Link
            href="/space"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--wx-line)] px-4 py-2 text-sm"
          >
            Orbit room
            <ArrowRight className="size-4" />
          </Link>
        </footer>
      </div>
    </main>
  )
}
