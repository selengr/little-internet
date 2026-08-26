'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, Crosshair, MapPin, Radio, Wifi } from 'lucide-react'
import type { IpstackData } from '@/types/ipstack'
import { cn } from '@/lib/utils'

function StatCell({
  label,
  value,
  mono = false,
  className,
}: {
  label: string
  value: string
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn('min-w-0 border-l border-emerald-500/20 pl-4 first:border-l-0 first:pl-0', className)}>
      <p className="text-[9px] uppercase tracking-[0.28em] text-emerald-600/70 dark:text-emerald-400/60 mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          'text-sm text-foreground truncate',
          mono && 'font-mono text-[13px] tracking-tight',
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function HomeLocationStrip() {
  const [data, setData] = useState<IpstackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/location?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Lookup failed')
      setData(json as IpstackData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No signal')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLocation()
  }, [fetchLocation])

  const coords =
    data && data.latitude && data.longitude
      ? `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`
      : '—'

  return (
    <section className="border-t border-border px-6 py-14 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-emerald-600/80 dark:text-emerald-400/70">
              // your_address.on_the_wire
            </p>
            <h2 className="mt-2 text-2xl font-light tracking-tight md:text-3xl">
              Where you are <span className="text-muted-foreground">(right now)</span>
            </h2>
          </div>
          <Link
            href="/location"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-700 transition-colors hover:border-emerald-500/45 hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            Full trace
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/15 bg-[#0a1210] text-emerald-50 shadow-[0_24px_80px_-20px_rgba(16,185,129,0.18)] dark:border-emerald-400/20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative border-b border-emerald-500/15 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400/80">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>locd</span>
              <span className="text-emerald-600/50">·</span>
              <span className="text-emerald-500/60">v1.0</span>
              <span className="text-emerald-600/50">·</span>
              <span className="hidden sm:inline text-emerald-500/50">public ip geolocation</span>
            </div>
          </div>

          <div className="relative p-5 md:p-8">
            {loading ? (
              <div className="space-y-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-emerald-400/70">
                  <Radio className="size-4 animate-pulse" />
                  <span>Resolving endpoint…</span>
                  <span className="inline-block h-4 w-[2px] animate-pulse bg-emerald-400" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-emerald-500/10" />
                  ))}
                </div>
              </div>
            ) : error || !data ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-sm text-red-300/90">err: {error ?? 'no signal'}</p>
                <button
                  type="button"
                  onClick={() => void fetchLocation()}
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400 hover:text-emerald-300"
                >
                  retry()
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="size-4 text-emerald-400/80" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-500/70">
                      ip
                    </span>
                  </div>
                  <p className="font-mono text-2xl tracking-tight text-white sm:text-3xl md:text-4xl">
                    {data.ip}
                    <span className="ml-1 inline-block h-[0.9em] w-[2px] animate-pulse bg-emerald-400 align-middle" />
                  </p>
                  <span className="rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300/90">
                    {data.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 border-t border-emerald-500/10 pt-6 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCell
                    label="City"
                    value={[data.city, data.region_name].filter(Boolean).join(', ') || '—'}
                  />
                  <StatCell label="Country" value={`${data.location.country_flag_emoji} ${data.country_name}`} />
                  <StatCell label="Coordinates" value={coords} mono />
                  <StatCell label="ISP" value={data.connection.isp || '—'} className="col-span-2 lg:col-span-1" />
                  <StatCell label="Timezone" value={data.time_zone.id || '—'} mono />
                  <StatCell
                    label="Local time"
                    value={new Intl.DateTimeFormat(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short',
                    }).format(new Date(data.time_zone.current_time))}
                    mono
                  />
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-emerald-500/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-start gap-2 font-mono text-[11px] leading-relaxed text-emerald-400/55">
                    <Crosshair className="mt-0.5 size-3.5 shrink-0" />
                    IP geolocation is city-level. For GPS-precise fix, open the full trace page.
                  </p>
                  <Link
                    href="/location"
                    className="inline-flex items-center gap-2 font-mono text-[11px] text-emerald-300 transition-colors hover:text-white"
                  >
                    <MapPin className="size-3.5" />
                    precise_location → /location
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
