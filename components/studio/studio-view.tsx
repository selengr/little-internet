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
  Mic2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  X,
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
    <div className="space-y-3.5" aria-busy aria-label="Searching for clips">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[1.35rem] border border-[color:var(--st-line)] bg-[color:var(--st-panel)] p-3.5 sm:p-4"
          style={{ animation: `st-fade-up 0.5s ease ${i * 70}ms both` }}
        >
          <div className="flex gap-3.5">
            <ShimmerBlock className="size-[4.25rem] shrink-0 rounded-xl sm:size-[4.75rem]" />
            <div className="min-w-0 flex-1 space-y-2.5 py-1">
              <ShimmerBlock className="h-3 w-20" />
              <ShimmerBlock className="h-4 w-[90%]" />
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
          <Volume2 className="size-3 shrink-0 opacity-70" />
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

function thumbUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

function embedUrl(videoId: string, startSec: number, replayKey: number) {
  const start = Math.max(0, Math.floor(startSec))
  // Regular youtube.com embed (not nocookie) + load only after a user tap reduces bot walls.
  // replayKey busts cache so Replay remounts cleanly.
  const origin =
    typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''
  return `https://www.youtube.com/embed/${videoId}?start=${start}&autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${origin ? `&origin=${origin}` : ''}&rk=${replayKey}`
}

