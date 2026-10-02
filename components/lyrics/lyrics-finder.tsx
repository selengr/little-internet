'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Search, X } from 'lucide-react'
import { LyricsReader, themeOf } from '@/components/lyrics/lyrics-reader'
import type { LyricsResult, LyricsSearch, SongHit } from '@/types/lyrics'
import { FEATURED_LYRICS, formatDuration, loadRecent, parseLyrics, saveRecent } from '@/lib/lyrics'
import { cn } from '@/lib/utils'

const mono = { fontFamily: 'var(--font-ly-mono), ui-monospace, monospace' } as const
const mark = { fontFamily: 'var(--font-ly-mark), system-ui, sans-serif' } as const

const CSS = `
  .ly-root {
    --ly-bg: #f6f3f8; --ly-fg: #16121c; --ly-mute: rgba(22,18,28,.56); --ly-line: rgba(22,18,28,.14);
    --ly-card: #fcfaff;
  }
  :is(html.dark, .dark) .ly-root {
    --ly-bg: #0d0b11; --ly-fg: rgba(255,255,255,.93); --ly-mute: rgba(255,255,255,.52); --ly-line: rgba(255,255,255,.14);
    --ly-card: #15121b;
  }
  .ly-outline { -webkit-text-stroke: 2px var(--ly-fg); color: transparent; }
`

/** "Yellow Coldplay" can't be split reliably, but "Coldplay - Yellow" and "Yellow by Coldplay" can. */
function parseManual(q: string): LyricsSearch | null {
  const dash = q.split(/\s+[-–—]\s+/)
  if (dash.length === 2) return { artist: dash[0].trim(), title: dash[1].trim() }
  const by = q.split(/\s+by\s+/i)
  if (by.length === 2) return { artist: by[1].trim(), title: by[0].trim() }
  return null
}

