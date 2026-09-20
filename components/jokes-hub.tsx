'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Heart,
  Dices,
  Calendar,
  Infinity,
  ChevronDown,
  Copy,
  Check,
  Trash2,
  Search,
} from 'lucide-react'
import type { Joke, JokeApiInfo, JokeResponse, StoredFavorite } from '@/types/jokeapi'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { key: 'Any', label: 'Any', mark: '*', emoji: '🎲', color: '#5c6578' },
  { key: 'Programming', label: 'Code', mark: '</>', emoji: '💻', color: '#3b6ea5' },
  { key: 'Pun', label: 'Puns', mark: 'Pn', emoji: '🎪', color: '#c96b3c' },
  { key: 'Misc', label: 'Misc', mark: 'Mx', emoji: '🃏', color: '#e23d2d' },
  { key: 'Dark', label: 'Dark', mark: 'Dk', emoji: '🌙', color: '#3a3f4a' },
  { key: 'Spooky', label: 'Spooky', mark: 'Sp', emoji: '👻', color: '#6b5b95' },
  { key: 'Christmas', label: 'Xmas', mark: 'Xm', emoji: '🎄', color: '#2f6b4f' },
] as const

const FAVORITES_KEY = 'fun-apis-joke-favorites'

const titleFont = { fontFamily: 'var(--font-jk-display), Georgia, serif' } as const

function isJoke(data: JokeResponse): data is Joke {
  return !data.error && 'id' in data && !('jokes' in data)
}

function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

async function apiFetch(params: Record<string, string>) {
  const qs = new URLSearchParams(params)
  const res = await fetch(`/api/jokes?${qs}`, { cache: 'no-store' })
  const json: JokeResponse = await res.json()
  if (!res.ok || json.error) {
    throw new Error('message' in json ? json.message : 'Failed to load joke')
  }
  return json
}

function loadFavorites(): StoredFavorite[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveFavorites(favs: StoredFavorite[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
}

function JokeCard({
  joke,
  large,
  favorites,
  onToggleFavorite,
  revealed,
  onReveal,
  stage,
}: {
  joke: Joke
  large?: boolean
  favorites: StoredFavorite[]
  onToggleFavorite: (j: Joke) => void
  revealed?: boolean
  onReveal?: () => void
  stage?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const isFav = favorites.some(f => f.id === joke.id)
  const cat = CATEGORIES.find(c => c.key === joke.category) ?? CATEGORIES[0]
  const isTwopart = joke.type === 'twopart'
  const showDelivery = !isTwopart || revealed

  const text = isTwopart
    ? revealed
      ? `${joke.setup}\n\n${joke.delivery}`
      : joke.setup
    : joke.joke

  const copy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(
      isTwopart && revealed ? `${joke.setup}\n\n${joke.delivery}` : text ?? '',
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        large ? 'p-6 sm:p-8 md:p-10' : 'p-4 sm:p-5',
      )}
      style={
        stage
          ? {
              background: 'var(--jk-stage)',
              color: 'var(--jk-stage-fg)',
              borderColor: 'transparent',
              boxShadow: 'var(--jk-shadow)',
            }
          : {
              background: 'var(--jk-panel)',
              borderColor: 'var(--jk-line)',
              color: 'var(--jk-fg)',
              boxShadow: 'var(--jk-shadow)',
            }
      }
    >
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: stage ? 'var(--jk-cue)' : cat.color }}
        aria-hidden
      />

      <div className="relative pl-2">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] px-2 py-1 rounded-lg border"
              style={{
                borderColor: stage ? 'rgba(242,243,246,0.2)' : 'var(--jk-line)',
                color: stage ? 'var(--jk-cue)' : 'var(--jk-mute)',
              }}
            >
              {cat.label}
            </span>
            <span
              className="truncate text-[12px]"
              style={{ color: stage ? 'rgba(242,243,246,0.45)' : 'var(--jk-mute)' }}
            >
              #{joke.id}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={copy}
              className="size-8 rounded-xl border flex items-center justify-center transition-opacity hover:opacity-80 cursor-pointer"
              style={{
                borderColor: stage ? 'rgba(242,243,246,0.2)' : 'var(--jk-line)',
                color: stage ? 'rgba(242,243,246,0.7)' : 'var(--jk-mute)',
              }}
              aria-label="Copy joke"
            >
              {copied ? <Check className="size-3.5" style={{ color: 'var(--jk-cue)' }} /> : <Copy className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(joke)}
              className="size-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
              style={{
                borderColor: isFav ? 'var(--jk-hot)' : stage ? 'rgba(242,243,246,0.2)' : 'var(--jk-line)',
                color: isFav ? 'var(--jk-hot)' : stage ? 'rgba(242,243,246,0.7)' : 'var(--jk-mute)',
                background: isFav ? 'var(--jk-hot-soft)' : 'transparent',
              }}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={cn('size-3.5', isFav && 'fill-current')} />
            </button>
          </div>
        </div>

        {isTwopart ? (
          <div className="space-y-4">
            <p
              className={cn(
                'leading-[1.45] tracking-[-0.01em] font-medium',
                large ? 'text-[1.35rem] sm:text-[1.65rem] md:text-[1.85rem]' : 'text-[15px] sm:text-base',
              )}
            >
              {joke.setup}
            </p>
            <AnimatePresence mode="wait">
              {showDelivery ? (
                <motion.p
                  key="delivery"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'leading-[1.45] font-medium',
                    large ? 'text-[1.2rem] sm:text-[1.4rem]' : 'text-[14px] sm:text-[15px]',
                  )}
                  style={{ color: stage ? 'var(--jk-cue)' : 'var(--jk-hot)' }}
                >
                  {joke.delivery}
                </motion.p>
              ) : (
                <motion.button
                  key="reveal"
                  type="button"
                  onClick={onReveal}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-medium cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    background: 'var(--jk-cue)',
                    color: 'var(--jk-on-fg)',
                  }}
                >
                  Reveal punchline
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <p
            className={cn(
              'leading-[1.45] tracking-[-0.01em] font-medium',
              large ? 'text-[1.35rem] sm:text-[1.65rem] md:text-[1.85rem]' : 'text-[15px] sm:text-base',
            )}
          >
            {joke.joke}
          </p>
        )}
      </div>
    </motion.article>
  )
}

