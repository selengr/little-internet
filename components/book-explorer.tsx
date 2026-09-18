'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Bookmark,
  Share2,
  BookOpen,
  Clock,
  Globe2,
  Building2,
  Hash,
  Calendar,
  Layers,
  ChevronDown,
  X,
  TrendingUp,
  User,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import type { BookCard, BookDetail } from '@/types/openlibrary'
import {
  POPULAR_SEARCHES,
  authorPhotoUrl,
  coverUrl,
  difficultyFromPages,
  estimateReadingHours,
} from '@/lib/openlibrary'
import { cn } from '@/lib/utils'

const RECENT_KEY = 'book-explorer-recent'

const mono = { fontFamily: 'var(--font-bk-mono), ui-monospace, monospace' } as const
const display = { fontFamily: 'var(--font-bk-display), Georgia, serif' } as const
const mark = { fontFamily: 'var(--font-bk-mark), system-ui, sans-serif' } as const

function loadRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecent(q: string) {
  const next = [q, ...loadRecent().filter(x => x !== q)].slice(0, 6)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  return next
}

function RatingStars({ value }: { value?: number }) {
  if (value == null) {
    return (
      <span className="text-xs text-[color:var(--bk-mute)]" style={mono}>
        —
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{ color: 'var(--bk-gold)' }}
    >
      <Star className="size-3.5 fill-current" />
      <span className="text-sm tabular-nums font-medium" style={mono}>
        {value.toFixed(1)}
      </span>
    </span>
  )
}

