'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Copy, Share2, ArrowRight, Check } from 'lucide-react'
import type { PoetryMood, PoetryPoem } from '@/types/poetry'
import { MOODS, poemShareText } from '@/lib/poetry'
import { cn } from '@/lib/utils'

const SAVED_KEY = 'daily-poetry-saved'

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
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero — brand first */}
      <header className="pb-8 sm:pb-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04 }}
          className="font-[family-name:var(--font-py-mark)] text-[clamp(3.5rem,14vw,7.5rem)] font-extrabold leading-[0.85] tracking-tighter"
        >
          Poetry
          <span style={{ color: 'var(--py-accent)' }}>.</span>
        </motion.h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-start">
        {/* Reading sheet */}
        <section
          className="relative border min-h-[420px]"
          style={{
            borderColor: 'var(--py-line)',
            background: 'var(--py-paper)',
          }}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ background: 'var(--py-accent)' }}
            aria-hidden
          />

          <div
            className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 sm:px-6"
            style={{ borderColor: 'var(--py-line-soft)' }}
          >
            <p
              className="font-[family-name:var(--font-py-mono)] text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--py-mute)' }}
            >
              Proof sheet
            </p>
            {!loading && poem && (
              <p
                className="font-[family-name:var(--font-py-mono)] text-[10px] uppercase tracking-[0.18em] tabular-nums"
                style={{ color: 'var(--py-mute)' }}
              >
                {lineCount} lines
              </p>
            )}
          </div>

          <div className="px-4 py-8 sm:px-8 sm:py-10 md:px-12">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 animate-pulse py-8"
                >
                  <div className="h-10 w-2/3" style={{ background: 'var(--py-line-soft)' }} />
                  <div className="h-3 w-28" style={{ background: 'var(--py-line-soft)' }} />
                  <div className="space-y-3 pt-8">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-3.5"
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
                  <p
                    className="font-[family-name:var(--font-py-display)] text-xl italic"
                    style={{ color: 'var(--py-mute)' }}
                  >
                    {error ?? 'Nothing on the press just now.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void loadPoem({ next: true })}
                    className="mt-6 inline-flex items-center gap-2 h-10 px-4 font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.14em] cursor-pointer"
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
                  <h2 className="font-[family-name:var(--font-py-display)] text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight leading-[1.15]">
                    {poem.title}
                  </h2>
                  <p
                    className="mt-3 font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.2em]"
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
                          className="group grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3rem_1fr] gap-2 sm:gap-4"
                        >
                          <span
                            className="select-none pt-[0.35em] text-right font-[family-name:var(--font-py-mono)] text-[10px] tabular-nums opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-40"
                            style={{ color: 'var(--py-mute)' }}
                          >
                            {empty ? '' : String(n).padStart(2, '0')}
                          </span>
                          <p
                            className={cn(
                              'font-[family-name:var(--font-py-display)] leading-[1.85]',
                              empty && 'h-4',
                            )}
                            style={{
                              fontSize: 'clamp(1.05rem, 2.2vw, 1.3rem)',
                            }}
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

          {/* Actions */}
          {!loading && poem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
              className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-6"
              style={{
                borderColor: 'var(--py-line-soft)',
                background: 'color-mix(in srgb, var(--py-paper) 92%, transparent)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <button
                type="button"
                onClick={toggleSave}
                className="inline-flex h-10 items-center gap-2 px-3 border font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.12em] cursor-pointer"
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
                className="inline-flex h-10 items-center gap-2 px-3 border font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.12em] cursor-pointer"
                style={{ borderColor: 'var(--py-line)', color: 'var(--py-fg)' }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => void sharePoem()}
                className="inline-flex h-10 items-center gap-2 px-3 border font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.12em] cursor-pointer"
                style={{ borderColor: 'var(--py-line)', color: 'var(--py-fg)' }}
              >
                <Share2 className="size-3.5" />
                Share
              </button>
              <button
                type="button"
                onClick={() => void loadPoem({ next: true, mood })}
                className="inline-flex h-10 items-center gap-2 px-4 ml-auto font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.14em] cursor-pointer"
                style={{ background: 'var(--py-fg)', color: 'var(--py-on-fg)' }}
              >
                Next
                <ArrowRight className="size-3.5" />
              </button>
            </motion.div>
          )}
        </section>

        {/* Mood rail */}
        <aside className="space-y-4 lg:sticky lg:top-28">
          <div
            className="border"
            style={{ borderColor: 'var(--py-line)', background: 'var(--py-panel)' }}
          >
            <div
              className="border-b px-4 py-2.5"
              style={{ borderColor: 'var(--py-line-soft)' }}
            >
              <p
                className="font-[family-name:var(--font-py-mono)] text-[10px] uppercase tracking-[0.22em]"
                style={{ color: 'var(--py-mute)' }}
              >
                Mood
              </p>
            </div>
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void loadPoem({ mood: m.id })}
                  className="relative shrink-0 px-4 py-3.5 text-left font-[family-name:var(--font-py-mono)] text-[11px] uppercase tracking-[0.14em] cursor-pointer transition-opacity hover:opacity-100"
                  style={{
                    color: mood === m.id ? 'var(--py-fg)' : 'var(--py-mute)',
                    opacity: mood === m.id ? 1 : 0.8,
                  }}
                >
                  {mood === m.id && (
                    <motion.span
                      layoutId="py-mood"
                      className="absolute left-0 top-2 bottom-2 w-0.5 lg:top-3 lg:bottom-3"
                      style={{ background: 'var(--py-accent)' }}
                    />
                  )}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <p
            className="px-1 font-[family-name:var(--font-py-mono)] text-[10px] leading-relaxed tracking-wide"
            style={{ color: 'var(--py-mute)' }}
          >
            PoetryDB · featured poets · safe classics
          </p>
        </aside>
      </div>
    </div>
  )
}
