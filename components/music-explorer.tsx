'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  Command,
  Play,
  Pause,
  ExternalLink,
  Disc3,
  Users,
  Sparkles,
} from 'lucide-react'
import { Fraunces, Outfit } from 'next/font/google'
import type {
  MusicAlbumView,
  MusicArtistView,
  MusicExplorerPayload,
  MusicPlaylistView,
  MusicTrackView,
} from '@/types/spotify'
import { FEATURED_ARTISTS, formatDuration, formatFollowers } from '@/lib/spotify-format'
import { cn } from '@/lib/utils'

const display = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-music-display',
})

const ui = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-music-ui',
})

const RECENT_KEY = 'music-explorer-recent'

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

function Cover({
  src,
  alt,
  className,
}: {
  src: string | null
  alt: string
  className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden bg-stone-800/40', className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Disc3 className="size-8 text-white/20" />
        </div>
      )}
    </div>
  )
}

export function MusicExplorer() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<MusicExplorerPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [suggestions, setSuggestions] = useState<MusicArtistView[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [activeSuggest, setActiveSuggest] = useState(-1)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])

  const [playingId, setPlayingId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadArtist = useCallback(async (opts: { q?: string; id?: string }) => {
    setLoading(true)
    setError(null)
    setShowSuggest(false)
    try {
      const params = new URLSearchParams({ action: 'artist' })
      if (opts.id) params.set('id', opts.id)
      else if (opts.q) params.set('q', opts.q)

      const res = await fetch(`/api/spotify?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load artist')

      setData(json as MusicExplorerPayload)
      if (opts.q) {
        setQuery(opts.q)
        setRecent(saveRecent(opts.q))
      } else if (json.artist?.name) {
        setQuery(json.artist.name)
        setRecent(saveRecent(json.artist.name))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the music service')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setRecent(loadRecent())
    void loadArtist({ q: 'Imagine Dragons' })
  }, [loadArtist])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSuggest(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        wrapRef.current?.querySelector('input')?.focus()
        setShowSuggest(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const fetchSuggest = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setSuggestLoading(false)
      return
    }
    setSuggestLoading(true)
    try {
      const res = await fetch(
        `/api/spotify?action=suggest&q=${encodeURIComponent(q)}`,
        { cache: 'no-store' },
      )
      const json = await res.json()
      setSuggestions(json.artists ?? [])
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
      if (e.key === 'Enter') void loadArtist({ q: query })
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
      if (activeSuggest >= 0) void loadArtist({ id: suggestions[activeSuggest].id })
      else void loadArtist({ q: query })
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
    }
  }

  const togglePreview = async (track: MusicTrackView) => {
    if (!track.previewUrl) {
      window.open(track.url, '_blank', 'noopener,noreferrer')
      return
    }

    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      setProgress(0)
      return
    }

    audioRef.current?.pause()
    const audio = new Audio(track.previewUrl)
    audioRef.current = audio
    setPlayingId(track.id)
    setProgress(0)

    audio.ontimeupdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    audio.onended = () => {
      setPlayingId(null)
      setProgress(0)
    }
    try {
      await audio.play()
    } catch {
      setPlayingId(null)
    }
  }

  const artist = data?.artist
  const nowPlaying = data?.topTracks.find(t => t.id === playingId) ?? null

  return (
    <div className={cn(display.variable, ui.variable, 'relative min-h-[calc(100vh-5rem)]')}>
      {/* Immersive artist atmosphere — not a brand green */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {artist?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={artist.id}
            src={artist.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-110 opacity-40 dark:opacity-30 blur-2xl saturate-150 transition-opacity duration-700"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f3efe8]/85 via-[#f3efe8]/92 to-[#ebe4d8] dark:from-[#0c0b0a]/88 dark:via-[#0c0b0a]/94 dark:to-[#080706]" />
        <div className="absolute top-0 inset-x-0 h-[45vh] bg-gradient-to-b from-black/25 to-transparent dark:from-black/50" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-36">
        {/* Search */}
        <section className="relative z-50 mb-10 md:mb-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-[family-name:var(--font-music-ui)] text-[10px] uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400"
            >
              Listening room
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-3 font-[family-name:var(--font-music-display)] text-[clamp(2.6rem,7vw,4.5rem)] font-light leading-[0.95] tracking-tight text-stone-900 dark:text-stone-50"
            >
              Find the sound
              <span className="block mt-1 italic font-normal text-stone-500 dark:text-stone-400">
                that stays with you
              </span>
            </motion.h1>
          </div>

          <div ref={wrapRef} className="relative max-w-xl mx-auto">
            <div
              className={cn(
                'relative flex items-center gap-3 rounded-2xl border bg-white/85 dark:bg-stone-950/85 backdrop-blur-xl',
                'border-stone-200/80 dark:border-stone-800',
                'shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_20px_50px_-20px_rgba(0,0,0,0.3)]',
                showSuggest && 'ring-1 ring-stone-400/25',
              )}
            >
              <Search className="ml-4 size-4 text-stone-400 shrink-0" />
              <input
                value={query}
                onChange={e => onQueryChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setShowSuggest(true)}
                placeholder="Artist name…"
                className="flex-1 h-14 bg-transparent font-[family-name:var(--font-music-ui)] text-[15px] outline-none placeholder:text-stone-400/80 text-stone-900 dark:text-stone-50"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSuggestions([])
                    setShowSuggest(true)
                  }}
                  className="size-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Clear"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-1 mr-2 px-2 py-1 rounded-md border border-stone-200 dark:border-stone-700 text-[10px] text-stone-400 font-mono">
                  <Command className="size-2.5" />
                  K
                </kbd>
              )}
              <button
                type="button"
                onClick={() => void loadArtist({ q: query })}
                disabled={loading || !query.trim()}
                className="m-1.5 h-11 px-5 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-medium font-[family-name:var(--font-music-ui)] hover:opacity-90 transition-opacity cursor-pointer shrink-0 disabled:opacity-40"
              >
                Search
              </button>
            </div>

            <AnimatePresence>
              {showSuggest && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-[calc(100%+10px)] z-[60] overflow-hidden rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-950 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.45)]"
                >
                  {suggestLoading && (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-900" />
                      ))}
                    </div>
                  )}

                  {!suggestLoading && query.trim().length >= 2 && suggestions.length > 0 && (
                    <ul className="max-h-[min(22rem,50vh)] overflow-y-auto p-1.5">
                      {suggestions.map((s, i) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveSuggest(i)}
                            onMouseDown={() => void loadArtist({ id: s.id })}
                            className={cn(
                              'w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer',
                              i === activeSuggest
                                ? 'bg-stone-100 dark:bg-stone-900'
                                : 'hover:bg-stone-50 dark:hover:bg-stone-900/60',
                            )}
                          >
                            <Cover src={s.image} alt="" className="size-12 rounded-full" />
                            <div className="min-w-0 flex-1 font-[family-name:var(--font-music-ui)]">
                              <p className="text-sm font-medium truncate text-stone-900 dark:text-stone-100">
                                {s.name}
                              </p>
                              <p className="text-xs text-stone-500 truncate mt-0.5">
                                {formatFollowers(s.followers)} followers
                                {s.genres[0] ? ` · ${s.genres[0]}` : ''}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!suggestLoading && query.trim().length < 2 && (
                    <div className="p-4 space-y-5 font-[family-name:var(--font-music-ui)]">
                      {recent.length > 0 && (
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400 mb-2.5">
                            Recent
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {recent.map(r => (
                              <button
                                key={r}
                                type="button"
                                onMouseDown={() => void loadArtist({ q: r })}
                                className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400 mb-2.5">
                          Try
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {FEATURED_ARTISTS.map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseDown={() => void loadArtist({ q: s })}
                              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {error && (
          <div className="mx-auto mb-10 max-w-lg rounded-2xl border border-rose-900/10 dark:border-rose-200/10 bg-rose-50/80 dark:bg-rose-950/40 px-6 py-5 text-center backdrop-blur-sm">
            <p className="font-[family-name:var(--font-music-display)] text-xl font-light text-rose-900/80 dark:text-rose-100/80">
              Listening room paused
            </p>
            <p className="mt-2 font-[family-name:var(--font-music-ui)] text-sm leading-relaxed text-rose-800/70 dark:text-rose-200/60">
              {error}
            </p>
          </div>
        )}

        {loading && !artist && (
          <div className="flex justify-center py-24">
            <Disc3 className="size-8 animate-spin text-stone-400" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {artist && (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Artist hero */}
              <section className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 items-end mb-14">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="relative mx-auto lg:mx-0 w-56 sm:w-64 lg:w-full"
                >
                  <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-400/20 via-transparent to-rose-400/15 blur-2xl" />
                  <Cover
                    src={artist.image}
                    alt={artist.name}
                    className="relative aspect-square rounded-[1.75rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
                  />
                </motion.div>

                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 font-[family-name:var(--font-music-ui)] text-[10px] uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
                    <Sparkles className="size-3" />
                    Artist
                  </div>
                  <h2 className="mt-3 font-[family-name:var(--font-music-display)] text-[clamp(2.5rem,6vw,4.25rem)] font-light leading-[0.95] tracking-tight text-stone-900 dark:text-stone-50">
                    {artist.name}
                  </h2>

                  <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 font-[family-name:var(--font-music-ui)] text-sm text-stone-600 dark:text-stone-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5 opacity-60" />
                      {formatFollowers(artist.followers)} followers
                    </span>
                    <span className="text-stone-300 dark:text-stone-600">·</span>
                    <span>Popularity {artist.popularity}</span>
                  </div>

                  {artist.genres.length > 0 && (
                    <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-2">
                      {artist.genres.slice(0, 5).map(g => (
                        <span
                          key={g}
                          className="px-3 py-1 rounded-full border border-stone-900/8 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] font-[family-name:var(--font-music-ui)] text-[11px] text-stone-600 dark:text-stone-300 tracking-wide"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  <a
                    href={artist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 font-[family-name:var(--font-music-ui)] text-[11px] uppercase tracking-[0.16em] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  >
                    Open on Deezer
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </section>

              {/* Top tracks */}
              <section className="mb-14">
                <SectionLabel>Top songs</SectionLabel>
                <div className="mt-5 space-y-1">
                  {(data?.topTracks ?? []).map((track, i) => {
                    const isPlaying = playingId === track.id
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => void togglePreview(track)}
                        className={cn(
                          'group w-full flex items-center gap-4 rounded-2xl px-3 py-3 text-left transition-all duration-300 cursor-pointer',
                          isPlaying
                            ? 'bg-stone-900/90 dark:bg-stone-100 text-stone-50 dark:text-stone-900'
                            : 'hover:bg-white/50 dark:hover:bg-white/[0.04]',
                        )}
                      >
                        <span
                          className={cn(
                            'w-6 text-center font-[family-name:var(--font-music-ui)] text-xs tabular-nums',
                            isPlaying ? 'opacity-70' : 'text-stone-400',
                          )}
                        >
                          {isPlaying ? (
                            <Pause className="size-3.5 mx-auto" />
                          ) : (
                            <span className="group-hover:hidden">{i + 1}</span>
                          )}
                          {!isPlaying && <Play className="size-3.5 mx-auto hidden group-hover:block" />}
                        </span>

                        <Cover
                          src={track.albumImage}
                          alt=""
                          className="size-12 rounded-lg shrink-0 shadow-md"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-[family-name:var(--font-music-ui)] text-sm font-medium truncate">
                            {track.name}
                          </p>
                          <p
                            className={cn(
                              'text-xs truncate mt-0.5',
                              isPlaying ? 'opacity-60' : 'text-stone-500',
                            )}
                          >
                            {track.albumName}
                            {!track.previewUrl ? ' · open on Deezer' : ' · 30s preview'}
                          </p>
                          {isPlaying && (
                            <div className="mt-2 h-0.5 rounded-full bg-white/20 dark:bg-stone-900/20 overflow-hidden">
                              <div
                                className="h-full bg-current transition-[width] duration-200"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <span
                          className={cn(
                            'font-[family-name:var(--font-music-ui)] text-xs tabular-nums shrink-0',
                            isPlaying ? 'opacity-60' : 'text-stone-400',
                          )}
                        >
                          {formatDuration(track.durationMs)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Albums */}
              {(data?.albums.length ?? 0) > 0 && (
                <section className="mb-14">
                  <SectionLabel>Albums & singles</SectionLabel>
                  <div className="mt-5 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                    {data!.albums.map(album => (
                      <AlbumCard key={album.id} album={album} />
                    ))}
                  </div>
                </section>
              )}

              {/* Similar */}
              {(data?.similar.length ?? 0) > 0 && (
                <section className="mb-14">
                  <SectionLabel>Similar artists</SectionLabel>
                  <div className="mt-5 flex gap-5 overflow-x-auto pb-2">
                    {data!.similar.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => void loadArtist({ id: a.id })}
                        className="group shrink-0 w-28 text-center cursor-pointer"
                      >
                        <Cover
                          src={a.image}
                          alt={a.name}
                          className="mx-auto size-28 rounded-full ring-1 ring-stone-900/5 dark:ring-white/10 shadow-lg transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <p className="mt-3 font-[family-name:var(--font-music-ui)] text-sm font-medium truncate text-stone-800 dark:text-stone-100">
                          {a.name}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate">
                          {formatFollowers(a.followers)}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Playlists */}
              {(data?.playlists.length ?? 0) > 0 && (
                <section className="mb-8">
                  <SectionLabel>Related playlists</SectionLabel>
                  <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data!.playlists.map(p => (
                      <PlaylistCard key={p.id} playlist={p} />
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating preview player */}
      <AnimatePresence>
        {nowPlaying && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="fixed bottom-5 inset-x-0 z-[80] flex justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg flex items-center gap-4 rounded-2xl border border-white/10 bg-stone-950/90 dark:bg-stone-100/95 backdrop-blur-xl px-4 py-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] text-stone-50 dark:text-stone-900">
              <Cover
                src={nowPlaying.albumImage}
                alt=""
                className="size-12 rounded-lg shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-music-ui)] text-sm font-medium truncate">
                  {nowPlaying.name}
                </p>
                <p className="text-xs opacity-60 truncate">{nowPlaying.artists}</p>
                <div className="mt-2 h-0.5 rounded-full bg-white/15 dark:bg-stone-900/15 overflow-hidden">
                  <div
                    className="h-full bg-amber-300 dark:bg-amber-700 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => void togglePreview(nowPlaying)}
                className="size-11 rounded-full bg-white/10 dark:bg-stone-900/10 flex items-center justify-center hover:bg-white/20 dark:hover:bg-stone-900/20 transition-colors cursor-pointer"
                aria-label="Pause"
              >
                <Pause className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-[family-name:var(--font-music-ui)] text-[10px] uppercase tracking-[0.28em] text-stone-400 dark:text-stone-500">
      {children}
    </h3>
  )
}

function AlbumCard({ album }: { album: MusicAlbumView }) {
  return (
    <a
      href={album.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group shrink-0 w-40 snap-start"
    >
      <Cover
        src={album.image}
        alt={album.name}
        className="aspect-square rounded-2xl shadow-lg ring-1 ring-stone-900/5 dark:ring-white/10 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.02]"
      />
      <p className="mt-3 font-[family-name:var(--font-music-ui)] text-sm font-medium truncate text-stone-800 dark:text-stone-100">
        {album.name}
      </p>
      <p className="text-[11px] text-stone-400 capitalize">
        {album.year} · {album.type}
      </p>
    </a>
  )
}

function PlaylistCard({ playlist }: { playlist: MusicPlaylistView }) {
  return (
    <a
      href={playlist.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-stone-900/[0.06] dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.03] p-3 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-white/[0.06] transition-colors"
    >
      <Cover
        src={playlist.image}
        alt={playlist.name}
        className="size-14 rounded-xl shrink-0 shadow-md"
      />
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-music-ui)] text-sm font-medium truncate text-stone-800 dark:text-stone-100">
          {playlist.name}
        </p>
        <p className="text-[11px] text-stone-400 truncate mt-0.5">
          {playlist.owner} · {playlist.tracks} tracks
        </p>
      </div>
      <ExternalLink className="size-3.5 text-stone-300 group-hover:text-stone-500 shrink-0" />
    </a>
  )
}
