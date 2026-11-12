'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Hash, Quote } from 'lucide-react'
import { RoomNav } from '@/components/rooms/room-nav'
import type { ApodPayload } from '@/lib/apod'
import { useTheme } from '@/components/theme-provider'

const mono = { fontFamily: 'var(--font-td-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-td-display), Georgia, serif' } as const

type QuotePayload = { content: string; author: string }
type NumberPayload = { number: number; text: string }
type Holiday = { date: string; localName: string; name: string; countryCode: string }

type TodayPayload = {
  date: string
  countryCode: string
  apod: ApodPayload
  quote: QuotePayload
  number: NumberPayload
  holidays: Holiday[]
}

export function TodayRoom({ fontVars }: { fontVars: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<TodayPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        let country = 'US'
        try {
          const locRes = await fetch('/api/location')
          const loc = (await locRes.json()) as { country_code?: string }
          if (loc.country_code) country = loc.country_code
        } catch {
          /* default */
        }
        const res = await fetch(`/api/today?country=${encodeURIComponent(country)}`)
        const json = (await res.json()) as TodayPayload
        if (!res.ok) throw new Error('Today desk unavailable')
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const weekday = data
    ? new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(
        new Date(data.date),
      )
    : 'Today'

  const thumb =
    data?.apod?.mediaType === 'image' ? data.apod.hdurl || data.apod.url : null

  return (
    <main
      data-td-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen text-[var(--td-fg)]`}
      style={{ background: 'var(--td-bg)' }}
    >
      <style>{`
        [data-td-theme="light"] {
          --td-bg: #f4f0ea;
          --td-fg: #1a1612;
          --td-mute: rgba(26, 22, 18, 0.55);
          --td-panel: rgba(255, 255, 255, 0.9);
          --td-line: rgba(26, 22, 18, 0.1);
          --td-accent: #b45309;
          --td-wash: radial-gradient(ellipse 70% 50% at 100% 0%, rgba(180,83,9,.1), transparent 55%),
            linear-gradient(180deg, #f4f0ea, #ebe4da);
        }
        [data-td-theme="dark"] {
          --td-bg: #12100e;
          --td-fg: #f5f0e8;
          --td-mute: rgba(245, 240, 232, 0.55);
          --td-panel: rgba(28, 24, 20, 0.92);
          --td-line: rgba(245, 240, 232, 0.1);
          --td-accent: #fbbf24;
          --td-wash: radial-gradient(ellipse 60% 45% at 0% 0%, rgba(251,191,36,.08), transparent 50%),
            linear-gradient(180deg, #12100e, #1a1612);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--td-wash)' }} />
      <RoomNav badge="TODAY" />

      <div className="mx-auto max-w-4xl px-5 pb-20 pt-24 md:px-8 md:pt-28">
        <header className="mb-10">
          <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--td-mute)]" style={mono}>
            Daily desk
          </p>
          <h1 className="mt-2 text-4xl font-light md:text-5xl" style={display}>
            {loading ? 'Loading…' : weekday}
          </h1>
        </header>

        {error ? (
          <p className="mb-6 text-sm text-rose-700 dark:text-rose-200">{error}</p>
        ) : null}

        {data ? (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-[var(--td-line)] bg-[var(--td-panel)] p-6 md:col-span-2">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" className="mb-4 max-h-48 w-full rounded-xl object-cover" />
              ) : null}
              <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--td-mute)]" style={mono}>
                Space · {data.apod.title}
                {data.apod.fallback ? ' (stand-in)' : ''}
              </p>
              <p className="mt-2 text-sm text-[var(--td-mute)]">
                {data.apod.explanation.slice(0, 200)}
                {data.apod.explanation.length > 200 ? '…' : ''}
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--td-line)] bg-[var(--td-panel)] p-6">
              <Quote className="size-5 text-[var(--td-accent)]" />
              <p className="mt-4 text-lg font-light leading-snug" style={display}>
                “{data.quote.content}”
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-[var(--td-mute)]" style={mono}>
                {data.quote.author}
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--td-line)] bg-[var(--td-panel)] p-6">
              <Hash className="size-5 text-[var(--td-accent)]" />
              <p className="mt-4 text-5xl font-light tabular-nums" style={display}>
                {data.number.number}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--td-mute)]">{data.number.text}</p>
            </section>

            <section className="rounded-2xl border border-[var(--td-line)] bg-[var(--td-panel)] p-6 md:col-span-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-[var(--td-accent)]" />
                <h2 className="text-lg font-light" style={display}>
                  Next holidays · {data.countryCode}
                </h2>
              </div>
              {data.holidays.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--td-mute)]">
                  No holiday data — try again later or browse{' '}
                  <Link href="/countries" className="underline">
                    countries
                  </Link>
                  .
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.holidays.map(h => (
                    <li
                      key={`${h.date}-${h.name}`}
                      className="flex justify-between gap-4 rounded-lg border border-[var(--td-line)] px-4 py-3 text-sm"
                    >
                      <span>{h.localName || h.name}</span>
                      <span className="text-[var(--td-mute)]" style={mono}>
                        {h.date}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        <footer className="mt-12 flex flex-wrap gap-3 border-t border-[var(--td-line)] pt-8">
          <Link href="/weather" className="rounded-xl border border-[var(--td-line)] px-4 py-2 text-sm">
            Weather
          </Link>
          <Link href="/space" className="rounded-xl border border-[var(--td-line)] px-4 py-2 text-sm">
            Space
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-[var(--td-line)] px-4 py-2 text-sm">
            Home
            <ArrowRight className="size-4" />
          </Link>
        </footer>
      </div>
    </main>
  )
}
