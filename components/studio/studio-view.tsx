'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Clock3,
  ExternalLink,
  Mic2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
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

const ACCENTS: { id: SayItVidAccent; short: string; plain: string }[] = [
  { id: 'all', short: 'Any', plain: 'Any accent' },
  { id: 'us', short: 'US', plain: 'American' },
  { id: 'uk', short: 'UK', plain: 'British' },
  { id: 'aus', short: 'AUS', plain: 'Australian' },
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
  if (a === 'US' || a === 'USA') return 'American'
  if (a === 'UK' || a === 'GB') return 'British'
  if (a === 'AUS' || a === 'AU' || a === 'AUSTRALIA') return 'Australian'
  return a || 'Unknown accent'
}

function accentShort(accent: string) {
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

function formatResetsIn(seconds?: number) {
  if (seconds == null || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `Resets in about ${h}h ${m}m`
  if (m > 0) return `Resets in about ${m} min`
  return 'Resets soon'
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
    <div className="space-y-3" aria-busy aria-label="Searching for clips">
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
                <ShimmerBlock className="h-6 w-16 rounded-full" />
                <ShimmerBlock className="h-6 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TranscriptLine({
  hit,
  query,
  size = 'md',
}: {
  hit: SayItVidHit
  query: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const before = hit.text_before?.trim()
  const after = hit.text_after?.trim()
  const hasContext = Boolean(before || after)
  const wordClass =
    size === 'lg'
      ? 'text-[1.35rem] md:text-[1.55rem] leading-snug'
      : size === 'sm'
        ? 'text-[15px] leading-relaxed'
        : 'text-[15px] md:text-base leading-relaxed'

  if (hasContext) {
    return (
      <p className={cn(wordClass, 'text-[color:var(--st-fg)]/90')}>
        {before ? <span className="text-[color:var(--st-mute)]">{before} </span> : null}
        <span
          className="rounded-[4px] bg-[color:var(--st-accent-soft)] px-1 text-[color:var(--st-accent)]"
          style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
        >
          {hit.text}
        </span>
        {after ? <span className="text-[color:var(--st-mute)]"> {after}</span> : null}
      </p>
    )
  }

  if (!query.trim() || !hit.text) {
    return (
      <p
        className={cn(wordClass, 'text-[color:var(--st-accent)]')}
        style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
      >
        {hit.text}
      </p>
    )
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(${escaped})`, 'i')
  const parts = hit.text.split(new RegExp(`(${escaped})`, 'ig'))

  return (
    <p className={cn(wordClass, 'text-[color:var(--st-fg)]/90')}>
      {parts.map((part, i) =>
        re.test(part) ? (
          <mark
            key={`${part}-${i}`}
            className="rounded-[4px] bg-[color:var(--st-accent-soft)] px-1 text-[color:var(--st-accent)] not-italic"
            style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${i}`}>{part}</span>
        ),
      )}
    </p>
  )
}

