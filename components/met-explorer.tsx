'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Command, Maximize2, Search, X } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { GlowFrame } from '@/components/glow-frame'
import type { Artwork } from '@/types/met'
import { FEATURED_SEARCHES, OPENING_QUERY, loadRecent, saveRecent } from '@/lib/met'
import { cn } from '@/lib/utils'

const display = { fontFamily: 'var(--font-art-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-art-mono), ui-monospace, monospace' } as const
const mark = { fontFamily: 'var(--font-art-mark), system-ui, sans-serif' } as const

const GOLD_A = '#f1cf8a'
const GOLD_B = '#b8842f'

const CSS = `
  .art-root {
    --art-fg: #1b1713; --art-mute: rgba(27,23,19,.58); --art-line: rgba(27,23,19,.14);
    --art-card: #fbf8f2; --art-mat: #ece4d4;
  }
  :is(html.dark, .dark) .art-root {
    --art-fg: rgba(255,244,225,.93); --art-mute: rgba(255,244,225,.52); --art-line: rgba(255,244,225,.14);
    --art-card: #1a1613; --art-mat: #0e0c0a;
  }
  .art-outline { -webkit-text-stroke: 2px var(--art-fg); color: transparent; }
  @keyframes art-frame { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
  @media (prefers-reduced-motion: reduce) { .art-hang { animation: none !important } }
`

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 border-b border-[var(--art-line)] py-3 last:border-0">
      <dt className="pt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--art-mute)]" style={mono}>
        {label}
      </dt>
      <dd className="text-[15px] leading-snug">{value}</dd>
    </div>
  )
}

/** While a search runs: an empty frame on the wall, softly lit. */
function HangingGallery() {
  return (
    <div role="status" className="flex min-h-[420px] flex-col items-center justify-center gap-6">
      <div
        className="art-hang relative h-40 w-32 border-[10px] border-double"
        style={{ borderColor: GOLD_B, animation: 'art-frame 1.8s ease-in-out infinite' }}
        aria-hidden
      >
        <span className="absolute inset-2 bg-[var(--art-mat)]" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--art-mute)]" style={mono}>
        Hanging the gallery…
      </p>
    </div>
  )
}

