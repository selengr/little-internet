'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { IpstackData } from '@/types/ipstack'

const DIGITS = '0123456789'

/** Decodes the address left-to-right so it lands like a signal locking on. */
function ScrambledIp({ value }: { value: string }) {
  const [display, setDisplay] = useState(() => value.replace(/[0-9a-f]/gi, '0'))

  useEffect(() => {
    let tick = 0
    const id = setInterval(() => {
      tick += 1
      const settled = Math.floor(tick / 2)
      setDisplay(
        value
          .split('')
          .map((ch, i) =>
            i < settled || ch === '.' || ch === ':'
              ? ch
              : DIGITS[Math.floor(Math.random() * DIGITS.length)],
          )
          .join(''),
      )
      if (settled >= value.length) clearInterval(id)
    }, 45)

    return () => clearInterval(id)
  }, [value])

  return <span className="tabular-nums">{display}</span>
}

function Radar() {
  return (
    <div className="relative grid size-40 place-items-center md:size-52" aria-hidden>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-foreground/15"
          initial={{ width: 40, height: 40, opacity: 0 }}
          animate={{ width: 208, height: 208, opacity: [0, 0.55, 0] }}
          transition={{
            duration: 3.6,
            delay: i * 1.2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
      <span className="absolute size-24 rounded-full border border-dashed border-foreground/10 md:size-32" />
      <span className="relative size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.14)]" />
    </div>
  )
}

export function HomeLocationStrip() {
  const [data, setData] = useState<IpstackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/location?t=${Date.now()}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'lookup failed')
      setData(json as IpstackData)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (failed) return null

  const place = data
    ? [data.city, data.country_name].filter(Boolean).join(', ')
    : ''

  return (
    <section className="border-t border-border px-6 py-24 md:px-12 lg:px-20">
      <div className="mx-auto flex max-w-6xl flex-col-reverse items-start gap-12 md:flex-row md:items-center md:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          <span className="font-pixel text-[10px] tracking-[0.3em] text-muted-foreground/70">
            YOU ARE HERE
          </span>

          <h2 className="mt-5 text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
            {loading || !data ? (
              <span className="text-muted-foreground/40">Locating…</span>
            ) : (
              <>
                Hello,{' '}
                <span className="text-muted-foreground">{place}</span>
                {data.location.country_flag_emoji && (
                  <span className="ml-2">{data.location.country_flag_emoji}</span>
                )}
              </>
            )}
          </h2>

          <p className="mt-6 font-mono text-sm text-muted-foreground/80">
            {loading || !data ? (
              <span className="text-muted-foreground/40">····</span>
            ) : (
              <ScrambledIp value={data.ip} />
            )}
          </p>

          <Link
            href="/location"
            className="mt-8 inline-flex items-center gap-2 text-xs tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            SEE THE FULL TRACE
            <ArrowUpRight className="size-3.5" />
          </Link>
        </motion.div>

        <Radar />
      </div>
    </section>
  )
}