/** Used on homepage DevEx section — keep API stable. */
export function SpinWheel({
  spinning,
  landed,
  onSpin,
  compact,
  hideButton,
}: {
  spinning: boolean
  landed: string | null
  onSpin: () => void
  compact?: boolean
  hideButton?: boolean
}) {
  const segments = CATEGORIES.filter(c => c.key !== 'Any')
  const slice = 360 / segments.length
  const wheelGradient = `conic-gradient(from -90deg, ${segments
    .map((seg, i) => `${seg.color} ${i * slice}deg ${(i + 1) * slice}deg`)
    .join(', ')})`

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'flex-row gap-3' : 'flex-col gap-4',
      )}
    >
      <div className={cn('relative shrink-0', compact ? 'size-24' : 'size-40 sm:size-48')}>
        <motion.div
          animate={{
            rotate: spinning
              ? 1080 + Math.random() * 360
              : landed
                ? segments.findIndex(s => s.key === landed) * slice
                : 0,
          }}
          transition={{ duration: spinning ? 2.2 : 0.5, ease: spinning ? [0.2, 0.8, 0.2, 1] : 'easeOut' }}
          className="absolute inset-0 rounded-full border-2 border-white/40 dark:border-white/10 overflow-hidden shadow-inner"
          style={{ transformOrigin: 'center', background: wheelGradient }}
        >
          {segments.map((seg, i) => {
            const angle = slice * i + slice / 2
            return (
              <div
                key={seg.key}
                className="absolute inset-0 flex items-start justify-center"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span
                  className={cn(
                    'select-none font-mono font-semibold text-white/90 drop-shadow-sm',
                    compact ? 'text-[9px] mt-2' : 'text-[10px] mt-3.5',
                  )}
                >
                  {seg.mark}
                </span>
              </div>
            )
          })}
          <div
            className={cn(
              'absolute rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm',
              compact ? 'inset-2.5' : 'inset-4',
            )}
          >
            <span className={cn('font-mono font-bold', compact ? 'text-xs' : 'text-sm')}>
              {landed ? segments.find(s => s.key === landed)?.mark ?? '*' : '*'}
            </span>
          </div>
        </motion.div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 size-0 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-[#e23d2d] z-10" />
      </div>

      {!hideButton && (
        <button
          type="button"
          onClick={onSpin}
          disabled={spinning}
          className={cn(
            'inline-flex items-center gap-2 font-medium rounded-xl transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
            compact ? 'px-3 py-1.5 text-[11px]' : 'px-5 py-2.5 text-sm',
          )}
          style={{
            background: 'var(--jk-fg, #12141a)',
            color: 'var(--jk-on-fg, #e8e9ed)',
          }}
        >
          <Dices className={cn('size-3.5', spinning && 'animate-spin')} />
          {spinning ? 'Spinning…' : 'Spin for a joke'}
        </button>
      )}
    </div>
  )
}

