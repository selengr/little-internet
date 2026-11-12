'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { Hash, Quote, Sparkles } from 'lucide-react'
import { GrainGradient } from '@paper-design/shaders-react'
import { ScrollChapter } from '@/components/rooms/scroll-chapter'
import { RoomNav } from '@/components/rooms/room-nav'
import type { ApodPayload } from '@/lib/apod'

const mono = { fontFamily: 'var(--font-td-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-td-display), Georgia, serif' } as const

type QuotePayload = { content: string; author: string }
type NumberPayload = { number: number; text: string }
type Holiday = { date: string; localName: string; name: string; countryCode: string }

type TodayPayload = {
  date: string
  countryCode: string
  apod: ApodPayload | null
  quote: QuotePayload
  number: NumberPayload
  holidays: Holiday[]
}

function TodayIntro({
  progress,
  payload,
  loading,
}: {
  progress: MotionValue<number>
  payload: TodayPayload | null
  loading: boolean
}) {
  const y = useTransform(progress, [0, 0.55, 1], ['0%', '-6%', '-16%'])
  const scale = useTransform(progress, [0, 0.6], [1, 1.08])
  const opacity = useTransform(progress, [0.45, 0.9], [1, 0])
  const heroImg =
    payload?.apod?.mediaType === 'image' ? payload.apod.hdurl || payload.apod.url : null

  const weekday = payload
    ? new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date(payload.date))
    : 'Today'

  return (
    <div className="relative h-full w-full overflow-hidden">
      <motion.div className="absolute inset-0 -z-10" style={{ y, scale }}>
        {heroImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-55" />
        ) : (
          <GrainGradient
            style={{ height: '100%', width: '100%' }}
            colorBack="#0c0a09"
            softness={0.88}
            intensity={0.5}
            noise={0.1}
            colors={['#f59e0b', '#fbbf24', '#78716c', '#1c1917']}
            speed={0.45}
          />
        )}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/70 to-stone-950" />

      <motion.div
        className="relative mx-auto flex h-full max-w-5xl flex-col justify-center px-6 pt-24 md:px-12"
        style={{ opacity }}
      >
        <p className="text-[11px] uppercase tracking-[0.34em] text-amber-200/55" style={mono}>
          Little Internet · daily desk
        </p>
        <h1 className="mt-4 text-[clamp(2.75rem,8vw,6rem)] font-light leading-[0.98] tracking-tight text-stone-50" style={display}>
          {loading ? 'Opening the day…' : weekday}
        </h1>
        <p className="mt-6 max-w-xl text-lg font-light text-stone-200/70" style={display}>
          One scroll through image, word, number, and the next time your country pauses.
        </p>
      </motion.div>
    </div>
  )
}

function QuotePanel({
  progress,
  quote,
}: {
  progress: MotionValue<number>
  quote: QuotePayload
}) {
  const x = useTransform(progress, [0, 0.5], [60, 0])
  const opacity = useTransform(progress, [0, 0.25, 0.85, 1], [0, 1, 1, 0.7])

  return (
    <div className="relative flex h-full items-center bg-stone-950 px-6 md:px-12">
      <motion.div className="max-w-3xl" style={{ x, opacity }}>
        <Quote className="size-8 text-amber-300/70" strokeWidth={1.25} />
        <p className="mt-8 text-3xl font-light leading-snug text-stone-100 md:text-4xl" style={display}>
          “{quote.content}”
        </p>
        <p className="mt-6 text-sm uppercase tracking-[0.28em] text-stone-400" style={mono}>
          {quote.author}
        </p>
      </motion.div>
    </div>
  )
}

function NumberHolidayPanel({
  progress,
  number,
  holidays,
  countryCode,
}: {
  progress: MotionValue<number>
  number: NumberPayload
  holidays: Holiday[]
  countryCode: string
}) {
  const y = useTransform(progress, [0, 0.45], [80, 0])
  const opacity = useTransform(progress, [0, 0.2], [0, 1])

  return (
    <div className="relative flex h-full flex-col justify-center gap-12 bg-gradient-to-b from-stone-950 to-black px-6 pb-24 pt-16 md:px-12">
      <motion.div style={{ y, opacity }}>
        <div className="flex items-start gap-4">
          <Hash className="mt-2 size-6 text-amber-400/80" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500" style={mono}>
              Number of the day
            </p>
            <p className="mt-2 text-6xl font-light text-amber-100 tabular-nums" style={display}>
              {number.number || '·'}
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-300/80">
              {number.text}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div style={{ y, opacity }} className="border-t border-white/10 pt-10">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-stone-400" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-stone-500" style={mono}>
            Next public holidays · {countryCode}
          </p>
        </div>
        {holidays.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No upcoming holidays in the feed — check /countries.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {holidays.map(h => (
              <li
                key={`${h.countryCode}-${h.date}-${h.name}`}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
              >
                <span className="text-lg text-stone-100" style={display}>
                  {h.localName || h.name}
                </span>
                <span className="text-xs text-stone-500" style={mono}>
                  {h.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/weather"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-stone-200 hover:bg-white/5"
        >
          Sky window
        </Link>
        <Link
          href="/space"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-stone-200 hover:bg-white/5"
        >
          Orbit room
        </Link>
        <Link href="/" className="rounded-full bg-amber-500/90 px-5 py-2.5 text-sm text-stone-950 hover:bg-amber-400">
          Back home
        </Link>
      </div>
    </div>
  )
}

export function TodayRoom({ fontVars }: { fontVars: string }) {
  const [payload, setPayload] = useState<TodayPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        let country = 'US'
        try {
          const locRes = await fetch('/api/location', { cache: 'no-store' })
          const loc = (await locRes.json()) as { country_code?: string }
          if (loc.country_code) country = loc.country_code
        } catch {
          /* default US */
        }
        const res = await fetch(`/api/today?country=${encodeURIComponent(country)}`, {
          cache: 'no-store',
        })
        const json = (await res.json()) as TodayPayload
        if (!cancelled) setPayload(json)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className={`${fontVars} relative bg-stone-950 text-stone-50`}>
      <RoomNav badge="TODAY DESK" />

      <ScrollChapter id="intro" runwayVh={190}>
        {({ progress }) => (
          <TodayIntro progress={progress} payload={payload} loading={loading} />
        )}
      </ScrollChapter>

      {payload ? (
        <ScrollChapter id="quote" runwayVh={120}>
          {({ progress }) => <QuotePanel progress={progress} quote={payload.quote} />}
        </ScrollChapter>
      ) : null}

      {payload ? (
        <ScrollChapter id="number" runwayVh={150}>
          {({ progress }) => (
            <NumberHolidayPanel
              progress={progress}
              number={payload.number}
              holidays={payload.holidays}
              countryCode={payload.countryCode}
            />
          )}
        </ScrollChapter>
      ) : null}
    </main>
  )
}
