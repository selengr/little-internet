'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Clock3,
  Mic2,
  Play,
  Search,
  X,
  Youtube,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SayItVidAccent,
  SayItVidHit,
  SayItVidQuota,
  SayItVidSearchResponse,
} from '@/types/sayitvid'

const ACCENTS: { id: SayItVidAccent; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'us', label: 'US' },
  { id: 'uk', label: 'UK' },
  { id: 'aus', label: 'AUS' },
]

const QUICK_WORDS = ['serendipity', 'schedule', 'aluminum', 'herb', 'tomato', 'either']

function formatTimestamp(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function accentLabel(accent: string) {
  const a = accent.trim().toUpperCase()
  if (a === 'US' || a === 'USA') return 'US'
  if (a === 'UK' || a === 'GB') return 'UK'
  if (a === 'AUS' || a === 'AU' || a === 'AUSTRALIA') return 'AUS'
  return a || '—'
}

function quotaCopy(remaining: number | null | undefined) {
  if (remaining == null) return null
  if (remaining <= 0) return 'No searches left today'
  if (remaining === 1) return '1 search left today'
  return `${remaining} searches left today`
}

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-[color:var(--st-fg)]/[0.06]',
        className,
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-[st-shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[color:var(--st-fg)]/[0.09] to-transparent" />
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[color:var(--st-line)] bg-[color:var(--st-panel)] p-4 md:p-5"
          style={{ animation: `st-fade-up 0.5s ease ${i * 70}ms both` }}
        >
          <div className="flex gap-3">
            <ShimmerBlock className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <ShimmerBlock className="h-4 w-[88%]" />
              <ShimmerBlock className="h-3.5 w-[62%]" />
              <div className="flex gap-2 pt-1">
                <ShimmerBlock className="h-6 w-14 rounded-full" />
                <ShimmerBlock className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function highlightWord(text: string, word: string) {
  if (!word.trim() || !text) return text
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'i')
  const parts = text.split(new RegExp(`(${escaped})`, 'ig'))
  return parts.map((part, i) =>
    re.test(part) ? (
      <mark
        key={`${part}-${i}`}
        className="rounded-[3px] bg-[color:var(--st-accent-soft)] px-0.5 text-[color:var(--st-accent)] not-italic"
        style={{ fontFamily: 'var(--st-display)' }}
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${i}`}>{part}</span>
    ),
  )
}

function ClipCard({
  hit,
  query,
  active,
  onPlay,
  index,
}: {
  hit: SayItVidHit
  query: string
  active: boolean
  onPlay: () => void
  index: number
}) {
  const before = hit.text_before?.trim()
  const after = hit.text_after?.trim()
  const hasContext = Boolean(before || after)

  return (
    <button
      type="button"
      onClick={onPlay}
      className={cn(
        'group w-full rounded-2xl border text-left transition-all duration-300',
        'bg-[color:var(--st-panel)] border-[color:var(--st-line)]',
        'hover:border-[color:var(--st-accent)]/35 hover:shadow-[var(--st-shadow)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--st-accent)]/40',
        active && 'border-[color:var(--st-accent)]/50 shadow-[var(--st-shadow)] ring-1 ring-[color:var(--st-accent)]/25',
      )}
      style={{ animation: `st-fade-up 0.55s ease ${Math.min(index, 8) * 55}ms both` }}
    >
      <div className="flex gap-3.5 p-4 md:gap-4 md:p-5">
        <div
          className={cn(
            'relative flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300',
            active
              ? 'border-[color:var(--st-accent)] bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]'
              : 'border-[color:var(--st-line)] bg-[color:var(--st-accent-soft)] text-[color:var(--st-accent)] group-hover:border-[color:var(--st-accent)]/40',
          )}
        >
          {!active && (
            <span
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{ animation: 'st-pulse-ring 2.2s ease-out infinite' }}
              aria-hidden
            />
          )}
          <Play className={cn('size-4', active ? 'fill-current' : '')} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-relaxed text-[color:var(--st-fg)]/90">
            {hasContext ? (
              <>
                {before ? (
                  <span className="text-[color:var(--st-mute)]">{before} </span>
                ) : null}
                <span
                  className="text-[color:var(--st-accent)]"
                  style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
                >
                  {hit.text}
                </span>
                {after ? (
                  <span className="text-[color:var(--st-mute)]"> {after}</span>
                ) : null}
              </>
            ) : (
              highlightWord(hit.text, query)
            )}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] tracking-wide text-[color:var(--st-mute)]">
            <span className="inline-flex items-center rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-bg)]/60 px-2.5 py-1 font-medium text-[color:var(--st-fg)]/75">
              {accentLabel(hit.accent)}
            </span>
            {hit.channel_name ? (
              <span className="inline-flex max-w-[14rem] items-center gap-1 truncate">
                <Youtube className="size-3 shrink-0 opacity-70" />
                {hit.channel_name}
              </span>
            ) : null}
            <span
              className="inline-flex items-center gap-1"
              style={{ fontFamily: 'var(--st-mono)' }}
            >
              <Clock3 className="size-3 opacity-70" />
              {formatTimestamp(hit.start_time)}
              <span className="opacity-50">·</span>
              {Math.max(1, Math.round(hit.duration))}s
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function PlayerPanel({
  hit,
  onClose,
}: {
  hit: SayItVidHit
  onClose: () => void
}) {
  const start = Math.max(0, Math.floor(hit.start_time))
  const end = Math.max(start + 1, Math.ceil(hit.start_time + (hit.duration || 6)))
  const src = `https://www.youtube-nocookie.com/embed/${hit.video_id}?start=${start}&end=${end}&autoplay=1&rel=0&modestbranding=1`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-[color:var(--st-line)] bg-[color:var(--st-panel)] shadow-[var(--st-shadow)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--st-line-soft)] px-4 py-3">
        <div className="min-w-0">
          <p
            className="truncate text-sm text-[color:var(--st-fg)]"
            style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
          >
            {hit.text}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-[color:var(--st-mute)]">
            {hit.channel_name || 'YouTube'} · {accentLabel(hit.accent)} ·{' '}
            {formatTimestamp(hit.start_time)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--st-line)] text-[color:var(--st-mute)] transition-colors hover:text-[color:var(--st-fg)]"
          aria-label="Close player"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="relative aspect-video bg-black/90">
        <iframe
          key={src}
          title={`Pronunciation clip: ${hit.text}`}
          src={src}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </motion.div>
  )
}

export function StudioView() {
  const [query, setQuery] = useState('')
  const [accent, setAccent] = useState<SayItVidAccent>('all')
  const [loading, setLoading] = useState(false)
  const [booted, setBooted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hits, setHits] = useState<SayItVidHit[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [quota, setQuota] = useState<SayItVidQuota | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchedWord, setSearchedWord] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const activeHit = hits.find(h => h.id === activeId) ?? null

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/sayitvid/quota', { cache: 'no-store', signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (json?.quota) setQuota(json.quota as SayItVidQuota)
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  const search = useCallback(
    async (word: string, nextAccent: SayItVidAccent = accent) => {
      const term = word.trim()
      if (!term) return

      setLoading(true)
      setError(null)
      setBooted(true)
      setActiveId(null)
      setSearchedWord(term)

      try {
        const params = new URLSearchParams({
          q: term,
          accent: nextAccent,
          limit: '12',
        })
        const res = await fetch(`/api/sayitvid/search?${params}`, { cache: 'no-store' })
        const json = (await res.json()) as SayItVidSearchResponse & {
          error?: string
          code?: string
          quota?: SayItVidQuota
        }

        if (json.quota) setQuota(json.quota)

        if (!res.ok) {
          setHits([])
          setTotal(null)
          if (res.status === 429 || json.code === 'quota') {
            setError('You’ve used today’s searches. Come back tomorrow for more.')
          } else {
            setError(json.error ?? 'Something went wrong. Please try again.')
          }
          return
        }

        setHits(json.hits ?? [])
        setTotal(json.total_estimated_hits ?? json.hits?.length ?? 0)
        if (!(json.hits?.length > 0)) {
          setError(`No video clips found for “${term}”. Try another word.`)
        }
      } catch {
        setHits([])
        setTotal(null)
        setError('Could not reach the pronunciation studio. Check your connection and try again.')
      } finally {
        setLoading(false)
      }
    },
    [accent],
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void search(query)
  }

  const playHit = (hit: SayItVidHit) => {
    setActiveId(hit.id)
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const remainingLabel = quotaCopy(quota?.remaining)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <header className="mb-8 md:mb-10" style={{ animation: 'st-fade-up 0.6s ease both' }}>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-panel)] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[color:var(--st-mute)]">
          <Mic2 className="size-3 text-[color:var(--st-accent)]" />
          Pronunciation Studio
        </div>

        <h1
          className="text-[clamp(2.4rem,7vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-[color:var(--st-fg)]"
          style={{ fontFamily: 'var(--st-mark)' }}
        >
          Studio
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-[color:var(--st-mute)] md:text-[17px]">
          Type an English word. Hear real people say it in videos.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="relative z-10"
        style={{ animation: 'st-fade-up 0.65s ease 80ms both' }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--st-mute)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Try serendipity, schedule, tomato…"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                'h-14 w-full rounded-2xl border border-[color:var(--st-line)] bg-[color:var(--st-panel)]',
                'pl-11 pr-4 text-[16px] text-[color:var(--st-fg)] shadow-[var(--st-shadow)]',
                'placeholder:text-[color:var(--st-mute)]/70',
                'outline-none transition-shadow focus:border-[color:var(--st-accent)]/45 focus:ring-2 focus:ring-[color:var(--st-accent)]/20',
              )}
              aria-label="English word to pronounce"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={cn(
              'h-14 shrink-0 rounded-2xl px-6 text-sm font-medium tracking-wide transition-all duration-200',
              'bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]',
              'hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45',
              'sm:min-w-[7.5rem]',
            )}
            style={{ fontFamily: 'var(--st-mark)' }}
          >
            {loading ? 'Searching…' : 'Hear it'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-panel)] p-1"
            role="group"
            aria-label="Accent filter"
          >
            {ACCENTS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setAccent(opt.id)
                  if (booted && searchedWord) void search(searchedWord, opt.id)
                }}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.14em] uppercase transition-colors',
                  accent === opt.id
                    ? 'bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]'
                    : 'text-[color:var(--st-mute)] hover:text-[color:var(--st-fg)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {remainingLabel ? (
            <p
              className="text-[12px] text-[color:var(--st-mute)]"
              style={{ fontFamily: 'var(--st-mono)' }}
            >
              {remainingLabel}
            </p>
          ) : null}
        </div>
      </form>

      {!booted && (
        <div
          className="mt-8 flex flex-wrap gap-2"
          style={{ animation: 'st-fade-up 0.6s ease 140ms both' }}
        >
          {QUICK_WORDS.map(word => (
            <button
              key={word}
              type="button"
              onClick={() => {
                setQuery(word)
                void search(word)
              }}
              className="rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-panel)] px-3.5 py-1.5 text-[13px] text-[color:var(--st-mute)] transition-colors hover:border-[color:var(--st-accent)]/35 hover:text-[color:var(--st-fg)]"
              style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      <div ref={playerRef} className="mt-8 md:mt-10">
        <AnimatePresence mode="wait">
          {activeHit ? (
            <PlayerPanel key={activeHit.id} hit={activeHit} onClose={() => setActiveId(null)} />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-8">
        {loading ? <ResultsSkeleton /> : null}

        {!loading && error ? (
          <div
            className="rounded-2xl border border-[color:var(--st-line)] bg-[color:var(--st-panel)] px-5 py-8 text-center"
            style={{ animation: 'st-fade-up 0.45s ease both' }}
          >
            <p className="text-[15px] leading-relaxed text-[color:var(--st-mute)]">{error}</p>
          </div>
        ) : null}

        {!loading && !error && hits.length > 0 ? (
          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p
                  className="text-2xl tracking-tight text-[color:var(--st-fg)]"
                  style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
                >
                  {searchedWord}
                </p>
                <p className="mt-1 text-[12px] text-[color:var(--st-mute)]">
                  {hits.length} clip{hits.length === 1 ? '' : 's'}
                  {total != null && total > hits.length ? ` · about ${total} found` : ''}
                  {' · '}
                  tap to hear
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {hits.map((hit, i) => (
                <ClipCard
                  key={hit.id}
                  hit={hit}
                  query={searchedWord}
                  active={hit.id === activeId}
                  onPlay={() => playHit(hit)}
                  index={i}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-12 text-center text-[11px] leading-relaxed text-[color:var(--st-mute)]/80">
        Clips come from public videos via SayItVid. Playback opens on YouTube.
      </p>
    </div>
  )
}