function Cover({
  id,
  title,
  size = 'lg',
  className,
  isbn,
}: {
  id?: number
  title: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  isbn?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : coverUrl(id, size === 'sm' ? 'M' : 'L', isbn)

  useEffect(() => {
    setFailed(false)
  }, [id, isbn])

  const dims =
    size === 'sm'
      ? 'w-12 h-[4.5rem]'
      : size === 'md'
        ? 'w-28 h-[10.5rem] sm:w-32 sm:h-48'
        : 'w-[160px] sm:w-[200px] md:w-[220px] aspect-[2/3]'

  return (
    <div className={cn('relative', dims, className)}>
      <div
        className={cn(
          'relative h-full w-full overflow-hidden border border-[color:var(--bk-line)] bg-[color:var(--bk-panel)]',
          'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          size === 'lg' && 'hover:-translate-y-1',
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[color:var(--bk-accent-soft)]">
            <BookOpen className="size-8 text-[color:var(--bk-mute)]" />
          </div>
        )}
      </div>
    </div>
  )
}

function InsightMeter({
  label,
  value,
  hint,
}: {
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] text-[color:var(--bk-mute)]">{label}</span>
        <span className="text-sm tabular-nums font-medium" style={mono}>
          {value}
          <span className="text-[color:var(--bk-mute)] text-xs">%</span>
        </span>
      </div>
      <div className="h-1 bg-[color:var(--bk-line-soft)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-[color:var(--bk-accent)]"
        />
      </div>
      {hint && (
        <p className="text-[10px] text-[color:var(--bk-mute)]" style={mono}>
          {hint}
        </p>
      )}
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-[color:var(--bk-fg)]/10', className)} />
}

export function BookExplorer() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<BookCard[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [activeSuggest, setActiveSuggest] = useState(-1)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [trending, setTrending] = useState<BookCard[]>([])
  const [book, setBook] = useState<BookDetail | null>(null)
  const [similar, setSimilar] = useState<BookCard[]>([])
  const [loadingBook, setLoadingBook] = useState(true)
  const [descOpen, setDescOpen] = useState(false)
  const [tab, setTab] = useState<'overview' | 'details' | 'author'>('overview')
  const [shared, setShared] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const wrapRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const openWork = useCallback(async (id: string) => {
    setLoadingBook(true)
    setError(null)
    setDescOpen(false)
    setShowSuggest(false)
    setShared(false)
    try {
      const res = await fetch(`/api/books?action=work&id=${encodeURIComponent(id)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load book')
      setBook(json.book)
      setSimilar(json.similar ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book')
    } finally {
      setLoadingBook(false)
    }
  }, [])

  const runSearch = useCallback(
    async (q: string) => {
      const term = q.trim()
      if (!term) return
      setQuery(term)
      setRecent(saveRecent(term))
      setShowSuggest(false)
      setLoadingBook(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/books?action=search&q=${encodeURIComponent(term)}&limit=1`,
          { cache: 'no-store' },
        )
        const json = await res.json()
        const first = json.books?.[0] as BookCard | undefined
        if (!first) {
          setBook(null)
          setSimilar([])
          setError('No books found. Try another keyword.')
          setLoadingBook(false)
          return
        }
        await openWork(first.workKey)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setLoadingBook(false)
      }
    },
    [openWork],
  )

  useEffect(() => {
    setRecent(loadRecent())
    fetch('/api/books?action=trending')
      .then(r => r.json())
      .then(json => setTrending(json.books ?? []))
      .catch(() => {})

    const q = searchParams.get('q')?.trim()
    const work = searchParams.get('work')?.trim()

    if (work) {
      void openWork(work.replace(/^\/works\//, ''))
    } else if (q) {
      setQuery(q)
      void runSearch(q)
    } else {
      void openWork('OL17930368W')
    }
  }, [openWork, runSearch, searchParams])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggest(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const fetchSuggest = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setSuggestLoading(false)
      return
    }
    setSuggestLoading(true)
    try {
      const res = await fetch(`/api/books?action=suggest&q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      setSuggestions(json.books ?? [])
      setShowSuggest(true)
      setActiveSuggest(-1)
    } catch {
      setSuggestions([])
    } finally {
      setSuggestLoading(false)
    }
  }, [])

  const onQueryChange = (val: string) => {
    setQuery(val)
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    suggestTimer.current = setTimeout(() => void fetchSuggest(val), 280)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggest || suggestions.length === 0) {
      if (e.key === 'Enter') void runSearch(query)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggest(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggest(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggest >= 0) void openWork(suggestions[activeSuggest].workKey)
      else void runSearch(query)
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
    }
  }

  const shareBook = async () => {
    if (!book) return
    const url = `https://openlibrary.org/works/${book.workKey}`
    try {
      if (navigator.share) await navigator.share({ title: book.title, url })
      else await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      /* cancelled */
    }
  }

  const readingTime = estimateReadingHours(book?.pages)
  const difficulty = difficultyFromPages(book?.pages)
  const desc = book?.description ?? ''
  const shortDesc = desc.length > 380 ? `${desc.slice(0, 380).trim()}…` : desc
  const chips = useMemo(() => book?.subjects?.slice(0, 8) ?? [], [book])
  const ratingPct = book?.rating != null ? Math.round((book.rating / 5) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10">
      {/* ── HERO + SEARCH ──────────────────────────────────────────────── */}
      <section className="relative z-50 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 md:mb-10"
        >
          <h1
            className="text-[clamp(3rem,12vw,6.5rem)] leading-[0.88] tracking-tight text-[color:var(--bk-fg)]"
            style={display}
          >
            Folio
            <span style={{ color: 'var(--bk-accent)' }}>.</span>
          </h1>
          <p
            className="mt-3 text-base text-[color:var(--bk-mute)] max-w-sm leading-snug"
            style={display}
          >
            Find a book to read.
          </p>
        </motion.div>

        <div ref={wrapRef} className="relative max-w-xl">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="relative flex-1 border-b border-[color:var(--bk-line)] focus-within:border-[color:var(--bk-accent)] transition-colors">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-[color:var(--bk-mute)]" />
              <input
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setShowSuggest(true)}
                placeholder="Title, author, or subject…"
                className="w-full bg-transparent h-12 pl-7 pr-8 text-[15px] outline-none placeholder:text-[color:var(--bk-mute)]"
                style={mono}
                autoComplete="off"
                aria-label="Search books"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSuggestions([])
                    setShowSuggest(true)
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 size-7 flex items-center justify-center text-[color:var(--bk-mute)] hover:text-[color:var(--bk-fg)] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void runSearch(query)}
              disabled={loadingBook}
              className="h-11 px-5 border border-[color:var(--bk-fg)] bg-[color:var(--bk-fg)] text-[color:var(--bk-bg)] text-[11px] uppercase tracking-[0.18em] hover:opacity-90 transition-opacity cursor-pointer shrink-0 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              style={mono}
            >
              {loadingBook ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Searching
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>

          <AnimatePresence>
            {showSuggest && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-[calc(100%+10px)] z-[60] overflow-hidden border border-[color:var(--bk-line)] bg-[color:var(--bk-bg)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]"
              >
                {suggestLoading && (
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <SkeletonBlock key={i} className="h-14" />
                    ))}
                  </div>
                )}

                {!suggestLoading && query.trim().length >= 2 && suggestions.length > 0 && (
                  <ul className="max-h-[min(22rem,50vh)] overflow-y-auto p-1.5">
                    {suggestions.map((s, i) => (
                      <li key={s.workKey}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveSuggest(i)}
                          onMouseDown={() => void openWork(s.workKey)}
                          className={cn(
                            'w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors cursor-pointer',
                            i === activeSuggest
                              ? 'bg-[color:var(--bk-accent-soft)]'
                              : 'hover:bg-[color:var(--bk-line-soft)]',
                          )}
                        >
                          <Cover id={s.coverId} title={s.title} size="sm" isbn={s.isbn} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm truncate" style={mark}>
                              {s.title}
                            </p>
                            <p
                              className="text-xs text-[color:var(--bk-mute)] truncate mt-0.5"
                              style={mono}
                            >
                              {s.authors[0] ?? 'Unknown'}
                              {s.year ? ` · ${s.year}` : ''}
                            </p>
                          </div>
                          <RatingStars value={s.rating} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!suggestLoading && query.trim().length < 2 && (
                  <div className="p-4 space-y-5">
                    {recent.length > 0 && (
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--bk-mute)] mb-2.5"
                          style={mono}
                        >
                          Recent
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {recent.map(r => (
                            <button
                              key={r}
                              type="button"
                              onMouseDown={() => void runSearch(r)}
                              className="text-xs px-3 py-1.5 border border-[color:var(--bk-line)] text-[color:var(--bk-fg)] hover:border-[color:var(--bk-accent)] transition-colors cursor-pointer"
                              style={mono}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p
                        className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--bk-mute)] mb-2.5"
                        style={mono}
                      >
                        Popular
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SEARCHES.map(r => (
                          <button
                            key={r}
                            type="button"
                            onMouseDown={() => void runSearch(r)}
                            className="text-xs px-3 py-1.5 border border-[color:var(--bk-line)] text-[color:var(--bk-mute)] hover:text-[color:var(--bk-fg)] hover:border-[color:var(--bk-fg)]/40 transition-colors cursor-pointer"
                            style={mono}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!suggestLoading && query.trim().length >= 2 && suggestions.length === 0 && (
                  <p
                    className="py-12 text-center text-sm text-[color:var(--bk-mute)]"
                    style={mono}
                  >
                    No matches for “{query}”
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {error && !book && (
        <div className="border border-[color:var(--bk-line)] bg-[color:var(--bk-panel)] py-16 text-center mb-10">
          <BookOpen className="size-8 mx-auto text-[color:var(--bk-mute)] mb-4" />
          <p className="text-lg" style={display}>
            {error}
          </p>
        </div>
      )}

      {/* ── BOOK STAGE ─────────────────────────────────────────────────── */}
      <div className="relative z-0 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_240px] gap-8 lg:gap-10 items-start">
        <aside className="flex justify-center lg:justify-start order-1">
          {loadingBook ? (
            <SkeletonBlock className="w-[160px] sm:w-[200px] md:w-[220px] aspect-[2/3]" />
          ) : book ? (
            <div className="lg:sticky lg:top-28">
              <Cover id={book.coverId} title={book.title} size="lg" isbn={book.isbn} />
            </div>
          ) : null}
        </aside>

        <div className="min-w-0 order-2">
          {loadingBook ? (
            <div className="space-y-4">
              <SkeletonBlock className="h-10 w-4/5" />
              <SkeletonBlock className="h-5 w-1/3" />
              <SkeletonBlock className="h-28 w-full" />
              <SkeletonBlock className="h-48 w-full" />
            </div>
          ) : book ? (
            <motion.div
              key={book.workKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              <header>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {book.popularity != null && book.popularity > 70 && (
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 border border-[color:var(--bk-gold)]/40"
                      style={{ ...mono, color: 'var(--bk-gold)' }}
                    >
                      Popular
                    </span>
                  )}
                  {chips.slice(0, 2).map(s => (
                    <span
                      key={s}
                      className="text-[10px] tracking-wide px-2.5 py-1 text-[color:var(--bk-mute)] border border-[color:var(--bk-line-soft)]"
                      style={mono}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <h2
                    className="text-3xl sm:text-4xl md:text-[2.75rem] tracking-tight leading-[1.08] text-[color:var(--bk-fg)]"
                    style={display}
                  >
                    {book.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => void shareBook()}
                    className={cn(
                      'hidden sm:inline-flex shrink-0 items-center gap-2 h-10 px-3.5 border text-xs transition-colors cursor-pointer',
                      shared
                        ? 'border-[color:var(--bk-accent)] text-[color:var(--bk-accent)]'
                        : 'border-[color:var(--bk-line)] text-[color:var(--bk-mute)] hover:text-[color:var(--bk-fg)]',
                    )}
                    style={mono}
                    aria-label="Share book"
                  >
                    <Share2 className="size-3.5" />
                    {shared ? 'Copied' : 'Share'}
                  </button>
                </div>

                <p className="mt-3 text-[15px] text-[color:var(--bk-mute)]" style={display}>
                  {book.authors.join(', ') || 'Unknown author'}
                  {book.year ? (
                    <span className="text-[color:var(--bk-mute)]/70"> · {book.year}</span>
                  ) : null}
                </p>
              </header>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-px border-y border-[color:var(--bk-line)] bg-[color:var(--bk-line)]">
                {[
                  { label: 'Rating', value: book.rating != null ? book.rating.toFixed(1) : '—' },
                  { label: 'Pages', value: book.pages ? String(book.pages) : '—' },
                  { label: 'Time', value: readingTime ?? '—' },
                  { label: 'Editions', value: book.editionCount ? String(book.editionCount) : '—' },
                  {
                    label: 'Lang',
                    value: book.languages?.length ? String(book.languages.length) : '—',
                  },
                ].map(m => (
                  <div key={m.label} className="bg-[color:var(--bk-bg)] px-3 py-4">
                    <p
                      className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--bk-mute)] mb-1"
                      style={mono}
                    >
                      {m.label}
                    </p>
                    <p className="text-base tabular-nums" style={mono}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-0 border-b border-[color:var(--bk-line)]">
                {(['overview', 'details', 'author'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      'px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] transition-colors cursor-pointer border-b-2 -mb-px',
                      tab === t
                        ? 'border-[color:var(--bk-accent)] text-[color:var(--bk-fg)]'
                        : 'border-transparent text-[color:var(--bk-mute)] hover:text-[color:var(--bk-fg)]',
                    )}
                    style={mono}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm leading-[1.75] text-[color:var(--bk-fg)]/85 whitespace-pre-line">
                      {descOpen ? desc : shortDesc}
                    </p>
                    {desc.length > 380 && (
                      <button
                        type="button"
                        onClick={() => setDescOpen(v => !v)}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-[color:var(--bk-accent)] hover:underline cursor-pointer"
                        style={mono}
                      >
                        {descOpen ? 'Show less' : 'Read more'}
                        <ChevronDown
                          className={cn('size-3.5 transition-transform', descOpen && 'rotate-180')}
                        />
                      </button>
                    )}
                  </div>

                  {chips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {chips.map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => void runSearch(s)}
                          className="text-xs px-3 py-1.5 border border-[color:var(--bk-line)] text-[color:var(--bk-mute)] hover:text-[color:var(--bk-fg)] hover:border-[color:var(--bk-accent)] transition-colors cursor-pointer"
                          style={mono}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'details' && (
                <div className="divide-y divide-[color:var(--bk-line-soft)]">
                  {[
                    { icon: Calendar, label: 'Published', value: book.year ?? '—' },
                    { icon: Building2, label: 'Publisher', value: book.publishers?.[0] ?? '—' },
                    { icon: Hash, label: 'ISBN', value: book.isbn ?? '—' },
                    {
                      icon: Globe2,
                      label: 'Languages',
                      value: book.languages?.slice(0, 6).join(', ').toUpperCase() || '—',
                    },
                    { icon: Layers, label: 'Editions', value: book.editionCount ?? '—' },
                    {
                      icon: Bookmark,
                      label: 'Want to read',
                      value: book.wantToRead?.toLocaleString() ?? '—',
                    },
                    {
                      icon: BookOpen,
                      label: 'Already read',
                      value: book.alreadyRead?.toLocaleString() ?? '—',
                    },
                    { icon: Clock, label: 'Difficulty', value: difficulty },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
                      <span className="inline-flex items-center gap-2 text-xs text-[color:var(--bk-mute)]">
                        <row.icon className="size-3.5 opacity-60" />
                        {row.label}
                      </span>
                      <span className="text-sm text-right" style={mono}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'author' && (
                <div className="flex items-start gap-5">
                  <div className="size-14 overflow-hidden border border-[color:var(--bk-line)] bg-[color:var(--bk-panel)] shrink-0 flex items-center justify-center">
                    {authorPhotoUrl(book.authorPhotoId) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={authorPhotoUrl(book.authorPhotoId)!}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <User className="size-5 text-[color:var(--bk-mute)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg tracking-tight" style={mark}>
                      {book.authors[0] ?? 'Unknown'}
                    </p>
                    {book.authorBirth && (
                      <p className="text-xs text-[color:var(--bk-mute)] mt-1" style={mono}>
                        Born {book.authorBirth}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--bk-fg)]/80 line-clamp-5">
                      {book.authorBio || 'No biography available for this author yet.'}
                    </p>
                    {book.authorKeys[0] && (
                      <a
                        href={`https://openlibrary.org/authors/${book.authorKeys[0]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs text-[color:var(--bk-accent)] hover:underline"
                        style={mono}
                      >
                        Author on Open Library
                        <ArrowRight className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </div>

        {/* Pulse — desktop sidebar; stacks on mobile after content */}
        <aside className="order-3">
          {loadingBook ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : book ? (
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="border border-[color:var(--bk-line)] bg-[color:var(--bk-panel)] backdrop-blur-sm p-5">
                <div className="flex items-center justify-between mb-6">
                  <p
                    className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--bk-mute)]"
                    style={mono}
                  >
                    Pulse
                  </p>
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--bk-accent)] opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--bk-accent)]" />
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-3xl tracking-tight tabular-nums" style={display}>
                    {book.popularity ?? 42}
                    <span className="text-base text-[color:var(--bk-mute)] ml-1">/ 100</span>
                  </p>
                  <p className="text-xs text-[color:var(--bk-mute)] mt-1">Reader interest</p>
                </div>

                <div className="space-y-5">
                  <InsightMeter
                    label="Popularity"
                    value={book.popularity ?? 42}
                    hint="Based on reading logs & editions"
                  />
                  <InsightMeter
                    label="Community rating"
                    value={ratingPct}
                    hint={
                      book.ratingsCount
                        ? `${book.ratingsCount.toLocaleString()} ratings`
                        : 'Limited ratings'
                    }
                  />
                </div>

                <div className="mt-6 pt-5 border-t border-[color:var(--bk-line-soft)] grid grid-cols-2 gap-4">
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--bk-mute)] mb-1"
                      style={mono}
                    >
                      Pace
                    </p>
                    <p className="text-sm" style={mark}>
                      {difficulty}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--bk-mute)] mb-1"
                      style={mono}
                    >
                      Sit time
                    </p>
                    <p className="text-sm tabular-nums" style={mono}>
                      {readingTime ?? '—'}
                    </p>
                  </div>
                </div>
              </div>

              {trending.length > 0 && (
                <div className="border border-[color:var(--bk-line)] bg-[color:var(--bk-panel)] p-4">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <TrendingUp className="size-3.5" style={{ color: 'var(--bk-gold)' }} />
                    <p
                      className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--bk-mute)]"
                      style={mono}
                    >
                      Also trending
                    </p>
                  </div>
                  <div className="space-y-1">
                    {trending.slice(0, 4).map(t => (
                      <button
                        key={t.workKey}
                        type="button"
                        onClick={() => void openWork(t.workKey)}
                        className="w-full flex items-center gap-3 px-1.5 py-2 hover:bg-[color:var(--bk-line-soft)] transition-colors text-left cursor-pointer"
                      >
                        <Cover
                          id={t.coverId}
                          title={t.title}
                          size="sm"
                          isbn={t.isbn}
                          className="!w-9 !h-[3.35rem]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs truncate" style={mark}>
                            {t.title}
                          </p>
                          <p className="text-[10px] text-[color:var(--bk-mute)] truncate">
                            {t.authors[0]}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </div>

      {/* Similar shelf */}
      {(similar.length > 0 || loadingBook) && (
        <section className="mt-14 md:mt-20">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--bk-mute)] mb-1.5"
                style={mono}
              >
                More like this
              </p>
              <h3 className="text-2xl md:text-3xl tracking-tight" style={display}>
                Similar books
              </h3>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingBook
              ? Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonBlock key={i} className="shrink-0 w-28 sm:w-32 h-52" />
                ))
              : similar.map(s => (
                  <button
                    key={s.workKey}
                    type="button"
                    onClick={() => void openWork(s.workKey)}
                    className="shrink-0 w-28 sm:w-32 snap-start text-left group cursor-pointer"
                  >
                    <Cover
                      id={s.coverId}
                      title={s.title}
                      size="md"
                      isbn={s.isbn}
                      className="!w-28 !h-[10.5rem] sm:!w-32 sm:!h-48"
                    />
                    <p
                      className="mt-3 text-sm line-clamp-2 leading-snug group-hover:text-[color:var(--bk-accent)] transition-colors"
                      style={mark}
                    >
                      {s.title}
                    </p>
                    <p className="text-[11px] text-[color:var(--bk-mute)] truncate mt-1">
                      {s.authors[0]}
                    </p>
                  </button>
                ))}
          </div>
        </section>
      )}

      {/* Mobile share */}
      {book && !loadingBook && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:hidden">
          <button
            type="button"
            onClick={() => void shareBook()}
            className="w-full h-12 border border-[color:var(--bk-line)] bg-[color:var(--bk-bg)]/95 backdrop-blur-xl shadow-2xl text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            style={mono}
          >
            <Share2 className="size-4" />
            {shared ? 'Link copied' : 'Share this book'}
          </button>
        </div>
      )}
    </div>
  )
}
