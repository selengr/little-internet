'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { IpstackData } from '@/types/ipstack'

type Precise = { lat: number; lon: number; accuracy: number }
type GeoState = 'idle' | 'locating' | 'denied'

const line = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0 },
}

const stack = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

function Key({ children }: { children: string }) {
  return <span className="text-sky-300">&quot;{children}&quot;</span>
}

function Str({ children }: { children: string }) {
  return <span className="text-emerald-300">&quot;{children}&quot;</span>
}

function Num({ children }: { children: string | number }) {
  return <span className="text-amber-300">{children}</span>
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={line} className="whitespace-nowrap">
      {children}
    </motion.div>
  )
}

function Radar({ locked }: { locked: boolean }) {
  const max = locked ? 130 : 190

  return (
    <div className="relative grid size-[190px] place-items-center" aria-hidden>
      {[0, 1, 2].map(i => (
        <motion.span
          key={`${locked}-${i}`}
          className={`absolute rounded-full border ${
            locked ? 'border-emerald-400/45' : 'border-sky-400/30'
          }`}
          initial={{ width: 26, height: 26, opacity: 0 }}
          animate={{ width: max, height: max, opacity: [0, 0.7, 0] }}
          transition={{ duration: 3.2, delay: i * 1.05, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
      <span className="absolute size-[86px] rounded-full border border-dashed border-white/10" />
      <span
        className={`relative size-2.5 rounded-full ${
          locked
            ? 'bg-emerald-400 shadow-[0_0_0_7px_rgba(52,211,153,0.16)]'
            : 'bg-sky-400 shadow-[0_0_0_7px_rgba(56,189,248,0.14)]'
        }`}
      />
    </div>
  )
}

export function HomeLocationStrip() {
  const [data, setData] = useState<IpstackData | null>(null)
  const [failed, setFailed] = useState(false)
  const [precise, setPrecise] = useState<Precise | null>(null)
  const [geo, setGeo] = useState<GeoState>('idle')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/location?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json.ip) throw new Error('lookup failed')
      setData(json as IpstackData)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const locate = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGeo('denied')
      return
    }
    setGeo('locating')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setPrecise({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        })
        setGeo('idle')
      },
      () => setGeo('denied'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }, [])

  if (failed) return null

  return (
    <section className="border-t border-border px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e13] lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-3.5">
              <span className="flex gap-1.5">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
              </span>
              <span className="font-mono text-[11px] text-white/35">~/whereabouts</span>
            </div>

            <motion.div
              variants={stack}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="overflow-x-auto px-5 py-6 font-mono text-[12.5px] leading-[1.9] md:px-7 md:text-[13.5px]"
            >
              <Row>
                <span className="text-emerald-400">$</span>{' '}
                <span className="text-white/80">curl -s /api/location</span>
              </Row>

              {!data ? (
                <Row>
                  <span className="text-white/30">resolving…</span>
                </Row>
              ) : (
                <>
                  <Row>
                    <span className="text-white/40">{'{'}</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>ip</Key>
                    <span className="text-white/40">: </span>
                    <Str>{data.ip}</Str>
                    <span className="text-white/40">,</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>city</Key>
                    <span className="text-white/40">: </span>
                    <Str>{data.city || 'unknown'}</Str>
                    <span className="text-white/40">,</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>country</Key>
                    <span className="text-white/40">: </span>
                    <Str>{data.country_name || 'unknown'}</Str>
                    <span className="text-white/40">,</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>isp</Key>
                    <span className="text-white/40">: </span>
                    <Str>{data.connection?.isp || 'unknown'}</Str>
                  </Row>
                  <Row>
                    <span className="text-white/40">{'}'}</span>
                  </Row>
                </>
              )}

              <Row>
                <span className="mt-2 block" />
              </Row>

              <Row>
                <span className="text-emerald-400">$</span>{' '}
                {precise ? (
                  <span className="text-white/80">locate --precise</span>
                ) : (
                  <button
                    type="button"
                    onClick={locate}
                    disabled={geo === 'locating'}
                    className="text-white/80 underline decoration-white/25 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60 disabled:opacity-50"
                  >
                    locate --precise
                  </button>
                )}
                {!precise && geo === 'idle' && (
                  <span className="ml-1 inline-block h-[1em] w-[7px] animate-pulse bg-white/70 align-[-2px]" />
                )}
              </Row>

              {geo === 'locating' && (
                <Row>
                  <span className="text-white/40">acquiring gps fix…</span>
                </Row>
              )}

              {geo === 'denied' && (
                <Row>
                  <span className="text-rose-400/90">permission denied — using ip estimate</span>
                </Row>
              )}

              {precise && (
                <>
                  <Row>
                    <span className="text-white/40">{'{'}</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>lat</Key>
                    <span className="text-white/40">: </span>
                    <Num>{precise.lat.toFixed(5)}</Num>
                    <span className="text-white/40">,</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>lon</Key>
                    <span className="text-white/40">: </span>
                    <Num>{precise.lon.toFixed(5)}</Num>
                    <span className="text-white/40">,</span>
                  </Row>
                  <Row>
                    {'  '}
                    <Key>accuracy_m</Key>
                    <span className="text-white/40">: </span>
                    <Num>{precise.accuracy}</Num>
                  </Row>
                  <Row>
                    <span className="text-white/40">{'}'}</span>
                  </Row>
                </>
              )}

              <Row>
                <Link
                  href="/location"
                  className="mt-2 inline-block text-white/30 transition-colors hover:text-white/70"
                >
                  # full trace → /location
                </Link>
              </Row>
            </motion.div>
          </div>

          <div className="flex flex-col items-center justify-center gap-5 border-t border-white/[0.07] py-12 lg:border-l lg:border-t-0">
            <Radar locked={Boolean(precise)} />
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">
              {precise ? `gps fix · ±${precise.accuracy}m` : 'ip estimate · city level'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