function MetaChips({ hit }: { hit: SayItVidHit }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-wide text-[color:var(--st-mute)]">
      <span
        className="inline-flex items-center rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-bg)]/70 px-2.5 py-1 font-medium text-[color:var(--st-fg)]/80"
        title={accentLabel(hit.accent)}
      >
        {accentShort(hit.accent)}
        <span className="ml-1.5 hidden text-[color:var(--st-mute)] sm:inline">
          {accentLabel(hit.accent)}
        </span>
      </span>
      {hit.channel_name ? (
        <span className="inline-flex max-w-[16rem] items-center gap-1.5 truncate">
          <Youtube className="size-3 shrink-0 opacity-70" />
          <span className="truncate">{hit.channel_name}</span>
        </span>
      ) : null}
      <span className="inline-flex items-center gap-1" style={{ fontFamily: 'var(--st-mono)' }}>
        <Clock3 className="size-3 opacity-70" />
        {formatTimestamp(hit.start_time)}
        <span className="opacity-45">·</span>
        {Math.max(1, Math.round(hit.duration))}s clip
      </span>
    </div>
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
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-pressed={active}
      aria-label={`Play clip: ${hit.text}`}
      className={cn(
        'group w-full rounded-2xl border text-left transition-all duration-300',
        'bg-[color:var(--st-panel)] border-[color:var(--st-line)]',
        'hover:border-[color:var(--st-accent)]/35 hover:shadow-[var(--st-shadow)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--st-accent)]/40',
        active &&
          'border-[color:var(--st-accent)]/55 shadow-[var(--st-shadow)] ring-1 ring-[color:var(--st-accent)]/30',
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
          <Play className={cn('size-4', active && 'fill-current')} />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <TranscriptLine hit={hit} query={query} size="sm" />
          <MetaChips hit={hit} />
        </div>
      </div>
    </button>
  )
}

function PlayerPanel({
  hit,
  query,
  onClose,
  onReplay,
  replayKey,
}: {
  hit: SayItVidHit
  query: string
  onClose: () => void
  onReplay: () => void
  replayKey: number
}) {
  const start = Math.max(0, Math.floor(hit.start_time))
  const end = Math.max(start + 1, Math.ceil(hit.start_time + (hit.duration || 6)))
  const src = `https://www.youtube-nocookie.com/embed/${hit.video_id}?start=${start}&end=${end}&autoplay=1&rel=0&modestbranding=1`
  const watchUrl = `https://www.youtube.com/watch?v=${hit.video_id}&t=${start}s`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.99 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-[color:var(--st-line)] bg-[color:var(--st-panel)] shadow-[var(--st-shadow)]"
    >
      <div className="border-b border-[color:var(--st-line-soft)] px-4 py-3.5 md:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--st-mute)]">
              Now playing
            </p>
            <TranscriptLine hit={hit} query={query} size="lg" />
            <div className="mt-3">
              <MetaChips hit={hit} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--st-line)] text-[color:var(--st-mute)] transition-colors hover:border-[color:var(--st-line)] hover:text-[color:var(--st-fg)]"
            aria-label="Close player"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--st-line)] bg-[color:var(--st-bg)]/55 px-3 py-2 text-[12px] font-medium text-[color:var(--st-fg)]/85 transition-colors hover:border-[color:var(--st-accent)]/40 hover:text-[color:var(--st-fg)]"
          >
            <RotateCcw className="size-3.5 text-[color:var(--st-accent)]" />
            Replay clip
          </button>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[color:var(--st-line)] bg-[color:var(--st-bg)]/55 px-3 py-2 text-[12px] font-medium text-[color:var(--st-fg)]/85 transition-colors hover:border-[color:var(--st-accent)]/40 hover:text-[color:var(--st-fg)]"
          >
            <ExternalLink className="size-3.5 opacity-70" />
            Open on YouTube
          </a>
        </div>
      </div>

      <div className="relative aspect-video bg-black/90">
        <iframe
          key={`${hit.id}-${replayKey}-${src}`}
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

