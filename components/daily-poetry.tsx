'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Copy, Share2, ArrowRight, Check } from 'lucide-react'
import type { PoetryMood, PoetryPoem } from '@/types/poetry'
import { MOODS, poemShareText } from '@/lib/poetry'
import { cn } from '@/lib/utils'

const SAVED_KEY = 'daily-poetry-saved'

const titleFont = { fontFamily: 'var(--font-py-display), Georgia, serif' } as const

export function DailyPoetry() {
  const [poem, setPoem] = useState<PoetryPoem | null>(null)
  const [mood, setMood] = useState<PoetryMood | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadPoem = useCallback(async (opts?: { next?: boolean; mood?: PoetryMood | null }) => {
    setLoading(true)
    setError(null)
    setCopied(false)
    try {
      let url = '/api/poetry?action=today'
      if (opts?.next) {
        url = `/api/poetry?action=next${opts.mood ? `&mood=${opts.mood}` : ''}`
      } else if (opts?.mood) {
        url = `/api/poetry?action=mood&mood=${opts.mood}`
      }
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load poem')
      if (!json.poem) throw new Error('No poem found')
      setPoem(json.poem)
      if (opts?.mood) setMood(opts.mood)

      try {
        const list: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
        setSaved(list.includes(`${json.poem.title}::${json.poem.author}`))
      } catch {
        setSaved(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load poem')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPoem()
  }, [loadPoem])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !loading) {
        void loadPoem({ next: true, mood })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loadPoem, loading, mood])

  const toggleSave = () => {
    if (!poem) return
    const key = `${poem.title}::${poem.author}`
    try {
      const list: string[] = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
      const next = saved ? list.filter(x => x !== key) : [key, ...list].slice(0, 40)
      localStorage.setItem(SAVED_KEY, JSON.stringify(next))
      setSaved(!saved)
    } catch {
      setSaved(v => !v)
    }
  }

  const copyPoem = async () => {
    if (!poem) return
    await navigator.clipboard.writeText(poemShareText(poem))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const sharePoem = async () => {
    if (!poem) return
    const text = poemShareText(poem)
    try {
      if (navigator.share) await navigator.share({ title: poem.title, text })
      else await copyPoem()
    } catch {
      /* cancelled */
    }
  }

  const lineCount =
    typeof poem?.linecount === 'number'
      ? poem.linecount
      : poem?.lines.filter(l => l.trim()).length ?? 0

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <header className="mb-10 md:mb-14 max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-medium uppercase tracking-[0.2em] mb-4"
          style={{ color: 'var(--py-mute)' }}
        >
          Daily verse
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04 }}
          className="text-[clamp(2.75rem,9vw,5rem)] font-normal leading-[0.95] tracking-tight"
          style={titleFont}
        >
          A poem for today.
        </motion.h1>
        <p className="mt-5 text-[15px] leading-relaxed max-w-md" style={{ color: 'var(--py-mute)' }}>
          Classics from PoetryDB — pick a mood, or flip to the next piece.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_200px] lg:items-start">
        <section
          className="relative min-h-[420px] rounded-2xl border overflow-hidden"
          style={{
            borderColor: 'var(--py-line)',
            background: 'var(--py-paper)',
            boxShadow: 'var(--py-shadow)',
          }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3 sm:px-7"
            style={{ borderColor: 'var(--py-line-soft)' }}
          >
            <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--py-mute)' }}>
              Reading
            </p>
            {!loading && poem ? (
              <p className="text-[12px] tabular-nums" style={{ color: 'var(--py-mute)' }}>
                {lineCount} lines
              </p>
            ) : null}
          </div>

          <div className="px-5 py-8 sm:px-8 sm:py-10 md:px-12">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 animate-pulse py-8"
                >
                  <div className="h-10 w-2/3 rounded-lg" style={{ background: 'var(--py-line-soft)' }} />
                  <div className="h-3 w-28 rounded" style={{ background: 'var(--py-line-soft)' }} />
                  <div className="space-y-3 pt-8">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-3.5 rounded"
                        style={{
                          width: `${55 + (i % 4) * 10}%`,
                          background: 'var(--py-line-soft)',
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : error || !poem ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16"
                >
                  <p className="text-lg leading-relaxed" style={{ color: 'var(--py-mute)' }}>
                    {error ?? 'Nothing on the press just now.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadPoem({ next: true })}
                    className="mt-6 inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-medium cursor-pointer"
                    style={{ background: 'var(--py-fg)', color: 'var(--py-on-fg)' }}
                  >
                    Try another
                    <ArrowRight className="size-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.article
                  key={`${poem.title}-${poem.author}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2
                    className="text-3xl sm:text-4xl md:text-[2.75rem] font-normal tracking-tight leading-[1.15]"
                    style={titleFont}
                  >
                    {poem.title}
                  </h2>
                  <p
                    className="mt-3 text-[13px] font-medium tracking-wide"
                    style={{ color: 'var(--py-accent)' }}
                  >
                    {poem.author}
                  </p>

                  <div className="mt-10 sm:mt-12 space-y-0">
                    {poem.lines.map((line, i) => {
                      const n = i + 1
                      const empty = !line.trim()
                      return (
                        <div
                          key={i}
                          className="group grid grid-cols-[2.25rem_1fr] sm:grid-cols-[2.75rem_1fr] gap-2 sm:gap-4"
                        >
                          <span
                            className="select-none pt-[0.4em] text-right text-[11px] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-35"
                            style={{ color: 'var(--py-mute)' }}
                          >
                            {empty ? '' : String(n).padStart(2, '0')}
                          </span>
                          <p
                            className={cn('leading-[1.8] text-[15px] sm:text-[16px]', empty && 'h-4')}
                          >
                            {line || '\u00A0'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </motion.article>
              )}
            </AnimatePresence>
          </div>

          {!loading && poem ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t px-5 py-3.5 sm:px-7"
              style={{
                borderColor: 'var(--py-line-soft)',
                background: 'color-mix(in srgb, var(--py-paper) 92%, transparent)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                type="button"
                onClick={toggleSave}
                className="inline-flex h-10 items-center gap-2 px-3.5 rounded-xl border text-[13px] font-medium cursor-pointer transition-colors"
                style={{
                  borderColor: saved ? 'var(--py-accent)' : 'var(--py-line)',
                  color: saved ? 'var(--py-accent)' : 'var(--py-fg)',
                  background: saved ? 'var(--py-accent-soft)' : 'transparent',
                }}
              >
                <Heart className={cn('size-3.5', saved && 'fill-current')} />
                {saved ? 'Saved' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => void copyPoem()}
                className="inline-flex h-10 items-center gap-2 px-3.5 rounded-xl border text-[13px] font-medium cursor-pointer"
                style={{ borderColor: 'var(--py-line)', color: 'var(--py-fg)' }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => void sharePoem()}
                className="inline-flex h-10 items-center gap-2 px-3.5 rounded-xl border text-[13px] font-medium cursor-pointer"
                style={{ borderColor: 'var(--py-line)', color: 'var(--py-fg)' }}
              >
                <Share2 className="size-3.5" />
                Share
              </button>
              <button
                type="button"
                onClick={() => void loadPoem({ next: true, mood })}
                className="inline-flex h-10 items-center gap-2 px-4 ml-auto rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ background: 'var(--py-fg)', color: 'var(--py-on-fg)' }}
              >
                Next
                <ArrowRight className="size-3.5" />
              </button>
            </motion.div>
          ) : null}
        </section>

        <aside className="space-y-3 lg:sticky lg:top-28">
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: 'var(--py-line)',
              background: 'var(--py-panel)',
              boxShadow: 'var(--py-shadow)',
            }}
          >
            <div className="border-b px-4 py-3" style={{ borderColor: 'var(--py-line-soft)' }}>
              <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--py-mute)' }}>
                Mood
              </p>
            </div>
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void loadPoem({ mood: m.id })}
                  className="relative shrink-0 px-4 py-3 text-left text-[13px] font-medium cursor-pointer transition-colors"
                  style={{
                    color: mood === m.id ? 'var(--py-fg)' : 'var(--py-mute)',
                    background: mood === m.id ? 'var(--py-accent-soft)' : 'transparent',
                  }}
                >
                  {mood === m.id && (
                    <motion.span
                      layoutId="py-mood"
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full lg:top-2.5 lg:bottom-2.5"
                      style={{ background: 'var(--py-accent)' }}
                    />
                  )}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <p className="px-1 text-[12px] leading-relaxed" style={{ color: 'var(--py-mute)' }}>
            PoetryDB · featured poets · safe classics
          </p>
        </aside>
      </div>
    </div>
  )
}