export function JokesHub() {
  const [info, setInfo] = useState<JokeApiInfo | null>(null)
  const [category, setCategory] = useState('Any')
  const [heroJoke, setHeroJoke] = useState<Joke | null>(null)
  const [dailyJoke, setDailyJoke] = useState<Joke | null>(null)
  const [feed, setFeed] = useState<Joke[]>([])
  const [favorites, setFavorites] = useState<StoredFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heroRevealed, setHeroRevealed] = useState(false)
  const [randomLoading, setRandomLoading] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [spinLanded, setSpinLanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'feed' | 'favorites'>('feed')
  const [search, setSearch] = useState('')
  const feedEndRef = useRef<HTMLDivElement>(null)
  const feedLoadingRef = useRef(false)

  useEffect(() => {
    setFavorites(loadFavorites())
  }, [])

  const fetchOne = useCallback(async (cat: string, extra?: Record<string, string>) => {
    const json = await apiFetch({ category: cat, ...extra })
    if (isJoke(json)) return json
    throw new Error('Unexpected response')
  }, [])

  const init = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const infoJson = (await apiFetch({ endpoint: 'info' })) as unknown as JokeApiInfo
      setInfo(infoJson)

      const total = infoJson.jokes?.totalCount ?? 1368
      const dailyId = dayOfYear() % total

      const [daily, hero, ...initialFeed] = await Promise.all([
        fetchOne('Any', { idRange: String(dailyId) }),
        fetchOne('Any'),
        ...Array.from({ length: 4 }, () => fetchOne('Any')),
      ])

      setDailyJoke(daily)
      setHeroJoke(hero)
      setFeed(initialFeed)
      setHeroRevealed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load jokes')
    } finally {
      setLoading(false)
    }
  }, [fetchOne])

  useEffect(() => {
    init()
  }, [init])

  const loadMore = useCallback(async () => {
    if (feedLoadingRef.current) return
    feedLoadingRef.current = true
    setFeedLoading(true)
    try {
      const params: Record<string, string> = { category, amount: '3' }
      if (search.trim()) params.contains = search.trim()
      const json = await apiFetch(params)
      if ('jokes' in json && Array.isArray(json.jokes)) {
        setFeed(prev => {
          const ids = new Set(prev.map(j => j.id))
          const fresh = json.jokes.filter(j => !ids.has(j.id))
          return [...prev, ...fresh]
        })
      } else if (isJoke(json)) {
        setFeed(prev => (prev.some(j => j.id === json.id) ? prev : [...prev, json]))
      }
    } catch {
      // silent for infinite scroll
    } finally {
      feedLoadingRef.current = false
      setFeedLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    const el = feedEndRef.current
    if (!el || tab !== 'feed') return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) loadMore()
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore, tab, feed.length])

  const randomJoke = async () => {
    if (randomLoading) return
    setError(null)
    setRandomLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search.trim()) params.contains = search.trim()
      const joke = await fetchOne(category, params)
      setHeroJoke(joke)
      setHeroRevealed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No joke found')
    } finally {
      setRandomLoading(false)
    }
  }

  const spinForJoke = async () => {
    if (spinning) return
    setSpinning(true)
    setSpinLanded(null)
    setError(null)

    const segments = CATEGORIES.filter(c => c.key !== 'Any')
    const landed = segments[Math.floor(Math.random() * segments.length)].key

    setTimeout(async () => {
      setSpinLanded(landed)
      setSpinning(false)
      try {
        const joke = await fetchOne(landed)
        setHeroJoke(joke)
        setCategory(landed)
        setHeroRevealed(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Spin failed')
      }
    }, 2200)
  }

  const toggleFavorite = (joke: Joke) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === joke.id)
      const next = exists
        ? prev.filter(f => f.id !== joke.id)
        : [
            ...prev,
            {
              id: joke.id,
              category: joke.category,
              type: joke.type,
              joke: joke.joke,
              setup: joke.setup,
              delivery: joke.delivery,
              savedAt: Date.now(),
            },
          ]
      saveFavorites(next)
      return next
    })
  }

  const clearFavorites = () => {
    saveFavorites([])
    setFavorites([])
  }

  const changeCategory = async (cat: string) => {
    setCategory(cat)
    setFeed([])
    setError(null)
    try {
      const joke = await fetchOne(cat)
      setHeroJoke(joke)
      setHeroRevealed(false)
      const batch = await apiFetch({ category: cat, amount: '4' })
      if ('jokes' in batch) setFeed(batch.jokes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const favoriteJokes = useMemo(
    () =>
      favorites.map(f => ({
        error: false as const,
        id: f.id,
        category: f.category,
        type: f.type,
        joke: f.joke,
        setup: f.setup,
        delivery: f.delivery,
        flags: {
          nsfw: false,
          religious: false,
          political: false,
          racist: false,
          sexist: false,
          explicit: false,
        },
        safe: true,
        lang: 'en',
      })),
    [favorites],
  )

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6 animate-pulse">
        <div className="h-14 w-40" style={{ background: 'var(--jk-line-soft)' }} />
        <div className="h-10 w-full max-w-md" style={{ background: 'var(--jk-line-soft)' }} />
        <div className="h-72 w-full" style={{ background: 'var(--jk-line-soft)' }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8">
      <header className="mb-10 md:mb-12 max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-medium uppercase tracking-[0.2em] mb-4"
          style={{ color: 'var(--jk-mute)' }}
        >
          Comedy desk
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.04 }}
          className="text-[clamp(2.75rem,9vw,5rem)] font-normal leading-[0.95] tracking-tight"
          style={titleFont}
        >
          Pull a joke.
        </motion.h1>
        <p className="mt-5 text-[15px] leading-relaxed max-w-md" style={{ color: 'var(--jk-mute)' }}>
          Spin the wheel, pick a category, or keep scrolling the set list.
        </p>
      </header>

      {error && (
        <p
          className="mb-6 rounded-xl border px-4 py-3 text-[14px]"
          style={{
            borderColor: 'var(--jk-hot)',
            background: 'var(--jk-hot-soft)',
            color: 'var(--jk-hot)',
          }}
        >
          {error}
        </p>
      )}

      {/* Stage + wheel */}
      {tab === 'feed' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_240px] lg:items-stretch mb-6 sm:mb-8">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--jk-mute)' }}>
                On stage
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={randomJoke}
                  disabled={randomLoading}
                  className="inline-flex h-9 items-center gap-2 px-3.5 rounded-xl text-[13px] font-medium cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--jk-fg)', color: 'var(--jk-on-fg)' }}
                >
                  <RefreshCw className={cn('size-3.5', randomLoading && 'animate-spin')} />
                  {randomLoading ? 'Finding' : 'Next bit'}
                </button>
              </div>
            </div>
            {heroJoke && (
              <JokeCard
                joke={heroJoke}
                large
                stage
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                revealed={heroRevealed}
                onReveal={() => setHeroRevealed(true)}
              />
            )}
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border flex flex-col items-center justify-center gap-5 p-5 sm:p-6"
            style={{
              borderColor: 'var(--jk-line)',
              background: 'var(--jk-panel)',
              boxShadow: 'var(--jk-shadow)',
            }}
          >
            <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--jk-mute)' }}>
              Wheel
            </p>
            <SpinWheel spinning={spinning} landed={spinLanded} onSpin={spinForJoke} />
          </motion.aside>
        </div>
      )}

      {/* Desk controls */}
      <section
        className="rounded-2xl border mb-6 sm:mb-8 overflow-hidden"
        style={{
          borderColor: 'var(--jk-line)',
          background: 'var(--jk-panel)',
          boxShadow: 'var(--jk-shadow)',
        }}
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: 'var(--jk-line-soft)' }}
        >
          <div className="relative flex-1">
            <Search
              className="absolute left-0 top-1/2 -translate-y-1/2 size-3.5"
              style={{ color: 'var(--jk-mute)' }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && randomJoke()}
              placeholder="Search bits… bar, python, cat"
              className="w-full bg-transparent pl-6 pr-2 py-2 text-[14px] outline-none placeholder:opacity-50"
              style={{ color: 'var(--jk-fg)' }}
            />
          </div>
          <div className="flex gap-1.5 shrink-0">
            {(
              [
                { key: 'feed' as const, label: 'Set list', icon: Infinity },
                { key: 'favorites' as const, label: `Saved (${favorites.length})`, icon: Heart },
              ] as const
            ).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-medium border cursor-pointer transition-colors"
                style={
                  tab === t.key
                    ? { background: 'var(--jk-fg)', color: 'var(--jk-on-fg)', borderColor: 'var(--jk-fg)' }
                    : {
                        background: 'transparent',
                        color: 'var(--jk-mute)',
                        borderColor: 'var(--jk-line)',
                      }
                }
              >
                <t.icon className="size-3" />
                {t.label}
              </button>
            ))}
            {tab === 'favorites' && favorites.length > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12px] font-medium border cursor-pointer"
                style={{ borderColor: 'var(--jk-hot)', color: 'var(--jk-hot)' }}
              >
                <Trash2 className="size-3" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-0 overflow-x-auto px-2 py-1 sm:px-3 scrollbar-none">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => changeCategory(c.key)}
              className="relative shrink-0 px-3 py-3 text-[13px] font-medium cursor-pointer transition-opacity"
              style={{
                color: category === c.key ? 'var(--jk-fg)' : 'var(--jk-mute)',
                opacity: category === c.key ? 1 : 0.75,
              }}
            >
              <span className="mr-1.5" style={{ color: category === c.key ? c.color : undefined }}>
                {c.mark}
              </span>
              {c.label}
              {category === c.key && (
                <motion.span
                  layoutId="jk-cat"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: 'var(--jk-hot)' }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Daily — compact strip, not a second hero */}
      {dailyJoke && tab === 'feed' && (
        <section
          className="mb-6 sm:mb-8 rounded-2xl border overflow-hidden"
          style={{
            borderColor: 'var(--jk-line)',
            background: 'var(--jk-panel)',
            boxShadow: 'var(--jk-shadow)',
          }}
        >
          <div
            className="flex items-center gap-2 border-b px-4 py-2.5 sm:px-5"
            style={{ borderColor: 'var(--jk-line-soft)' }}
          >
            <Calendar className="size-3.5" style={{ color: 'var(--jk-hot)' }} />
            <p className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--jk-mute)' }}>
              Bit of the day
            </p>
          </div>
          <div className="p-3 sm:p-4">
            <JokeCard
              joke={dailyJoke}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              revealed
            />
          </div>
        </section>
      )}

      {/* Set list / favorites */}
      {tab === 'feed' ? (
        <section className="space-y-3">
          <p
            className="text-[11px] font-medium tracking-wide flex items-center gap-2"
            style={{ color: 'var(--jk-mute)' }}
          >
            <Infinity className="size-3" />
            Keep scrolling the set
          </p>
          <AnimatePresence mode="popLayout">
            {feed.map((joke, i) => (
              <JokeCard
                key={`feed-${joke.id}-${i}`}
                joke={joke}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                revealed
              />
            ))}
          </AnimatePresence>
          <div ref={feedEndRef} className="flex justify-center py-6">
            {feedLoading ? (
              <RefreshCw className="size-5 animate-spin" style={{ color: 'var(--jk-mute)' }} />
            ) : (
              <ChevronDown className="size-5 animate-bounce opacity-40" style={{ color: 'var(--jk-mute)' }} />
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {favoriteJokes.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed py-16 text-center"
              style={{ borderColor: 'var(--jk-line)', color: 'var(--jk-mute)' }}
            >
              <Heart className="size-8 mx-auto mb-3 opacity-40" />
              <p className="text-[14px]">No saved bits yet. Heart one from the stage.</p>
            </div>
          ) : (
            favoriteJokes.map(joke => (
              <JokeCard
                key={joke.id}
                joke={joke}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                revealed
              />
            ))
          )}
        </section>
      )}

      <p className="mt-10 text-center text-[12px]" style={{ color: 'var(--jk-mute)' }}>
        Powered by{' '}
        <a
          href="https://v2.jokeapi.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-80"
          style={{ color: 'var(--jk-fg)' }}
        >
          JokeAPI
        </a>
        {' '}
        · safe mode on
      </p>
    </div>
  )
}
