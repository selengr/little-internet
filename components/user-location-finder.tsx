'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Crosshair, Search, Copy, Check } from 'lucide-react'
import type { IpstackData } from '@/types/ipstack'
import { cn } from '@/lib/utils'

function formatLocalTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

interface PreciseLocation {
  latitude: number
  longitude: number
  accuracy: number
  city?: string
  locality?: string
  principalSubdivision?: string
  countryName?: string
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<Partial<PreciseLocation>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return {}
    const json = await res.json()
    const addr = json.address ?? {}
    return {
      city: addr.city || addr.town || addr.village || addr.county || undefined,
      locality: addr.suburb || addr.neighbourhood || addr.road || undefined,
      principalSubdivision: addr.state || addr.region || undefined,
      countryName: addr.country || undefined,
    }
  } catch {
    return {}
  }
}

async function forwardGeocode(query: string): Promise<PreciseLocation | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        query,
      )}&limit=1&addressdetails=1&accept-language=en`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) return null
    const r = results[0]
    const addr = r.address ?? {}
    return {
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      accuracy: 0,
      city: addr.city || addr.town || addr.village || addr.county || r.name || undefined,
      locality: addr.suburb || addr.neighbourhood || undefined,
      principalSubdivision: addr.state || addr.region || undefined,
      countryName: addr.country || undefined,
    }
  } catch {
    return null
  }
}

function LiveClock({ timeZone, fallbackIso }: { timeZone: string; fallbackIso: string }) {
  const [now, setNow] = useState(() => formatLocalTime(fallbackIso))

  useEffect(() => {
    const tick = () => {
      try {
        setNow(
          new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZone: timeZone || undefined,
            timeZoneName: 'short',
          }).format(new Date()),
        )
      } catch {
        setNow(formatLocalTime(new Date().toISOString()))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [timeZone, fallbackIso])

  return <span className="tabular-nums">{now}</span>
}

function CornerMarks({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0', className)} aria-hidden>
      <span className="absolute top-3 left-3 size-4 border-l-2 border-t-2 border-[color:var(--loc-signal)]" />
      <span className="absolute top-3 right-3 size-4 border-r-2 border-t-2 border-[color:var(--loc-signal)]" />
      <span className="absolute bottom-3 left-3 size-4 border-l-2 border-b-2 border-[color:var(--loc-signal)]" />
      <span className="absolute bottom-3 right-3 size-4 border-r-2 border-b-2 border-[color:var(--loc-signal)]" />
    </div>
  )
}

export function UserLocationFinder() {
  const [data, setData] = useState<IpstackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [precise, setPrecise] = useState<PreciseLocation | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [usePrecise, setUsePrecise] = useState(false)

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleManualSearch = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    setSearchError(null)
    const found = await forwardGeocode(q)
    if (found) {
      setPrecise(found)
      setUsePrecise(true)
      setGeoError(null)
      setShowSearch(false)
    } else {
      setSearchError(`Couldn't find “${q}”. Try City, Country.`)
    }
    setSearching(false)
  }, [searchQuery])

  const fetchLocation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/location?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load location')
      setData(json as IpstackData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  const requestPrecise = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeoError('Geolocation is not available in this browser.')
      return
    }

    setGeoLoading(true)
    setGeoError(null)

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords
      const place = await reverseGeocode(latitude, longitude)
      setPrecise({ latitude, longitude, accuracy, ...place })
      setUsePrecise(true)
      setGeoLoading(false)
    }

    const onFinalError = (err: GeolocationPositionError) => {
      const messages: Record<number, string> = {
        1: 'Permission denied. Allow location for this site, or type your city.',
        2: 'No GPS fix (common on desktop). Type your city instead.',
        3: 'GPS timed out. Type your city — usually faster.',
      }
      setGeoError(messages[err.code] ?? 'Could not get a precise fix. Type your city.')
      setShowSearch(true)
      setGeoLoading(false)
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      err => {
        if (err.code === 1) {
          onFinalError(err)
          return
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        })
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }, [])

  useEffect(() => {
    fetchLocation()
  }, [fetchLocation])

  const activeCoords = useMemo(() => {
    if (usePrecise && precise) {
      return { latitude: precise.latitude, longitude: precise.longitude }
    }
    if (!data) return null
    return { latitude: data.latitude, longitude: data.longitude }
  }, [usePrecise, precise, data])

  const mapSrc = useMemo(() => {
    if (!activeCoords) return ''
    const { latitude, longitude } = activeCoords
    const zoom = usePrecise && precise ? 15 : 12
    return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`
  }, [activeCoords, usePrecise, precise])

  const ink = 'text-[color:var(--loc-fg)]'
  const mute = 'text-[color:var(--loc-fg-mute)]'
  const mono = { fontFamily: 'var(--font-loc-mono), ui-monospace, monospace' } as const
  const display = { fontFamily: 'var(--font-loc-display), Georgia, serif' } as const
  const mark = { fontFamily: 'var(--font-loc-mark), system-ui, sans-serif' } as const

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="relative min-h-[70vh] flex flex-col justify-center gap-8">
          <div className="h-3 w-40 bg-[color:var(--loc-fg)]/10 animate-pulse" />
          <div className="h-20 md:h-28 w-full max-w-xl bg-[color:var(--loc-fg)]/10 animate-pulse" />
          <div className="h-14 w-full max-w-lg bg-[color:var(--loc-fg)]/10 animate-pulse" />
          <div className="h-[42vh] w-full bg-[color:var(--loc-fg)]/10 animate-pulse mt-4" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-6 text-center py-24">
        <p className={cn('text-sm mb-6', mute)} style={mono}>
          {error ?? 'No signal'}
        </p>
        <button
          type="button"
          onClick={fetchLocation}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border border-[color:var(--loc-line)] px-5 py-3 hover:bg-[color:var(--loc-signal)] hover:border-[color:var(--loc-signal)] hover:text-[color:var(--loc-on-signal)] transition-colors cursor-pointer"
          style={mono}
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      </div>
    )
  }

  const city =
    usePrecise && precise
      ? precise.city ?? precise.locality ?? data.city
      : data.city
  const country =
    usePrecise && precise ? precise.countryName ?? data.country_name : data.country_name
  const region =
    usePrecise && precise
      ? precise.principalSubdivision ?? data.region_name
      : data.region_name

  const gmtHours = data.time_zone.gmt_offset / 3600
  const gmtLabel = gmtHours >= 0 ? `GMT+${gmtHours}` : `GMT${gmtHours}`
  const ipDigits = data.ip.split('')

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10">
      <section className="relative min-h-[min(78vh,820px)] flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between gap-4 mb-8 md:mb-10"
        >
          <p
            className={cn('text-[10px] uppercase tracking-[0.35em]', mute)}
            style={mono}
          >
            Public wire · {data.type.toUpperCase()}
            {data.connection.asn ? ` · ASN ${data.connection.asn}` : ''}
          </p>
          <button
            type="button"
            onClick={fetchLocation}
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] hover:text-[color:var(--loc-signal)] transition-colors cursor-pointer',
              mute,
            )}
            style={mono}
          >
            <RefreshCw className="size-3" />
            Rescan
          </button>
        </motion.div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 flex-1 items-end lg:items-center">
          {/* Place — brand-scale city */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <p
              className={cn('text-[10px] uppercase tracking-[0.3em] mb-4', mute)}
              style={mono}
            >
              {usePrecise ? 'Device fix' : 'Estimated from IP'}
            </p>
            <h1
              className={cn(
                'text-[clamp(3.2rem,12vw,7.5rem)] leading-[0.88] tracking-tight',
                ink,
              )}
              style={display}
            >
              {city}
              <span className="italic text-[color:var(--loc-signal)]">.</span>
            </h1>
            <p
              className={cn('mt-5 text-lg md:text-xl font-light tracking-wide', ink)}
              style={display}
            >
              {region}
              {region && country ? ' · ' : ''}
              {country}
            </p>
            {data.location.country_flag ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.location.country_flag}
                alt=""
                className="mt-6 h-7 w-auto object-contain opacity-80"
              />
            ) : null}
          </motion.div>

          {/* Signal — IP as instrument readout */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative border border-[color:var(--loc-line)] bg-[color:var(--loc-paper)] backdrop-blur-sm px-6 py-8 md:px-8 md:py-10">
              <CornerMarks />

              {/* Soft radar disc behind IP */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden opacity-40"
                aria-hidden
              >
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[140%] rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0deg, var(--loc-signal-soft) 50deg, transparent 90deg)',
                    animation: 'loc-radar 4.5s linear infinite',
                  }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[55%] rounded-full border border-[color:var(--loc-signal)]/25" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[35%] rounded-full border border-[color:var(--loc-signal)]/20" />
              </div>

              <p
                className={cn('relative text-[10px] uppercase tracking-[0.32em] mb-5', mute)}
                style={mono}
              >
                Your public IP
              </p>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(data.ip)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1600)
                }}
                className="relative group w-full text-left cursor-pointer"
                aria-label={`Copy IP ${data.ip}`}
              >
                <p
                  className={cn(
                    'text-[clamp(1.55rem,4.5vw,2.65rem)] font-semibold tracking-tight leading-none break-all',
                    ink,
                  )}
                  style={mono}
                >
                  {ipDigits.map((ch, i) => (
                    <motion.span
                      key={`${ch}-${i}`}
                      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ delay: 0.18 + i * 0.03, duration: 0.4 }}
                      className="inline-block"
                    >
                      {ch}
                    </motion.span>
                  ))}
                </p>
                <span
                  className={cn(
                    'mt-4 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] transition-colors',
                    copied ? 'text-[color:var(--loc-signal)]' : mute,
                    'group-hover:text-[color:var(--loc-signal)]',
                  )}
                  style={mono}
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? 'Copied' : 'Tap to copy'}
                </span>
              </button>

              <p className={cn('relative mt-6 text-sm leading-relaxed max-w-sm', mute)}>
                Assigned by{' '}
                <span className={ink}>{data.connection.isp || 'your ISP'}</span>. Sites see
                this address — not your private Wi‑Fi.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.65 }}
        className="mt-6 md:mt-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
          <div>
            <p className={cn('text-[10px] uppercase tracking-[0.3em] mb-1', mute)} style={mono}>
              Chart
            </p>
            <p className={cn('text-2xl md:text-3xl tracking-tight', ink)} style={display}>
              {usePrecise ? 'Device pin' : 'IP estimate'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestPrecise}
              disabled={geoLoading}
              className={cn(
                'inline-flex items-center gap-2 h-10 px-4 text-[10px] uppercase tracking-[0.18em] border border-[color:var(--loc-line)] transition-colors cursor-pointer disabled:opacity-50',
                'hover:border-[color:var(--loc-signal)] hover:bg-[color:var(--loc-signal)] hover:text-[color:var(--loc-on-signal)]',
                ink,
              )}
              style={mono}
            >
              {geoLoading ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Crosshair className="size-3.5" />
              )}
              {geoLoading ? 'Fixing…' : 'Precise'}
            </button>
            <button
              type="button"
              onClick={() => setShowSearch(v => !v)}
              className={cn(
                'inline-flex items-center gap-2 h-10 px-4 text-[10px] uppercase tracking-[0.18em] border border-[color:var(--loc-line)] transition-colors cursor-pointer',
                'hover:border-[color:var(--loc-fg)]/40',
                ink,
              )}
              style={mono}
            >
              <Search className="size-3.5" />
              City
            </button>
            {usePrecise ? (
              <button
                type="button"
                onClick={() => setUsePrecise(false)}
                className={cn(
                  'inline-flex items-center gap-2 h-10 px-4 text-[10px] uppercase tracking-[0.18em] underline-offset-4 hover:underline cursor-pointer',
                  mute,
                )}
                style={mono}
              >
                Back to IP map
              </button>
            ) : null}
          </div>
        </div>

        {geoError ? (
          <p
            className="mb-3 text-xs border border-amber-600/30 bg-amber-500/10 text-amber-900 dark:text-amber-100/90 px-4 py-2.5"
            style={mono}
          >
            {geoError}
          </p>
        ) : null}

        <AnimatePresence>
          {showSearch ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                  placeholder="City, Country"
                  className={cn(
                    'flex-1 h-11 bg-transparent border border-[color:var(--loc-line)] px-4 text-sm outline-none focus:border-[color:var(--loc-signal)] transition-colors',
                    ink,
                  )}
                  style={mono}
                  aria-label="Search city"
                />
                <button
                  type="button"
                  onClick={handleManualSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="h-11 px-5 text-[10px] uppercase tracking-[0.18em] bg-[color:var(--loc-fg)] text-[color:var(--loc-bg)] disabled:opacity-40 cursor-pointer"
                  style={mono}
                >
                  {searching ? '…' : 'Pin'}
                </button>
              </div>
              {searchError ? (
                <p className="mt-2 text-xs text-red-700 dark:text-red-300" style={mono}>
                  {searchError}
                </p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {usePrecise && precise ? (
          <p className={cn('mb-3 text-xs', mute)} style={mono}>
            {precise.accuracy > 0
              ? `Accurate to ~${Math.round(precise.accuracy)} m. Your ISP IP above is unchanged.`
              : 'Pinned from your search. Your ISP IP above is unchanged.'}
          </p>
        ) : null}

        <div className="relative border border-[color:var(--loc-line)] bg-[color:var(--loc-fg)]/[0.04] overflow-hidden">
          <CornerMarks />
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b border-[color:var(--loc-line-soft)] text-[10px] uppercase tracking-[0.22em]"
            style={mono}
          >
            <span className={mute}>
              {usePrecise ? 'Device pin' : 'IP estimate'}
            </span>
            <code className={cn('normal-case tracking-normal text-[11px]', ink)}>
              {activeCoords
                ? `${activeCoords.latitude.toFixed(4)}°, ${activeCoords.longitude.toFixed(4)}°`
                : '—'}
            </code>
          </div>

          <div className="relative">
            <iframe
              title={`Map of ${city}, ${country}`}
              src={mapSrc}
              className="w-full h-[280px] md:h-[420px] border-0 grayscale-[0.35] contrast-[1.05]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            {/* Reticle + radar over map */}
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[min(55vw,280px)] rounded-full opacity-50"
                style={{
                    background:
                      'conic-gradient(from 90deg, transparent 0deg, var(--loc-signal-soft) 40deg, transparent 85deg)',
                  animation: 'loc-radar 6s linear infinite',
                }}
              />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="size-3 rounded-full bg-[color:var(--loc-signal)] shadow-[0_0_0_6px_var(--loc-signal-soft)]" />
              </div>
              <div className="absolute left-1/2 inset-y-8 w-px bg-[color:var(--loc-signal)]/30 -translate-x-1/2" />
              <div className="absolute top-1/2 inset-x-8 h-px bg-[color:var(--loc-signal)]/30 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-8 md:mt-10 border-y border-[color:var(--loc-line)]"
      >
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            {
              label: 'Local time',
              value: (
                <LiveClock
                  timeZone={data.time_zone.id}
                  fallbackIso={data.time_zone.current_time}
                />
              ),
            },
            {
              label: 'Timezone',
              value: data.time_zone.id || gmtLabel,
            },
            {
              label: 'Currency',
              value:
                [data.currency.symbol, data.currency.code].filter(Boolean).join(' ') || '—',
            },
            {
              label: 'Capital',
              value: data.location.capital || '—',
            },
          ].map((item, i) => (
            <div
              key={item.label}
              className={cn(
                'px-4 py-5 md:py-6',
                i % 2 === 1 && 'border-l border-[color:var(--loc-line-soft)]',
                i >= 2 && 'border-t md:border-t-0 border-[color:var(--loc-line-soft)]',
                i === 2 && 'md:border-l',
              )}
            >
              <p
                className={cn('text-[10px] uppercase tracking-[0.28em] mb-2', mute)}
                style={mono}
              >
                {item.label}
              </p>
              <p
                className={cn('text-sm md:text-base leading-snug break-words', ink)}
                style={i === 0 ? mono : mark}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      <style>{`
        @keyframes loc-radar {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
