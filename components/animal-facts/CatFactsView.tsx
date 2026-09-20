'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import type { CatFact } from '@/types/animal-facts'
import { cn } from '@/lib/utils'

const display = { fontFamily: 'var(--font-af-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-af-mono), ui-monospace, monospace' } as const

const CAT_IMAGE =
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=85'

export function CatFactsView() {
  const [fact, setFact] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchFact = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('https://catfact.ninja/fact', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as CatFact
      setFact(data.fact)
    } catch {
      setError(true)
      setFact('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchFact()
  }, [fetchFact])

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <header className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="max-w-xl">
          <p
            className="text-[10px] uppercase tracking-[0.24em] mb-4"
            style={{ ...mono, color: 'var(--af-cat)' }}
          >
            Cat facts
          </p>
          <h1
            className="text-[clamp(2.75rem,9vw,5rem)] font-light leading-[0.95] tracking-tight"
            style={display}
          >
            Soft paws,&nbsp;sharp facts.
          </h1>
          <p className="mt-5 text-sm leading-relaxed max-w-sm" style={{ color: 'var(--af-mute)' }}>
            One curious cat fact at a time — pull another whenever you like.
          </p>
        </div>
        <Link
          href="/animal-facts"
          className="text-[12px] tracking-wide transition-opacity hover:opacity-80 shrink-0"
          style={{ color: 'var(--af-mute)' }}
        >
          Also browse dogs →
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-4 md:gap-5 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative min-h-[280px] overflow-hidden rounded-2xl border"
          style={{ borderColor: 'var(--af-line)', boxShadow: 'var(--af-shadow)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CAT_IMAGE}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0e]/70 via-[#0a0c0e]/15 to-transparent" />
          <p
            className="absolute bottom-5 left-5 right-5 text-[10px] uppercase tracking-[0.22em] text-white/60"
            style={mono}
          >
            Curious cats · live facts
          </p>
        </motion.div>

        <motion.article
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06 }}
          className="relative flex min-h-[280px] flex-col overflow-hidden rounded-2xl border p-6 sm:p-8"
          style={{
            background: 'var(--af-panel)',
            borderColor: 'var(--af-line)',
            boxShadow: 'var(--af-shadow)',
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full blur-3xl"
            style={{ background: 'var(--af-cat-soft)' }}
            aria-hidden
          />

          <div className="relative flex flex-1 flex-col">
            <p
              className="text-[10px] uppercase tracking-[0.24em]"
              style={{ ...mono, color: 'var(--af-mute)' }}
            >
              Today&apos;s tidbit
            </p>

            <div className="mt-6 flex-1">
              {loading ? (
                <div className="space-y-3">
                  <div
                    className="h-4 w-full animate-pulse rounded"
                    style={{ background: 'var(--af-cat-soft)' }}
                  />
                  <div
                    className="h-4 w-[90%] animate-pulse rounded"
                    style={{ background: 'var(--af-cat-soft)' }}
                  />
                  <div
                    className="h-4 w-[65%] animate-pulse rounded"
                    style={{ background: 'var(--af-cat-soft)' }}
                  />
                </div>
              ) : error ? (
                <p
                  className="text-xl italic leading-relaxed"
                  style={{ ...display, color: 'var(--af-mute)' }}
                >
                  The cats went quiet. Try again.
                </p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={fact}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[1.45rem] sm:text-[1.75rem] leading-[1.4] tracking-tight"
                    style={display}
                  >
                    {fact}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>

            <button
              type="button"
              onClick={() => void fetchFact()}
              disabled={loading}
              className={cn(
                'mt-8 inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 text-sm tracking-wide cursor-pointer disabled:opacity-40',
              )}
              style={{
                ...mono,
                background: 'var(--af-cat)',
                color: 'var(--af-on-fg)',
              }}
            >
              <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              Another fact
            </button>
          </div>
        </motion.article>
      </div>
    </div>
  )
}
