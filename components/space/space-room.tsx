'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Rocket, Satellite } from 'lucide-react'
import { RoomNav } from '@/components/rooms/room-nav'
import { describePlace } from '@/lib/iss-place'
import { isNearLand } from '@/lib/iss-land-mask'
import type { ApodPayload } from '@/lib/apod'
import type { LaunchCard } from '@/lib/launches'
import { useTheme } from '@/components/theme-provider'

const mono = { fontFamily: 'var(--font-sp-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-sp-display), Georgia, serif' } as const

type IssPosition = {
  lat: number
  lon: number
  altitude?: number
  velocity?: number
}

function formatLaunch(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function SpaceRoom({ fontVars }: { fontVars: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [apod, setApod] = useState<ApodPayload | null>(null)
  const [position, setPosition] = useState<IssPosition | null>(null)
  const [crew, setCrew] = useState<number | null>(null)
  const [launches, setLaunches] = useState<LaunchCard[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | null = null

    async function load() {
      setError(null)
      try {
        const [apodRes, crewRes, launchRes] = await Promise.all([
          fetch('/api/space/apod'),
          fetch('/api/space/crew'),
          fetch('/api/space/launches?limit=5'),
        ])
        const apodJson = (await apodRes.json()) as { apod?: ApodPayload }
        const crewJson = (await crewRes.json()) as { crew?: { count: number }; error?: string }
        const launchJson = (await launchRes.json()) as { launches?: LaunchCard[] }
        if (!cancelled) {
          setApod(apodJson.apod ?? null)
          setCrew(crewJson.crew?.count ?? null)
          setLaunches(launchJson.launches ?? [])
          if (crewJson.error) setError('Crew list is slow — ISS position may still update.')
        }
      } catch {
        if (!cancelled) setError('Could not reach space feeds.')
      }

      async function poll() {
        try {
          const res = await fetch('/api/space')
          const json = (await res.json()) as { position?: IssPosition }
          if (!cancelled && json.position) setPosition(json.position)
        } catch {
          /* ignore */
        }
      }
      void poll()
      timer = setInterval(poll, 5000)
    }

    void load()
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
    }
  }, [])

  const over =
    position != null ? describePlace(position.lat, position.lon, isNearLand(position.lat, position.lon)) : null
  const heroImg = apod?.mediaType === 'image' ? apod.hdurl || apod.url : null

  return (
    <main
      data-sp-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen text-[var(--sp-fg)]`}
      style={{ background: 'var(--sp-bg)' }}
    >
      <style>{`
        [data-sp-theme="light"] {
          --sp-bg: #eef0f8;
          --sp-fg: #0c1020;
          --sp-mute: rgba(12, 16, 32, 0.55);
          --sp-panel: rgba(255, 255, 255, 0.88);
          --sp-line: rgba(12, 16, 32, 0.1);
          --sp-accent: #4f46e5;
          --sp-wash: radial-gradient(ellipse 70% 50% at 0% 0%, rgba(79,70,229,.12), transparent 55%),
            linear-gradient(180deg, #eef0f8, #e2e6f2);
        }
        [data-sp-theme="dark"] {
          --sp-bg: #050816;
          --sp-fg: #e8ecff;
          --sp-mute: rgba(232, 236, 255, 0.55);
          --sp-panel: rgba(14, 20, 40, 0.88);
          --sp-line: rgba(232, 236, 255, 0.12);
          --sp-accent: #818cf8;
          --sp-wash: radial-gradient(ellipse 65% 45% at 100% 0%, rgba(99,102,241,.18), transparent 50%),
            linear-gradient(180deg, #050816, #0a0f1e);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--sp-wash)' }} />
      <RoomNav badge="SPACE" nextHref="/today" nextLabel="Today" />

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-24 md:px-8 md:pt-28">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--sp-mute)]" style={mono}>
            NASA APOD · ISS · launches
          </p>
          <h1 className="mt-2 text-4xl font-light md:text-5xl" style={display}>
            Orbit room
          </h1>
        </header>

        {error ? (
          <p className="mb-6 text-sm text-amber-700 dark:text-amber-200">{error}</p>
        ) : null}

        <article className="overflow-hidden rounded-2xl border border-[var(--sp-line)] bg-[var(--sp-panel)]">
          {heroImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImg} alt="" className="aspect-[16/10] w-full object-cover" />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center bg-indigo-950/30 text-[var(--sp-mute)]">
              Loading sky…
            </div>
          )}
          <div className="p-6 md:p-8">
            <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--sp-mute)]" style={mono}>
              Picture of the day
              {apod?.fallback ? ' · fallback image' : ''}
            </p>
            <h2 className="mt-2 text-2xl font-light" style={display}>
              {apod?.title ?? 'NASA APOD'}
            </h2>
            {apod?.explanation ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--sp-mute)]">
                {apod.explanation.length > 320 ? `${apod.explanation.slice(0, 320)}…` : apod.explanation}
              </p>
            ) : null}
            {apod?.url && apod.mediaType === 'image' && !apod.fallback ? (
              <a
                href={apod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--sp-accent)]"
              >
                Full resolution
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
        </article>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--sp-line)] bg-[var(--sp-panel)] p-6">
            <Satellite className="size-6 text-[var(--sp-accent)]" strokeWidth={1.25} />
            <p className="mt-4 text-4xl font-light tabular-nums" style={display}>
              {crew ?? '—'}
            </p>
            <p className="mt-1 text-sm text-[var(--sp-mute)]">People in orbit (ISS + stations)</p>
            {position ? (
              <dl className="mt-4 space-y-1 text-xs" style={mono}>
                <div>Over {over ?? 'open ocean'}</div>
                <div>
                  {position.lat >= 0 ? 'N' : 'S'} {Math.abs(position.lat).toFixed(2)}° ·{' '}
                  {position.lon >= 0 ? 'E' : 'W'} {Math.abs(position.lon).toFixed(2)}°
                </div>
                {position.altitude ? <div>{Math.round(position.altitude)} km altitude</div> : null}
              </dl>
            ) : (
              <p className="mt-4 text-xs text-[var(--sp-mute)]">Fetching ISS position…</p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--sp-line)] bg-[var(--sp-panel)] p-6">
            <p className="text-sm text-[var(--sp-mute)]">
              The live map with ground track lives on the homepage — same data, bigger canvas.
            </p>
            <Link href="/#tracking" className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--sp-accent)]">
              Open homepage tracker
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-light" style={display}>
            <Rocket className="size-5" />
            Upcoming launches
          </h2>
          {launches.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--sp-mute)]">Launch schedule unavailable right now.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {launches.map(l => (
                <li
                  key={l.id}
                  className="rounded-xl border border-[var(--sp-line)] bg-[var(--sp-panel)] px-4 py-4"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--sp-mute)]" style={mono}>
                    {formatLaunch(l.net)}
                  </p>
                  <p className="mt-1 font-light" style={display}>
                    {l.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--sp-mute)]">
                    {l.provider} · {l.location}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-12 flex gap-3 border-t border-[var(--sp-line)] pt-8">
          <Link href="/weather" className="rounded-xl border border-[var(--sp-line)] px-4 py-2 text-sm">
            Weather
          </Link>
          <Link
            href="/today"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--sp-line)] px-4 py-2 text-sm"
          >
            Today desk
            <ArrowRight className="size-4" />
          </Link>
        </footer>
      </div>
    </main>
  )
}
