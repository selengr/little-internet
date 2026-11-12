'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { GrainGradient } from '@paper-design/shaders-react'
import { ArrowDown, Rocket, Satellite } from 'lucide-react'
import { ScrollChapter } from '@/components/rooms/scroll-chapter'
import { RoomNav } from '@/components/rooms/room-nav'
import { describePlace } from '@/lib/iss-place'
import { isNearLand } from '@/lib/iss-land-mask'
import type { ApodPayload } from '@/lib/apod'
import type { LaunchCard } from '@/lib/launches'

const mono = { fontFamily: 'var(--font-sp-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-sp-display), Georgia, serif' } as const

type IssPosition = {
  lat: number
  lon: number
  timestamp: number
  altitude?: number
  velocity?: number
}

type CrewPayload = { count: number }

function formatLaunchNet(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function SpaceHero({
  progress,
  apod,
  position,
  crewCount,
  loading,
}: {
  progress: MotionValue<number>
  apod: ApodPayload | null
  position: IssPosition | null
  crewCount: number | null
  loading: boolean
}) {
  const bgY = useTransform(progress, [0, 1], ['0%', '18%'])
  const imgScale = useTransform(progress, [0, 0.55, 1], [1.05, 1.2, 1.32])
  const titleY = useTransform(progress, [0, 0.5], [0, -90])
  const fade = useTransform(progress, [0.5, 0.92], [1, 0])
  const over = position
    ? describePlace(position.lat, position.lon, isNearLand(position.lat, position.lon))
    : null

  const heroImage =
    apod?.mediaType === 'image' ? apod.hdurl || apod.url : null

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#020617]">
      <motion.div className="absolute inset-0 -z-10" style={{ y: bgY, scale: imgScale }}>
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover opacity-70"
            style={{ filter: 'saturate(1.1) contrast(1.05)' }}
          />
        ) : (
          <GrainGradient
            style={{ height: '100%', width: '100%' }}
            colorBack="#030712"
            softness={0.9}
            intensity={0.55}
            noise={0.08}
            shape="corners"
            colors={['#312e81', '#1e1b4b', '#6366f1', '#0f172a', '#38bdf8']}
            speed={0.5}
          />
        )}
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020617]/30 via-[#020617]/55 to-[#020617]" />

      <motion.div
        className="relative mx-auto flex h-full max-w-6xl flex-col justify-between px-6 pb-16 pt-28 md:px-12"
        style={{ y: titleY, opacity: fade }}
      >
        <p className="text-[11px] uppercase tracking-[0.36em] text-indigo-200/50" style={mono}>
          NASA APOD · live orbit
        </p>

        <div className="max-w-3xl">
          <h1 className="text-[clamp(2.5rem,7vw,5.5rem)] font-light leading-[1.02] tracking-tight text-white" style={display}>
            {loading
              ? 'Above the clouds'
              : apod?.title ?? 'Something vast is passing overhead.'}
          </h1>
          <p className="mt-6 text-lg font-light leading-relaxed text-indigo-100/65 md:text-xl" style={display}>
            {crewCount != null ? (
              <>
                <span className="text-white">{crewCount}</span> people off-planet right now.
                {over ? ` The station is over ${over}.` : null}
              </>
            ) : (
              'Pulling orbit telemetry…'
            )}
          </p>
          {position ? (
            <p className="mt-4 text-xs text-indigo-200/45" style={mono}>
              ISS · {position.lat >= 0 ? 'N' : 'S'} {Math.abs(position.lat).toFixed(2)}° ·{' '}
              {position.lon >= 0 ? 'E' : 'W'} {Math.abs(position.lon).toFixed(2)}° ·{' '}
              {position.altitude ? `${Math.round(position.altitude)} km` : '~420 km'}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/35">Scroll for launches on the calendar.</p>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.2 }}>
            <ArrowDown className="size-5 text-white/35" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function IssPin({
  progress,
  position,
  crewCount,
}: {
  progress: MotionValue<number>
  position: IssPosition | null
  crewCount: number | null
}) {
  const ring = useTransform(progress, [0, 0.6], [0.7, 1.15])
  const opacity = useTransform(progress, [0, 0.2, 0.85, 1], [0, 1, 1, 0.5])

  return (
    <div className="relative flex h-full flex-col justify-center bg-[#030712] px-6 md:px-12">
      <motion.div style={{ opacity }}>
        <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200/45" style={mono}>
          Open Notify · wheretheiss.at
        </p>
        <h2 className="mt-2 text-4xl font-light text-white md:text-5xl" style={display}>
          The station never sits still.
        </h2>
      </motion.div>

      <motion.div
        className="relative mx-auto mt-14 flex aspect-square w-full max-w-lg items-center justify-center"
        style={{ scale: ring, opacity }}
      >
        <div className="absolute inset-0 rounded-full border border-sky-400/20 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,.14),transparent_62%)]" />
        <div className="absolute inset-[8%] rounded-full border border-indigo-400/15" />
        <div className="absolute inset-[22%] rounded-full border border-white/10 border-dashed" />
        <motion.span
          className="absolute size-3 rounded-full bg-sky-300 shadow-[0_0_24px_rgba(125,211,252,.9)]"
          style={{
            left: position ? `${50 + position.lon / 3.6}%` : '58%',
            top: position ? `${50 - position.lat / 1.8}%` : '42%',
          }}
        />
        <div className="relative z-10 text-center">
          <Satellite className="mx-auto size-8 text-sky-300/80" strokeWidth={1.25} />
          <p className="mt-4 text-5xl font-light text-white tabular-nums" style={display}>
            {crewCount ?? '—'}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-white/40" style={mono}>
            humans in orbit
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function LaunchRail({
  progress,
  launches,
}: {
  progress: MotionValue<number>
  launches: LaunchCard[]
}) {
  const x = useTransform(progress, [0, 1], ['6%', '-35%'])
  const opacity = useTransform(progress, [0, 0.12, 0.9, 1], [0, 1, 1, 0.65])

  return (
    <div className="relative flex h-full flex-col justify-center gap-10 bg-gradient-to-b from-[#030712] to-black px-6 pb-24 pt-20 md:px-12">
      <motion.div style={{ opacity }}>
        <p className="text-[11px] uppercase tracking-[0.32em] text-violet-200/45" style={mono}>
          Launch Library 2
        </p>
        <h2 className="mt-2 text-4xl font-light text-white md:text-5xl" style={display}>
          Next departures from Earth.
        </h2>
      </motion.div>

      <motion.div className="flex gap-4" style={{ x, opacity }}>
        {launches.map((l, i) => (
          <LaunchTile key={l.id} launch={l} index={i} progress={progress} />
        ))}
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
        <p className="max-w-md text-sm text-white/40">
          Wonder at market scale — numbers in the sky, humans on a metal thread.
        </p>
        <Link
          href="/today"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/90 backdrop-blur transition hover:bg-white/10"
        >
          Open today&apos;s desk
          <Rocket className="size-4" />
        </Link>
      </div>
    </div>
  )
}

function LaunchTile({
  launch,
  index,
  progress,
}: {
  launch: LaunchCard
  index: number
  progress: MotionValue<number>
}) {
  const y = useTransform(progress, [0, 1], [50 + index * 6, -12 - index * 4])
  return (
    <motion.article
      className="min-w-[280px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
      style={{ y }}
    >
      {launch.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={launch.image} alt="" className="h-36 w-full object-cover opacity-85" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-indigo-950/50">
          <Rocket className="size-10 text-indigo-300/60" />
        </div>
      )}
      <div className="space-y-2 p-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40" style={mono}>
          {formatLaunchNet(launch.net)}
        </p>
        <h3 className="text-lg font-light leading-snug text-white" style={display}>
          {launch.name}
        </h3>
        <p className="text-xs text-white/45">
          {launch.provider} · {launch.location}
        </p>
      </div>
    </motion.article>
  )
}

export function SpaceRoom({ fontVars }: { fontVars: string }) {
  const [apod, setApod] = useState<ApodPayload | null>(null)
  const [position, setPosition] = useState<IssPosition | null>(null)
  const [crewCount, setCrewCount] = useState<number | null>(null)
  const [launches, setLaunches] = useState<LaunchCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let issTimer: ReturnType<typeof setInterval> | null = null

    async function boot() {
      setLoading(true)
      try {
        const [apodRes, crewRes, launchRes] = await Promise.all([
          fetch('/api/space/apod', { cache: 'no-store' }),
          fetch('/api/space/crew', { cache: 'no-store' }),
          fetch('/api/space/launches?limit=6', { cache: 'no-store' }),
        ])
        const apodJson = (await apodRes.json()) as { apod?: ApodPayload }
        const crewJson = (await crewRes.json()) as { crew?: CrewPayload }
        const launchJson = (await launchRes.json()) as { launches?: LaunchCard[] }
        if (!cancelled) {
          setApod(apodJson.apod ?? null)
          setCrewCount(crewJson.crew?.count ?? null)
          setLaunches(launchJson.launches ?? [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }

      async function pollIss() {
        try {
          const res = await fetch('/api/space', { cache: 'no-store' })
          const json = (await res.json()) as { position?: IssPosition }
          if (!cancelled && json.position) setPosition(json.position)
        } catch {
          /* ignore */
        }
      }

      void pollIss()
      issTimer = setInterval(pollIss, 5000)
    }

    void boot()
    return () => {
      cancelled = true
      if (issTimer) clearInterval(issTimer)
    }
  }, [])

  const apodCaption = useMemo(() => apod?.explanation?.slice(0, 180), [apod])

  return (
    <main className={`${fontVars} relative bg-black text-white`}>
      <RoomNav badge="ORBIT ROOM" nextHref="/today" nextLabel="Today" />

      <ScrollChapter id="apod" runwayVh={210}>
        {({ progress }) => (
          <SpaceHero
            progress={progress}
            apod={apod}
            position={position}
            crewCount={crewCount}
            loading={loading}
          />
        )}
      </ScrollChapter>

      <ScrollChapter id="iss" runwayVh={130}>
        {({ progress }) => (
          <IssPin progress={progress} position={position} crewCount={crewCount} />
        )}
      </ScrollChapter>

      {apodCaption ? (
        <section className="relative border-y border-white/10 bg-[#050816] px-6 py-20 md:px-12">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/40" style={mono}>
            Picture of the day
          </p>
          <p className="mt-4 max-w-3xl text-lg font-light leading-relaxed text-white/70" style={display}>
            {apodCaption}
            {apod && apod.explanation.length > 180 ? '…' : ''}
          </p>
        </section>
      ) : null}

      {launches.length > 0 ? (
        <ScrollChapter id="launches" runwayVh={150}>
          {({ progress }) => <LaunchRail progress={progress} launches={launches} />}
        </ScrollChapter>
      ) : null}
    </main>
  )
}