export function LyricsFinder() {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SongHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [hitsLoading, setHitsLoading] = useState(false)
  const [song, setSong] = useState<LyricsSearch | null>(null)
  const [result, setResult] = useState<LyricsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [recent, setRecent] = useState<LyricsSearch[]>([])
  const suppress = useRef(false)
  const requestId = useRef(0)
  const boxRef = useRef<HTMLDivElement>(null)

  const theme = useMemo(() => themeOf(song?.artist ?? 'Coldplay', song?.title ?? 'Yellow'), [song])

  const fetchLyrics = useCallback(async (s: LyricsSearch) => {
    const id = ++requestId.current
    setSong(s)
    setLoading(true)
    setError(null)
    setHint(null)
    // Quick picks and old "recent" entries have no album art yet: fetch it alongside the lyrics.
    if (!s.cover) {
      void fetch(`/api/lyrics/search?q=${encodeURIComponent(`${s.title} ${s.artist}`)}`)
        .then(r => r.json() as Promise<{ hits: SongHit[] }>)
        .then(({ hits: found }) => {
          const m = found.find(h => h.artist.toLowerCase() === s.artist.toLowerCase()) ?? found[0]
          if (m && id === requestId.current) setSong(cur => (cur ? { ...cur, cover: m.cover, coverBig: m.coverBig, duration: m.duration } : cur))
        })
        .catch(() => {})
    }
    try {
      const params = new URLSearchParams({ artist: s.artist, title: s.title })
      const res = await fetch(`/api/lyrics?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (id !== requestId.current) return // a newer search replaced this one
      if (!res.ok) throw new Error(json.error ?? 'Could not load lyrics.')
      setResult(parseLyrics(s.artist, s.title, json.lyrics))
      setRecent(saveRecent(s))
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('artist', s.artist)
        url.searchParams.set('title', s.title)
        window.history.replaceState(null, '', url)
      } catch {}
    } catch (err) {
      if (id !== requestId.current) return
      setError(err instanceof Error ? err.message : 'Lyrics not found.')
      setResult(null)
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [])

  const choose = useCallback(
    (h: LyricsSearch) => {
      suppress.current = true
      setQuery(`${h.title} · ${h.artist}`)
      setOpen(false)
      setActive(-1)
      void fetchLyrics(h)
    },
    [fetchLyrics],
  )

  // First visit: a song from the link if there is one, otherwise a well-known default with its cover.
  useEffect(() => {
    setRecent(loadRecent())
    const params = new URLSearchParams(window.location.search)
    const a = params.get('artist')
    const t = params.get('title')
    if (a && t) {
      suppress.current = true
      setQuery(`${t} · ${a}`)
      void fetchLyrics({ artist: a, title: t })
      return
    }
    void (async () => {
      let first: SongHit | undefined
      try {
        const res = await fetch('/api/lyrics/search?q=Yellow%20Coldplay')
        first = ((await res.json()) as { hits: SongHit[] }).hits[0]
      } catch {}
      void fetchLyrics(first ?? { artist: 'Coldplay', title: 'Yellow' })
    })()
  }, [fetchLyrics])

  // Suggestions while typing.
  useEffect(() => {
    if (suppress.current) {
      suppress.current = false
      return
    }
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setHitsLoading(false)
      return
    }
    setHitsLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lyrics/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        const json = (await res.json()) as { hits: SongHit[] }
        setHits(json.hits ?? [])
        setActive(-1)
        setOpen(true)
      } catch {
        /* aborted or offline: keep what is shown */
      } finally {
        if (!ctrl.signal.aborted) setHitsLoading(false)
      }
    }, 260)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  // Close the list when clicking elsewhere.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const submit = () => {
    const q = query.trim()
    if (!q) return
    if (active >= 0 && hits[active]) return choose(hits[active])
    const manual = parseManual(q)
    if (manual) return choose(manual)
    if (hits[0]) return choose(hits[0])
    setHint('Try “Song name Artist”, then pick the match from the list.')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(a => Math.min(hits.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(-1, a - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && query.trim().length >= 2 && (hits.length > 0 || hitsLoading)

  return (
    <div className="ly-root relative">
      <style>{CSS}</style>

      <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        {/* Masthead */}
        <header className="relative text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--ly-mute)]" style={mono}>
            Read the song, line by line
          </p>
          <h1
            className="mt-4 text-[clamp(3rem,15vw,8.5rem)] font-extrabold uppercase leading-[0.84] tracking-[-0.04em]"
            style={mark}
          >
            <span className="whitespace-nowrap">
              <span className="ly-outline">Lyr</span>ics
              <span
                aria-hidden
                className="ml-[0.05em] inline-block size-[0.14em] rounded-full"
                style={{ background: theme.b, transition: 'background .8s' }}
              />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[var(--ly-mute)]">
            Search any song and read it in big, calm type. Turn on Word help and tap any word to learn what it means.
          </p>
        </header>

        {/* Search */}
        <div ref={boxRef} className="relative z-30 mx-auto mt-9 max-w-2xl">
          <form
            onSubmit={e => {
              e.preventDefault()
              submit()
            }}
            role="search"
          >
            <div className="group/search relative flex items-center rounded-full border border-[var(--ly-line)] bg-[var(--ly-card)] pl-5 pr-2 shadow-[0_18px_40px_-26px_rgba(0,0,0,0.35)] transition-[border-color,box-shadow] focus-within:shadow-[0_18px_44px_-22px_var(--ring)]"
              style={{ ['--ring' as string]: theme.b }}
            >
              <Search className="size-5 shrink-0 text-[var(--ly-mute)]" aria-hidden />
              <input
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setHint(null)
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder="Song name and artist, like “Yellow Coldplay”"
                className="h-14 min-w-0 flex-1 bg-transparent px-3 text-[16px] outline-none placeholder:text-[var(--ly-mute)]"
                role="combobox"
                aria-expanded={showList}
                aria-controls="lyrics-suggestions"
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? `lyrics-opt-${active}` : undefined}
                autoComplete="off"
                spellCheck={false}
                aria-label="Search for a song"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setHits([])
                  }}
                  aria-label="Clear"
                  className="grid size-9 place-items-center rounded-full text-[var(--ly-mute)] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                >
                  <X className="size-4" />
                </button>
              ) : null}
              <button
                type="submit"
                disabled={!query.trim()}
                className="ml-1 inline-flex h-10 items-center gap-2 rounded-full px-5 text-[13px] font-medium text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
                style={{ ...mono, background: `linear-gradient(90deg, ${theme.b}, ${theme.a})`, transition: 'background .8s, filter .2s, transform .2s' }}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                Find
              </button>
            </div>
          </form>

          <AnimatePresence>
            {showList && (
              <motion.ul
                id="lyrics-suggestions"
                role="listbox"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-x-0 top-[calc(100%+8px)] overflow-hidden rounded-3xl border border-[var(--ly-line)] bg-[var(--ly-card)] p-2 shadow-2xl"
              >
                {hits.length === 0 && hitsLoading ? (
                  <li className="flex items-center gap-2 px-4 py-3 text-[13px] text-[var(--ly-mute)]">
                    <Loader2 className="size-4 animate-spin" /> Searching…
                  </li>
                ) : (
                  hits.map((h, i) => (
                    <li key={h.id} role="option" id={`lyrics-opt-${i}`} aria-selected={i === active}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(h)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                          i === active ? 'bg-black/[0.05] dark:bg-white/[0.07]' : '',
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={h.cover} alt="" className="size-11 shrink-0 rounded-lg bg-black/10 object-cover" referrerPolicy="no-referrer" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">{h.title}</span>
                          <span className="block truncate text-[12px] text-[var(--ly-mute)]">{h.artist}</span>
                        </span>
                        <span className="text-[11px] tabular-nums text-[var(--ly-mute)]" style={mono}>
                          {formatDuration(h.duration)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </motion.ul>
            )}
          </AnimatePresence>

          {hint ? (
            <p className="mt-3 text-center text-[13px] text-[var(--ly-mute)]" role="status">
              {hint}
            </p>
          ) : null}
        </div>

        {/* Quick picks and recent */}
        <div className="mx-auto mt-6 max-w-3xl space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURED_LYRICS.map(s => (
              <button
                key={`${s.artist}-${s.title}`}
                type="button"
                onClick={() => choose(s)}
                className="rounded-full border border-[var(--ly-line)] bg-[var(--ly-card)] px-3.5 py-1.5 text-[12px] text-[var(--ly-fg)]/80 transition-all hover:-translate-y-0.5 hover:border-[var(--ly-fg)]/30"
              >
                {s.title} <span className="text-[var(--ly-mute)]">· {s.artist}</span>
              </button>
            ))}
          </div>
          {recent.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--ly-mute)]" style={mono}>
                Recent
              </span>
              {recent.map(r => (
                <button
                  key={`${r.artist}-${r.title}`}
                  type="button"
                  onClick={() => choose(r)}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--ly-line)] py-1 pl-1 pr-3 text-[12px] text-[var(--ly-mute)] transition-colors hover:text-[var(--ly-fg)]"
                >
                  {r.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.cover} alt="" className="size-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="size-5 rounded-full" style={{ background: themeOf(r.artist, r.title).b }} />
                  )}
                  {r.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reader */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-12"
        >
          <LyricsReader song={song} result={result} loading={loading} error={error} theme={theme} />
        </motion.div>
      </div>
    </div>
  )
}