export function MetExplorer() {
  const [query, setQuery] = useState('')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [index, setIndex] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [zoom, setZoom] = useState(false)

  const [suggestions, setSuggestions] = useState<Artwork[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [activeSuggest, setActiveSuggest] = useState(-1)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])

  const wrapRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestId = useRef(0)

  const active = artworks[index] ?? null

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim()
    if (!term) return
    const id = ++requestId.current

    setLoading(true)
    setError(null)
    setImgLoaded(false)
    setShowSuggest(false)
    setQuery(term)
    setRecent(saveRecent(term))

    try {
      const params = new URLSearchParams({ action: 'search', q: term, limit: '14' })
      const res = await fetch(`/api/met?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (id !== requestId.current) return
      if (!res.ok) throw new Error(json.error ?? 'Search failed')

      const list: Artwork[] = json.artworks ?? []
      setArtworks(list)
      setIndex(0)
      setTotal(json.total ?? list.length)
      if (list.length === 0) setError('No artworks with a public image found. Try another keyword.')
    } catch (err) {
      if (id !== requestId.current) return
      setError(err instanceof Error ? err.message : 'Could not reach the collection.')
      setArtworks([])
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  const go = useCallback(
    (to: number) => {
      if (!artworks.length) return
      const next = (to + artworks.length) % artworks.length
      setIndex(next)
      setImgLoaded(false)
      stripRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    },
    [artworks.length],
  )

  useEffect(() => {
    setRecent(loadRecent())
    void runSearch(OPENING_QUERY)
  }, [runSearch])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSuggest(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        wrapRef.current?.querySelector('input')?.focus()
        setShowSuggest(true)
      } else if (!typing && !zoom && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === 'ArrowRight') go(index + 1)
        else if (e.key === 'ArrowLeft') go(index - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index, zoom])

  const fetchSuggest = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setSuggestLoading(false)
      return
    }
    setSuggestLoading(true)
    try {
      const res = await fetch(`/api/met?action=suggest&q=${encodeURIComponent(q)}&limit=6`, { cache: 'no-store' })
      const json = await res.json()
      setSuggestions(json.artworks ?? [])
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
    suggestTimer.current = setTimeout(() => void fetchSuggest(val), 350)
  }

  const pickSuggestion = (s: Artwork) => {
    requestId.current++ // a pick replaces any search still running
    setArtworks(prev => [s, ...prev.filter(a => a.id !== s.id)])
    setIndex(0)
    setImgLoaded(false)
    setShowSuggest(false)
    setLoading(false)
    setError(null)
    setRecent(saveRecent(s.artist !== 'Unknown artist' ? s.artist : s.title))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const open = showSuggest && suggestions.length > 0
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && activeSuggest >= 0) pickSuggestion(suggestions[activeSuggest])
      else void runSearch(query)
    } else if (open && e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggest(i => Math.min(i + 1, suggestions.length - 1))
    } else if (open && e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggest(i => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
    }
  }

  const citation = active
    ? `${active.title}${active.artist !== 'Unknown artist' ? `, ${active.artist}` : ''}${active.year ? ` (${active.year})` : ''}.`
    : ''

  return (
    <div className="art-root">
      <style>{CSS}</style>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* Masthead */}
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--art-mute)]" style={mono}>
            Open Access collection · half a million works
          </p>
          <h1
            className="mt-4 text-[clamp(3.4rem,17vw,10rem)] font-extrabold uppercase leading-[0.84] tracking-[-0.04em]"
            style={mark}
          >
            <span className="whitespace-nowrap">
              <span className="art-outline">Ar</span>t
              <span aria-hidden className="ml-[0.05em] inline-block size-[0.14em] rounded-full" style={{ background: GOLD_B }} />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[var(--art-mute)]">
            Search paintings, sculpture and more, and look at each work properly: big, quiet and close up.
          </p>
        </header>

        {/* Search */}
        <div ref={wrapRef} className="relative z-30 mx-auto mt-9 max-w-2xl">
          <div className="flex items-center rounded-full border border-[var(--art-line)] bg-[var(--art-card)] pl-5 pr-2 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.35)] transition-shadow focus-within:shadow-[0_18px_44px_-22px_#b8842f]">
            <Search className="size-5 shrink-0 text-[var(--art-mute)]" aria-hidden />
            <input
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setShowSuggest(true)}
              placeholder="An artist, a title, a subject…"
              className="h-14 min-w-0 flex-1 bg-transparent px-3 text-[16px] outline-none placeholder:text-[var(--art-mute)]"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search the collection"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSuggestions([])
                  setShowSuggest(true)
                }}
                aria-label="Clear"
                className="grid size-9 place-items-center rounded-full text-[var(--art-mute)] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="mr-2 hidden items-center gap-1 rounded-md border border-[var(--art-line)] px-2 py-1 text-[10px] text-[var(--art-mute)] sm:inline-flex" style={mono}>
                <Command className="size-2.5" />K
              </kbd>
            )}
            <button
              type="button"
              onClick={() => void runSearch(query)}
              disabled={loading || !query.trim()}
              className="ml-1 inline-flex h-10 items-center rounded-full px-5 text-[13px] font-medium text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
              style={{ ...mono, background: `linear-gradient(90deg, ${GOLD_B}, #d9a74f)` }}
            >
              Search
            </button>
          </div>

          <AnimatePresence>
            {showSuggest && query.trim().length >= 2 && (suggestions.length > 0 || suggestLoading) && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                role="listbox"
                className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-3xl border border-[var(--art-line)] bg-[var(--art-card)] p-2 shadow-2xl"
              >
                {suggestions.length === 0 ? (
                  <li className="px-4 py-3 text-[13px] text-[var(--art-mute)]">Searching…</li>
                ) : (
                  suggestions.map((s, i) => (
                    <li key={s.id} role="option" aria-selected={i === activeSuggest}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveSuggest(i)}
                        onMouseDown={() => pickSuggestion(s)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                          i === activeSuggest && 'bg-black/[0.05] dark:bg-white/[0.07]',
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.image} alt="" className="size-12 shrink-0 rounded-lg bg-black/10 object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{s.title}</span>
                          <span className="block truncate text-[12px] text-[var(--art-mute)]">
                            {s.artist}
                            {s.year ? ` · ${s.year}` : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Quick picks and recent */}
        <div className="mx-auto mt-6 max-w-3xl space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURED_SEARCHES.map(s => {
              const on = query.toLowerCase() === s.toLowerCase()
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => void runSearch(s)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[12px] transition-all hover:-translate-y-0.5',
                    on
                      ? 'border-transparent text-white'
                      : 'border-[var(--art-line)] bg-[var(--art-card)] text-[var(--art-fg)]/80 hover:border-[var(--art-fg)]/30',
                  )}
                  style={on ? { background: GOLD_B } : undefined}
                >
                  {s}
                </button>
              )
            })}
          </div>
          {recent.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--art-mute)]" style={mono}>
                Recent
              </span>
              {recent.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => void runSearch(r)}
                  className="rounded-full border border-dashed border-[var(--art-line)] px-3 py-1 text-[12px] text-[var(--art-mute)] transition-colors hover:text-[var(--art-fg)]"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Viewer */}
        <section
          aria-label="Artwork"
          onPointerMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
            e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
          }}
          className="relative isolate mt-12 overflow-hidden rounded-[2rem] border border-[var(--art-line)] bg-[var(--art-card)]"
        >
          <GlowFrame a={GOLD_A} b={GOLD_B} plate="bg-[var(--art-card)]" radius="1.7rem" />

          <div className="p-5 sm:p-8 lg:p-10">
            {error && !loading && (
              <div className="mx-auto flex min-h-[320px] max-w-md flex-col items-center justify-center text-center">
                <p className="text-[1.8rem] leading-tight" style={display}>
                  Nothing on the wall.
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-[var(--art-mute)]">{error}</p>
              </div>
            )}

            {loading && <HangingGallery />}

            {!loading && !error && active && (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => setZoom(true)}
                      aria-label={`Look closer at ${active.title}`}
                      className="group relative flex min-h-[320px] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl bg-[var(--art-mat)] p-5 sm:min-h-[420px] sm:p-8 lg:min-h-[520px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={active.imageLarge || active.image}
                        alt={active.title}
                        onLoad={() => setImgLoaded(true)}
                        className={cn(
                          'max-h-[64vh] w-auto max-w-full object-contain shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] transition-opacity duration-700',
                          imgLoaded ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-white/25 bg-black/45 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                        <Maximize2 className="size-4" />
                      </span>
                    </button>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1" style={mono}>
                        <button
                          type="button"
                          onClick={() => go(index - 1)}
                          disabled={artworks.length < 2}
                          aria-label="Previous work"
                          className="grid size-10 place-items-center rounded-full border border-[var(--art-line)] transition-all hover:-translate-y-0.5 hover:bg-black/[0.04] disabled:opacity-30 dark:hover:bg-white/[0.06]"
                        >
                          <ChevronLeft className="size-4" />
                        </button>
                        <span className="min-w-[4.5rem] text-center text-[12px] tabular-nums text-[var(--art-mute)]">
                          {index + 1} / {artworks.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => go(index + 1)}
                          disabled={artworks.length < 2}
                          aria-label="Next work"
                          className="grid size-10 place-items-center rounded-full border border-[var(--art-line)] transition-all hover:-translate-y-0.5 hover:bg-black/[0.04] disabled:opacity-30 dark:hover:bg-white/[0.06]"
                        >
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                      <p className="hidden text-[11px] text-[var(--art-mute)] sm:block" style={mono}>
                        Use ← → to browse · click the work to look closer
                      </p>
                    </div>
                  </div>

                  <div className="lg:pt-2">
                    {active.isHighlight && (
                      <span
                        className="mb-4 inline-flex items-center rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-white"
                        style={{ ...mono, background: GOLD_B }}
                      >
                        Museum highlight
                      </span>
                    )}
                    <h2 className="text-[clamp(1.9rem,4vw,3rem)] leading-[1.05] tracking-tight" style={display}>
                      {active.title}
                    </h2>
                    <p className="mt-2 text-[1.2rem] italic" style={{ ...display, color: GOLD_B }}>
                      {active.artist}
                      {active.year ? <span className="not-italic text-[var(--art-mute)]"> · {active.year}</span> : null}
                    </p>
                    {active.artistBio ? (
                      <p className="mt-1 text-[12px] text-[var(--art-mute)]" style={mono}>
                        {active.artistBio}
                      </p>
                    ) : null}

                    <dl className="mt-7">
                      <MetaRow label="Medium" value={active.medium} />
                      <MetaRow label="Origin" value={active.country} />
                      <MetaRow label="Kind" value={active.style} />
                      <MetaRow label="Department" value={active.department} />
                      <MetaRow label="Credit" value={active.creditLine} />
                    </dl>

                    {active.tags.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {active.tags.slice(0, 6).map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => void runSearch(t)}
                            className="rounded-full border border-[var(--art-line)] px-3 py-1 text-[12px] text-[var(--art-mute)] transition-colors hover:text-[var(--art-fg)]"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <CopyButton text={citation} label="Copy citation" lineVar="var(--art-line)" className="!h-11 !w-auto px-5 text-[12px]" style={mono} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Thumbnails */}
        {!loading && artworks.length > 1 && (
          <div className="mt-8">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--art-mute)]" style={mono}>
              {total > artworks.length ? `${artworks.length} of ${total.toLocaleString()} works` : `${artworks.length} works`}
            </p>
            <div ref={stripRef} className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {artworks.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={a.title}
                  aria-current={i === index}
                  className={cn(
                    'relative h-24 w-20 shrink-0 snap-start overflow-hidden rounded-xl transition-all duration-300 sm:h-28 sm:w-24',
                    i === index ? 'opacity-100 ring-2' : 'opacity-55 hover:opacity-100',
                  )}
                  style={i === index ? { ['--tw-ring-color' as string]: GOLD_B } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.image} alt="" className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Look closer */}
      <DialogPrimitive.Root open={zoom} onOpenChange={setZoom}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[190] bg-black/85 backdrop-blur-sm" />
          <DialogPrimitive.Content aria-describedby={undefined} className="fixed inset-0 z-[200] flex flex-col outline-none">
            <DialogPrimitive.Title className="sr-only">{active?.title ?? 'Artwork'}</DialogPrimitive.Title>
            <div className="flex items-center justify-between gap-3 px-5 py-4 text-white">
              <p className="min-w-0 truncate text-[13px]" style={mono}>
                {active?.title}
                {active?.artist && active.artist !== 'Unknown artist' ? ` · ${active.artist}` : ''}
              </p>
              <DialogPrimitive.Close
                aria-label="Close"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 transition-colors hover:bg-white/20"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-4 pb-6" onClick={() => setZoom(false)}>
              {active && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.imageLarge || active.image}
                  alt={active.title}
                  className="mx-auto max-h-full w-auto max-w-full object-contain"
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  )
}