function StatusPanel({
  tone = 'neutral',
  title,
  body,
  action,
}: {
  tone?: 'neutral' | 'warn' | 'error'
  title: string
  body: string
  action?: ReactNode
}) {
  const Icon = tone === 'neutral' ? Sparkles : AlertCircle
  return (
    <div
      className={cn(
        'rounded-2xl border bg-[color:var(--st-panel)] px-5 py-9 text-center md:px-8',
        tone === 'warn' && 'border-[color:var(--st-warm)]/35',
        tone === 'error' && 'border-[color:var(--st-warm)]/40',
        tone === 'neutral' && 'border-[color:var(--st-line)]',
      )}
      style={{ animation: 'st-glow-in 0.45s ease both' }}
      role="status"
    >
      <div
        className={cn(
          'mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl border',
          tone === 'neutral'
            ? 'border-[color:var(--st-line)] bg-[color:var(--st-accent-soft)] text-[color:var(--st-accent)]'
            : 'border-[color:var(--st-warm)]/30 bg-[color:var(--st-warm)]/10 text-[color:var(--st-warm)]',
        )}
      >
        <Icon className="size-5" />
      </div>
      <p
        className="text-lg tracking-tight text-[color:var(--st-fg)]"
        style={{ fontFamily: 'var(--st-mark)' }}
      >
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[color:var(--st-mute)]">
        {body}
      </p>
      {action ? <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  )
}

export function StudioView() {
  const [query, setQuery] = useState('')
  const [accent, setAccent] = useState<SayItVidAccent>('all')
  const [loading, setLoading] = useState(false)
  const [booted, setBooted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<'empty' | 'quota' | 'error' | null>(null)
  const [hits, setHits] = useState<SayItVidHit[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [quota, setQuota] = useState<SayItVidQuota | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [replayKey, setReplayKey] = useState(0)
  const [searchedWord, setSearchedWord] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const activeHit = hits.find(h => h.id === activeId) ?? null
  const remainingLabel = quotaCopy(quota?.remaining)
  const resetsLabel = formatResetsIn(quota?.resets_in_seconds)
  const quotaExhausted = quota != null && quota.remaining <= 0

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
      setErrorKind(null)
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
            setErrorKind('quota')
            setError('You’ve used today’s searches. Come back tomorrow for more.')
          } else {
            setErrorKind('error')
            setError(json.error ?? 'Something went wrong. Please try again.')
          }
          return
        }

        setHits(json.hits ?? [])
        setTotal(json.total_estimated_hits ?? json.hits?.length ?? 0)
        if (!(json.hits?.length > 0)) {
          setErrorKind('empty')
          setError(`No clips found for “${term}”. Try a different word or accent.`)
        }
      } catch {
        setHits([])
        setTotal(null)
        setErrorKind('error')
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
    setReplayKey(0)
    setActiveId(hit.id)
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const activeAccent = ACCENTS.find(a => a.id === accent)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      {/* First viewport: brand + plain promise + search as the action */}
      <header className="mb-7 md:mb-9" style={{ animation: 'st-fade-up 0.6s ease both' }}>
        <p className="mb-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--st-mute)]">
          <Mic2 className="size-3.5 text-[color:var(--st-accent)]" />
          Pronunciation practice
        </p>

        <h1
          className="text-[clamp(2.6rem,8vw,4rem)] font-semibold leading-[0.98] tracking-tight text-[color:var(--st-fg)]"
          style={{ fontFamily: 'var(--st-mark)' }}
        >
          Studio
        </h1>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-[color:var(--st-mute)] md:text-[17px]">
          Type an English word. Hear real people say it in short video clips — American, British, or
          Australian.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="relative z-10"
        style={{ animation: 'st-fade-up 0.65s ease 70ms both' }}
      >
        <label htmlFor="studio-word" className="sr-only">
          English word to hear
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[color:var(--st-mute)]" />
            <input
              id="studio-word"
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a word — try schedule or tomato"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                'h-14 w-full rounded-2xl border border-[color:var(--st-line)] bg-[color:var(--st-panel)]',
                'pl-11 pr-4 text-[16px] text-[color:var(--st-fg)] shadow-[var(--st-shadow)]',
                'placeholder:text-[color:var(--st-mute)]/70',
                'outline-none transition-shadow focus:border-[color:var(--st-accent)]/45 focus:ring-2 focus:ring-[color:var(--st-accent)]/20',
              )}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim() || quotaExhausted}
            className={cn(
              'h-14 shrink-0 rounded-2xl px-6 text-sm font-medium tracking-wide transition-all duration-200',
              'bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]',
              'hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45',
              'sm:min-w-[8rem]',
            )}
            style={{ fontFamily: 'var(--st-mark)' }}
          >
            {loading ? 'Searching…' : 'Hear it'}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] text-[color:var(--st-mute)]">
              Accent
              {activeAccent ? (
                <span className="text-[color:var(--st-fg)]/55"> · {activeAccent.plain}</span>
              ) : null}
            </p>
            <div
              className="inline-flex rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-panel)] p-1"
              role="group"
              aria-label="Accent filter"
            >
              {ACCENTS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  title={opt.plain}
                  onClick={() => {
                    setAccent(opt.id)
                    if (booted && searchedWord) void search(searchedWord, opt.id)
                  }}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.12em] uppercase transition-colors',
                    accent === opt.id
                      ? 'bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]'
                      : 'text-[color:var(--st-mute)] hover:text-[color:var(--st-fg)]',
                  )}
                >
                  {opt.short}
                </button>
              ))}
            </div>
          </div>

          {remainingLabel ? (
            <p
              className={cn(
                'text-[12px] sm:text-right',
                quotaExhausted ? 'text-[color:var(--st-warm)]' : 'text-[color:var(--st-mute)]',
              )}
              style={{ fontFamily: 'var(--st-mono)' }}
            >
              {remainingLabel}
              {resetsLabel && quotaExhausted ? (
                <span className="mt-0.5 block text-[11px] opacity-80">{resetsLabel}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </form>

      {!booted && (
        <div style={{ animation: 'st-fade-up 0.6s ease 130ms both' }}>
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="mr-1 self-center text-[12px] text-[color:var(--st-mute)]">Try:</span>
            {QUICK_WORDS.map(word => (
              <button
                key={word}
                type="button"
                disabled={quotaExhausted}
                onClick={() => {
                  setQuery(word)
                  void search(word)
                }}
                className="rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-panel)] px-3.5 py-1.5 text-[13px] text-[color:var(--st-mute)] transition-colors hover:border-[color:var(--st-accent)]/35 hover:text-[color:var(--st-fg)] disabled:opacity-40"
                style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
              >
                {word}
              </button>
            ))}
          </div>

          <ol className="mt-8 grid gap-3 text-[13px] text-[color:var(--st-mute)] sm:grid-cols-3">
            {[
              { n: '1', t: 'Type a word', d: 'Any everyday English word works.' },
              { n: '2', t: 'Pick an accent', d: 'Or leave it on Any.' },
              { n: '3', t: 'Tap a clip', d: 'Watch the moment they say it.' },
            ].map(step => (
              <li
                key={step.n}
                className="rounded-2xl border border-[color:var(--st-line-soft)] bg-[color:var(--st-panel)]/55 px-4 py-3.5"
              >
                <span
                  className="mb-1.5 block text-[10px] tracking-[0.18em] text-[color:var(--st-accent)]"
                  style={{ fontFamily: 'var(--st-mono)' }}
                >
                  {step.n}
                </span>
                <span className="block text-[color:var(--st-fg)]/85" style={{ fontFamily: 'var(--st-mark)' }}>
                  {step.t}
                </span>
                <span className="mt-0.5 block leading-relaxed">{step.d}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div
        ref={playerRef}
        className={cn('mt-8 md:mt-10', activeHit && 'md:sticky md:top-[5.25rem] md:z-20')}
      >
        <AnimatePresence mode="wait">
          {activeHit ? (
            <PlayerPanel
              key={activeHit.id}
              hit={activeHit}
              query={searchedWord}
              replayKey={replayKey}
              onClose={() => setActiveId(null)}
              onReplay={() => setReplayKey(k => k + 1)}
            />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-8">
        {loading ? <ResultsSkeleton /> : null}

        {!loading && error && errorKind === 'quota' ? (
          <StatusPanel
            tone="warn"
            title="Daily limit reached"
            body={`${error}${resetsLabel ? ` ${resetsLabel}.` : ''}`}
          />
        ) : null}

        {!loading && error && errorKind === 'empty' ? (
          <StatusPanel
            tone="neutral"
            title="No clips for that word"
            body={error}
            action={
              <>
                {QUICK_WORDS.filter(w => w.toLowerCase() !== searchedWord.toLowerCase())
                  .slice(0, 4)
                  .map(word => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => {
                        setQuery(word)
                        void search(word)
                      }}
                      className="rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-bg)]/50 px-3.5 py-1.5 text-[13px] text-[color:var(--st-mute)] transition-colors hover:border-[color:var(--st-accent)]/35 hover:text-[color:var(--st-fg)]"
                      style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
                    >
                      {word}
                    </button>
                  ))}
              </>
            }
          />
        ) : null}

        {!loading && error && errorKind === 'error' ? (
          <StatusPanel
            tone="error"
            title="Couldn’t load clips"
            body={error}
            action={
              searchedWord ? (
                <button
                  type="button"
                  onClick={() => void search(searchedWord)}
                  className="rounded-xl bg-[color:var(--st-accent)] px-4 py-2.5 text-[13px] font-medium text-[color:var(--st-on-accent)] transition-opacity hover:opacity-90"
                  style={{ fontFamily: 'var(--st-mark)' }}
                >
                  Try again
                </button>
              ) : null
            }
          />
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
                  tap one to hear it
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