function ListenBars({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-3.5 items-end gap-[3px]', className)} aria-hidden>
      {[0, 1, 2, 3].map(i => (
        <span
          key={i}
          className="w-[2.5px] rounded-full bg-current"
          style={{
            height: '100%',
            animation: `st-listen ${0.7 + i * 0.12}s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

function ClipCard({
  hit,
  query,
  active,
  mediaOn,
  replayKey,
  take,
  onSelect,
  onStartMedia,
  onReplay,
  onClose,
  index,
}: {
  hit: SayItVidHit
  query: string
  active: boolean
  mediaOn: boolean
  replayKey: number
  take: number
  onSelect: () => void
  onStartMedia: () => void
  onReplay: () => void
  onClose: () => void
  index: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 60)
    return () => window.clearTimeout(t)
  }, [active])

  return (
    <div
      ref={cardRef}
      className={cn(
        'overflow-hidden rounded-[1.35rem] border bg-[color:var(--st-panel)] backdrop-blur-sm transition-all duration-300',
        active
          ? 'border-[color:var(--st-accent)]/45 shadow-[var(--st-shadow)] ring-1 ring-[color:var(--st-accent)]/20'
          : 'border-[color:var(--st-line)] hover:border-[color:var(--st-accent)]/28 hover:shadow-[var(--st-shadow)]',
      )}
      style={{ animation: `st-fade-up 0.55s ease ${Math.min(index, 8) * 50}ms both` }}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={active}
        aria-label={active ? `Selected take ${take}: ${hit.text}` : `Open take ${take}: ${hit.text}`}
        className="group flex w-full gap-3.5 p-3.5 text-left sm:gap-4 sm:p-4 md:p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--st-accent)]/40"
      >
        <div
          className="relative size-[4.25rem] shrink-0 overflow-hidden rounded-xl sm:size-[4.75rem]"
          style={{ background: 'var(--st-thumb)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl(hit.video_id)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
          <span
            className={cn(
              'absolute bottom-1.5 left-1.5 inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-white/95',
              'bg-black/55 backdrop-blur-sm',
            )}
            style={{ fontFamily: 'var(--st-mono)' }}
          >
            {String(take).padStart(2, '0')}
          </span>
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity',
              active ? 'opacity-0' : 'opacity-100',
            )}
          >
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)] shadow-lg ring-2 ring-[color:var(--st-on-accent)]/35">
              <Play className="size-3.5 fill-current translate-x-[1px]" />
            </span>
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5 py-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-[0.16em]',
                active ? 'text-[color:var(--st-accent)]' : 'text-[color:var(--st-mute)]',
              )}
            >
              {active ? (
                <span className="inline-flex items-center gap-1.5">
                  <ListenBars className="text-[color:var(--st-accent)]" />
                  Open now
                </span>
              ) : (
                `Take ${String(take).padStart(2, '0')}`
              )}
            </span>
            <span className="text-[10px] text-[color:var(--st-mute)]/70" style={{ fontFamily: 'var(--st-mono)' }}>
              {Math.max(1, Math.round(hit.duration))}s
            </span>
          </div>
          <TranscriptLine hit={hit} query={query} size="sm" />
          <MetaChips hit={hit} />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[color:var(--st-line-soft)]"
          >
            <div className="space-y-4 px-4 pb-4 pt-4 md:px-5 md:pb-5">
              <div className="flex items-start justify-between gap-3">
                <blockquote className="min-w-0 flex-1">
                  <TranscriptLine hit={hit} query={query} size="lg" />
                </blockquote>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--st-line)] text-[color:var(--st-mute)] transition-colors hover:text-[color:var(--st-fg)]"
                  aria-label="Close clip"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div
                className="relative aspect-video overflow-hidden rounded-2xl shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--st-fg)_8%,transparent)]"
                style={{ background: 'var(--st-thumb)' }}
              >
                {!mediaOn ? (
                  <button
                    type="button"
                    onClick={onStartMedia}
                    className="group/play absolute inset-0 flex items-center justify-center"
                    aria-label="Play this clip"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbUrl(hit.video_id)}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-85 transition-all duration-500 group-hover/play:scale-[1.02] group-hover/play:opacity-95"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/30" />
                    <span className="relative z-[1] flex flex-col items-center gap-3">
                      <span className="inline-flex size-16 items-center justify-center rounded-full bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)] shadow-[0_12px_40px_-8px_color-mix(in_srgb,var(--st-accent)_65%,transparent)] transition-transform duration-300 group-hover/play:scale-105">
                        <Play className="size-6 fill-current translate-x-[2px]" />
                      </span>
                      <span
                        className="rounded-full bg-black/45 px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-white/95 backdrop-blur-md"
                        style={{ fontFamily: 'var(--st-mark)' }}
                      >
                        Play · starts at the word
                      </span>
                    </span>
                  </button>
                ) : (
                  <iframe
                    key={`${hit.id}-${replayKey}`}
                    title={`Pronunciation clip: ${hit.text}`}
                    src={embedUrl(hit.video_id, hit.start_time, replayKey)}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {mediaOn ? (
                  <button
                    type="button"
                    onClick={onReplay}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--st-accent)] px-3.5 py-2.5 text-[12px] font-medium text-[color:var(--st-on-accent)] transition-opacity hover:opacity-90"
                  >
                    <RotateCcw className="size-3.5" />
                    Hear again
                  </button>
                ) : null}
                <p className="max-w-sm text-[11px] leading-snug text-[color:var(--st-mute)]">
                  Prefer another voice? Close this take and open the next one.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
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
  const [mediaOn, setMediaOn] = useState(false)
  const [replayKey, setReplayKey] = useState(0)
  const [searchedWord, setSearchedWord] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
      setMediaOn(false)
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
        } else {
          // Open the first take so the booth is one tap from Play
          setActiveId(json.hits[0].id)
          setMediaOn(false)
          setReplayKey(0)
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

  const selectHit = (hit: SayItVidHit) => {
    if (activeId === hit.id) {
      setActiveId(null)
      setMediaOn(false)
      return
    }
    setActiveId(hit.id)
    setMediaOn(false)
    setReplayKey(0)
  }

  const activeAccent = ACCENTS.find(a => a.id === accent)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <header className="mb-8 md:mb-10" style={{ animation: 'st-fade-up 0.6s ease both' }}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--st-line)] bg-[color:var(--st-rack)] px-2.5 py-1.5"
            style={{ fontFamily: 'var(--st-mono)' }}
          >
            <span className="size-1.5 rounded-full bg-[color:var(--st-signal)] shadow-[0_0_8px_var(--st-signal)]" />
            <span className="text-[9px] tracking-[0.2em] text-[color:var(--st-mute)]">CH · PRONUNCIATION</span>
          </span>
          <span
            className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--st-mute)]"
            style={{ fontFamily: 'var(--st-mono)' }}
          >
            Live · Pronunciation
          </span>
        </div>

        <h1
          className="text-[clamp(2.9rem,9vw,4.5rem)] font-semibold leading-[0.92] tracking-tight text-[color:var(--st-fg)]"
          style={{ fontFamily: 'var(--st-mark)' }}
        >
          Magic{' '}
          <span
            className="text-[color:var(--st-accent)]"
            style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic', fontWeight: 400 }}
          >
            Studio
          </span>
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[color:var(--st-mute)] md:text-base">
          A quiet booth for real speech. Type a word, open a take, tap Play — hear how people actually
          say it.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="relative z-10"
        style={{ animation: 'st-fade-up 0.65s ease 70ms both' }}
      >
        {/* Rack console */}
        <div className="overflow-hidden rounded-[1.35rem] border border-[color:var(--st-line)] bg-[color:var(--st-panel)] shadow-[var(--st-shadow)]">
          <div className="flex items-center justify-between gap-3 border-b border-[color:var(--st-line-soft)] bg-[color:var(--st-rack)] px-3.5 py-2 sm:px-4">
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{
                  background: 'var(--st-on-air-dot)',
                  animation: 'st-on-air 1.8s ease-in-out infinite',
                }}
              />
              <span className="size-2 rounded-full bg-[color:var(--st-accent)]/80" />
              <span className="size-2 rounded-full bg-[color:var(--st-signal)]/70" />
              <span
                className="ml-2 text-[9px] tracking-[0.22em] text-[color:var(--st-mute)]"
                style={{ fontFamily: 'var(--st-mono)' }}
              >
                INPUT · WORD ENGINE
              </span>
            </div>
            <div className="hidden items-end gap-[3px] sm:flex" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-sm bg-[color:var(--st-accent)]/70"
                  style={{
                    height: `${8 + ((i * 7) % 14)}px`,
                    animation: `st-listen ${0.65 + (i % 5) * 0.1}s ease-in-out ${i * 0.05}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-3.5">
            <label htmlFor="studio-word" className="sr-only">
              English word to hear
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[color:var(--st-mute)]" />
                <input
                  id="studio-word"
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Type a word to hear…"
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(
                    'h-12 w-full rounded-xl border border-[color:var(--st-line)] bg-[color:var(--st-rack)]',
                    'pl-10 pr-4 text-[16px] text-[color:var(--st-fg)]',
                    'placeholder:text-[color:var(--st-mute)]/55',
                    'outline-none transition-shadow focus:border-[color:var(--st-accent)]/45 focus:ring-2 focus:ring-[color:var(--st-accent)]/20',
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim() || quotaExhausted}
                className={cn(
                  'inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium tracking-wide transition-all duration-200',
                  'bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]',
                  'hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45',
                  'sm:min-w-[9rem]',
                  'shadow-[0_0_28px_-8px_color-mix(in_srgb,var(--st-accent)_55%,transparent)]',
                )}
                style={{ fontFamily: 'var(--st-mark)' }}
              >
                {loading ? (
                  <>
                    <ListenBars />
                    Searching…
                  </>
                ) : (
                  <>
                    <Mic2 className="size-3.5 opacity-90" />
                    Hear it
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-[color:var(--st-line-soft)] pt-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[9px] tracking-[0.18em] text-[color:var(--st-mute)]"
                  style={{ fontFamily: 'var(--st-mono)' }}
                >
                  ACCENT BUS
                </span>
                <div
                  className="inline-flex rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-rack)] p-0.5"
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
                        'rounded-full px-3 py-1.5 text-[10px] tracking-[0.14em] uppercase transition-colors',
                        accent === opt.id
                          ? 'bg-[color:var(--st-accent)] text-[color:var(--st-on-accent)]'
                          : 'text-[color:var(--st-mute)] hover:text-[color:var(--st-fg)]',
                      )}
                    >
                      {opt.short}
                    </button>
                  ))}
                </div>
                {activeAccent && activeAccent.id !== 'all' ? (
                  <span className="text-[11px] text-[color:var(--st-fg)]/55">{activeAccent.plain}</span>
                ) : null}
              </div>

              {remainingLabel ? (
                <p
                  className={cn(
                    'text-[11px] sm:text-right',
                    quotaExhausted ? 'text-[color:var(--st-warm)]' : 'text-[color:var(--st-mute)]',
                  )}
                  style={{ fontFamily: 'var(--st-mono)' }}
                >
                  {remainingLabel}
                  {resetsLabel && quotaExhausted ? (
                    <span className="mt-0.5 block text-[10px] opacity-80">{resetsLabel}</span>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </form>

      {!booted && (
        <div style={{ animation: 'st-fade-up 0.6s ease 130ms both' }}>
          <div className="mt-8 flex flex-wrap gap-2">
            <span
              className="mr-1 self-center text-[10px] tracking-[0.18em] text-[color:var(--st-mute)]"
              style={{ fontFamily: 'var(--st-mono)' }}
            >
              PATCH
            </span>
            {QUICK_WORDS.map(word => (
              <button
                key={word}
                type="button"
                disabled={quotaExhausted}
                onClick={() => {
                  setQuery(word)
                  void search(word)
                }}
                className="rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-panel)]/80 px-3.5 py-1.5 text-[13px] text-[color:var(--st-mute)] transition-all hover:border-[color:var(--st-accent)]/45 hover:text-[color:var(--st-fg)] hover:shadow-[0_0_20px_-8px_color-mix(in_srgb,var(--st-accent)_45%,transparent)] disabled:opacity-40"
                style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
              >
                {word}
              </button>
            ))}
          </div>

          <ol className="mt-9 grid gap-3 text-[13px] text-[color:var(--st-mute)] sm:grid-cols-3">
            {[
              { n: '01', t: 'Type a word', d: 'Anything you want to hear spoken out loud.' },
              { n: '02', t: 'Pick a take', d: 'Each row is a real recorded moment.' },
              { n: '03', t: 'Hit Play', d: 'Expand the take and listen right here.' },
            ].map(step => (
              <li
                key={step.n}
                className="rounded-[1.15rem] border border-[color:var(--st-line-soft)] bg-[color:var(--st-panel)]/70 px-4 py-4"
              >
                <span
                  className="mb-2 block text-[10px] tracking-[0.2em] text-[color:var(--st-accent)]"
                  style={{ fontFamily: 'var(--st-mono)' }}
                >
                  {step.n}
                </span>
                <span className="block text-[color:var(--st-fg)]/90" style={{ fontFamily: 'var(--st-mark)' }}>
                  {step.t}
                </span>
                <span className="mt-1 block leading-relaxed">{step.d}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-9 md:mt-11">
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
            title="No takes in the library"
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
                      className="rounded-full border border-[color:var(--st-line)] bg-[color:var(--st-rack)] px-3.5 py-1.5 text-[13px] text-[color:var(--st-mute)] transition-colors hover:border-[color:var(--st-accent)]/35 hover:text-[color:var(--st-fg)]"
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
            title="Engine hiccup"
            body={error}
            action={
              searchedWord ? (
                <button
                  type="button"
                  onClick={() => void search(searchedWord)}
                  className="rounded-xl bg-[color:var(--st-accent)] px-4 py-2.5 text-[13px] font-medium text-[color:var(--st-on-accent)] transition-opacity hover:opacity-90"
                  style={{ fontFamily: 'var(--st-mark)' }}
                >
                  Re-try
                </button>
              ) : null
            }
          />
        ) : null}

        {!loading && !error && hits.length > 0 ? (
          <div>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p
                  className="text-[10px] tracking-[0.22em] text-[color:var(--st-mute)] mb-1.5"
                  style={{ fontFamily: 'var(--st-mono)' }}
                >
                  MULTITRACK · RESULTS
                </p>
                <p
                  className="text-[clamp(1.75rem,5vw,2.35rem)] tracking-tight text-[color:var(--st-fg)]"
                  style={{ fontFamily: 'var(--st-display)', fontStyle: 'italic' }}
                >
                  {searchedWord}
                </p>
                <p className="mt-1.5 text-[12px] text-[color:var(--st-mute)]">
                  {hits.length} take{hits.length === 1 ? '' : 's'}
                  {total != null && total > hits.length ? ` · ~${total} in the vault` : ''}
                  {' · '}
                  take 01 is armed — tap Play
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {hits.map((hit, i) => (
                <ClipCard
                  key={hit.id}
                  hit={hit}
                  query={searchedWord}
                  active={hit.id === activeId}
                  mediaOn={hit.id === activeId && mediaOn}
                  replayKey={replayKey}
                  take={i + 1}
                  onSelect={() => selectHit(hit)}
                  onStartMedia={() => setMediaOn(true)}
                  onReplay={() => setReplayKey(k => k + 1)}
                  onClose={() => {
                    setActiveId(null)
                    setMediaOn(false)
                  }}
                  index={i}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="mt-14 text-center text-[11px] leading-relaxed text-[color:var(--st-mute)]/70">
        Takes open in the rack. If a clip won’t play, try the next take.
      </p>
    </div>
  )
}
