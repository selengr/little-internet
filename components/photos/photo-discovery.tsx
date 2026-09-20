'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Sparkles,
  Flame,
  Shuffle,
  Loader2,
  Share2,
  X,
} from 'lucide-react'
import { PhotoMasonry } from '@/components/photos/photo-masonry'
import { PhotoDetailModal, PhotographerPanel } from '@/components/photos/photo-detail-modal'
import type {
  UnsplashCollectionView,
  UnsplashPhotoView,
  UnsplashSearchFilters,
  UnsplashUserView,
} from '@/types/unsplash'
import {
  formatPhotoCount,
  PHOTO_CATEGORIES,
  SEARCH_SUGGESTIONS,
} from '@/lib/unsplash'
import { cn } from '@/lib/utils'

const ORIENTATIONS = [
  { id: 'landscape', label: 'Landscape' },
  { id: 'portrait', label: 'Portrait' },
  { id: 'squarish', label: 'Square' },
] as const

const COLORS = [
  { id: 'black', label: 'Dark', swatch: '#111' },
  { id: 'blue', label: 'Blue', swatch: '#3b82f6' },
  { id: 'green', label: 'Green', swatch: '#22c55e' },
] as const

async function fetchUnsplash<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params)
  const res = await fetch(`/api/unsplash?${qs}`, { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Request failed')
  return json as T
}

export function PhotoDiscovery() {
  const searchParams = useSearchParams()
  const [hero, setHero] = useState<UnsplashPhotoView | null>(null)
  const [daily, setDaily] = useState<UnsplashPhotoView | null>(null)
  const [collections, setCollections] = useState<UnsplashCollectionView[]>([])
  const [trending, setTrending] = useState<UnsplashPhotoView[]>([])
  const [gallery, setGallery] = useState<UnsplashPhotoView[]>([])

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [filters, setFilters] = useState<UnsplashSearchFilters>({})
  const [searchTotal, setSearchTotal] = useState(0)

  const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhotoView | null>(null)
  const [profileUser, setProfileUser] = useState<UnsplashUserView | null>(null)
  const [profilePhotos, setProfilePhotos] = useState<UnsplashPhotoView[]>([])

  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingHero, setLoadingHero] = useState(true)
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingSurprise, setLoadingSurprise] = useState(false)
  const [siteShared, setSiteShared] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const galleryRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(async () => {
    setLoadingHero(true)
    setLoadError(null)
    try {
      const results = await Promise.allSettled([
        fetchUnsplash<{ photo: UnsplashPhotoView }>({ action: 'hero', orientation: 'landscape' }),
        fetchUnsplash<{ photo: UnsplashPhotoView }>({ action: 'random', query: 'inspiration' }),
        fetchUnsplash<{ collections: UnsplashCollectionView[] }>({ action: 'collections', per_page: '5' }),
        fetchUnsplash<{ photos: UnsplashPhotoView[] }>({ action: 'latest', per_page: '12' }),
        fetchUnsplash<{ photos: UnsplashPhotoView[] }>({ action: 'trending', per_page: '8' }),
      ])

      const [heroRes, dailyRes, collectionsRes, latestRes, trendingRes] = results

      if (heroRes.status === 'fulfilled') setHero(heroRes.value.photo)
      if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value.photo)
      if (collectionsRes.status === 'fulfilled') setCollections(collectionsRes.value.collections)
      if (latestRes.status === 'fulfilled') {
        setGallery(latestRes.value.photos)
      }
      if (trendingRes.status === 'fulfilled') setTrending(trendingRes.value.photos)

      const failures = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      )
      const hasGallery = latestRes.status === 'fulfilled' && latestRes.value.photos.length > 0
      const hasHero = heroRes.status === 'fulfilled'

      if (!hasGallery && !hasHero) {
        const message =
          failures[0]?.reason instanceof Error
            ? failures[0].reason.message
            : 'Could not load photos'
        setLoadError(message)
        setGallery([])
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load photos'
      setLoadError(message)
      setGallery([])
    } finally {
      setLoadingHero(false)
    }
  }, [])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  const loadGallery = useCallback(
    async (opts: {
      reset?: boolean
      query?: string
      category?: string | null
      pageNum?: number
      nextFilters?: UnsplashSearchFilters
    } = {}) => {
      const nextPage = opts.pageNum ?? (opts.reset ? 1 : page)
      const activeFilters = opts.nextFilters ?? filters
      setLoadingGallery(true)
      try {
        const q = opts.query ?? submittedQuery
        const category = opts.category ?? activeCategory
        const categoryQuery = category
          ? PHOTO_CATEGORIES.find(c => c.id === category)?.query
          : undefined
        const finalQuery = q || categoryQuery

        let photos: UnsplashPhotoView[] = []
        let total = 0

        if (finalQuery) {
          const params: Record<string, string> = {
            action: 'search',
            query: finalQuery,
            page: String(nextPage),
            per_page: '12',
            order_by: activeFilters.orderBy ?? 'relevant',
          }
          if (activeFilters.orientation) params.orientation = activeFilters.orientation
          if (activeFilters.color) params.color = activeFilters.color

          const json = await fetchUnsplash<{
            photos: UnsplashPhotoView[]
            total: number
          }>(params)
          photos = json.photos
          total = json.total
        } else {
          const json = await fetchUnsplash<{ photos: UnsplashPhotoView[] }>({
            action: 'latest',
            page: String(nextPage),
            per_page: '12',
          })
          photos = json.photos
        }

        setGallery(prev => (opts.reset ? photos : [...prev, ...photos]))
        setSearchTotal(total)
        setPage(nextPage)
        setHasMore(photos.length >= 12)
      } catch {
        if (opts.reset) setGallery([])
        setHasMore(false)
      } finally {
        setLoadingGallery(false)
      }
    },
    [activeCategory, filters, page, submittedQuery],
  )

  const loadGalleryRef = useRef(loadGallery)
  loadGalleryRef.current = loadGallery

  // Deep-link support: /photos?category=nature preselects a category,
  // e.g. from the homepage photo showcase cards.
  const initialCategoryHandled = useRef(false)
  useEffect(() => {
    if (initialCategoryHandled.current) return
    initialCategoryHandled.current = true
    const categoryParam = searchParams.get('category')
    if (categoryParam && PHOTO_CATEGORIES.some(c => c.id === categoryParam)) {
      setActiveCategory(categoryParam)
      setPage(1)
      void loadGalleryRef.current({ reset: true, category: categoryParam, pageNum: 1 })
    }
  }, [searchParams])

  const runSearch = (query: string) => {
    const trimmed = query.trim()
    setSubmittedQuery(trimmed)
    setActiveCategory(null)
    setPage(1)
    void loadGallery({ reset: true, query: trimmed, pageNum: 1 })
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const selectCategory = (id: string) => {
    setActiveCategory(id)
    setSubmittedQuery('')
    setSearchQuery('')
    setPage(1)
    void loadGallery({ reset: true, category: id, pageNum: 1 })
    galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openCollection = async (collection: UnsplashCollectionView) => {
    setSubmittedQuery(collection.title)
    setSearchQuery(collection.title)
    setActiveCategory(null)
    setLoadingGallery(true)
    try {
      const json = await fetchUnsplash<{ photos: UnsplashPhotoView[] }>({
        action: 'collection',
        id: String(collection.id),
        per_page: '20',
      })
      setGallery(json.photos)
      setSearchTotal(json.photos.length)
      setPage(1)
      setHasMore(false)
      galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      setGallery([])
    } finally {
      setLoadingGallery(false)
    }
  }

  const openPhotographer = async (user: UnsplashUserView) => {
    setProfileUser(user)
    setLoadingProfile(true)
    try {
      const json = await fetchUnsplash<{ user: UnsplashUserView; photos: UnsplashPhotoView[] }>({
        action: 'user',
        username: user.username,
        per_page: '12',
      })
      setProfileUser(json.user)
      setProfilePhotos(json.photos)
    } catch {
      setProfilePhotos([])
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleDownload = async (photo: UnsplashPhotoView) => {
    try {
      const json = await fetchUnsplash<{ url: string }>({
        action: 'download',
        id: photo.id,
      })
      window.open(json.url, '_blank', 'noopener,noreferrer')
    } catch {
      window.open(photo.urls.full, '_blank', 'noopener,noreferrer')
    }
  }

  const handleShare = async (photo: UnsplashPhotoView) => {
    const url = photo.links.html
    if (navigator.share) {
      await navigator.share({ title: photo.alt, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const handleShareSite = async () => {
    const url = window.location.href
    const title = 'Photo Discovery — Reza Karbakhsh'
    const text = 'Discover beautiful images on my live photo gallery.'
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url })
      } else {
        await navigator.clipboard.writeText(url)
        setSiteShared(true)
        setTimeout(() => setSiteShared(false), 2000)
      }
    } catch {
      /* user dismissed share sheet */
    }
  }

  const runSurprise = async () => {
    setLoadingSurprise(true)
    try {
      const json = await fetchUnsplash<{ photo: UnsplashPhotoView }>({ action: 'random' })
      setSelectedPhoto(json.photo)
    } catch {
      /* ignore — surprise is best-effort */
    } finally {
      setLoadingSurprise(false)
    }
  }

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingGallery) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingGallery) {
          void loadGallery({ pageNum: page + 1 })
        }
      },
      { rootMargin: '200px' },
    )
    obs.observe(loadMoreRef.current)
    return () => obs.disconnect()
  }, [hasMore, loadGallery, loadingGallery, page])

  const galleryTitle = useMemo(() => {
    if (submittedQuery) return `Results for "${submittedQuery}"`
    if (activeCategory) {
      return PHOTO_CATEGORIES.find(c => c.id === activeCategory)?.label ?? 'Gallery'
    }
    return 'Latest from Unsplash'
  }, [activeCategory, submittedQuery])

  return (
    <div className="pb-24">
      {/* Hero — image banner only */}
      <section className="relative h-[52vh] min-h-[320px] max-h-[560px] overflow-hidden">
        {hero && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.urls.regular}
              alt={hero.alt}
              className="absolute inset-0 h-full w-full object-cover scale-105"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35"
              aria-hidden
            />
          </>
        )}
        {!hero && loadingHero && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}

        {hero && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            onClick={() => void handleShareSite()}
            className="absolute top-6 right-4 sm:right-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs text-white/70 backdrop-blur-md hover:bg-black/45 transition-colors"
          >
            <Share2 className="size-3.5" />
            {siteShared ? 'Link copied' : 'Share gallery'}
          </motion.button>
        )}
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-20 -mt-6">
        {loadError && (
          <div
            className={cn(
              'rounded-2xl border px-5 py-4 text-sm',
              loadError.toLowerCase().includes('rate limit')
                ? 'border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-100'
                : 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200',
            )}
          >
            <p className="font-medium">
              {loadError.toLowerCase().includes('rate limit')
                ? 'Unsplash is temporarily limited'
                : 'Could not load Unsplash photos'}
            </p>
            <p
              className={cn(
                'mt-1',
                loadError.toLowerCase().includes('rate limit')
                  ? 'text-amber-800/75 dark:text-amber-100/75'
                  : 'text-red-700/75 dark:text-red-200/70',
              )}
            >
              {loadError}
            </p>
            {loadError.includes('UNSPLASH_ACCESS_KEY') && (
              <p className="mt-2 text-red-700/60 dark:text-red-200/60 text-xs">
                Add <code className="rounded bg-black/10 dark:bg-black/30 px-1">UNSPLASH_ACCESS_KEY</code> to{' '}
                <code className="rounded bg-black/10 dark:bg-black/30 px-1">.env.local</code> locally, or to{' '}
                <code className="rounded bg-black/10 dark:bg-black/30 px-1">Vercel → Environment Variables</code> for
                production, then redeploy.
              </p>
            )}
            <button
              type="button"
              onClick={() => void loadInitial()}
              className="mt-3 rounded-full border border-red-400/30 px-4 py-1.5 text-xs text-red-700 dark:text-red-100 hover:bg-red-500/10"
            >
              Try again
            </button>
          </div>
        )}

        {/* Daily inspiration */}
        {daily && (
          <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-xl">
            <div className="grid md:grid-cols-[1fr_1.1fr] gap-0">
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 text-amber-500 dark:text-amber-300/80 mb-4">
                  <Sparkles className="size-4" />
                  <span className="text-[10px] uppercase tracking-[0.25em]">Photo of the day</span>
                </div>
                <h2
                  className="text-2xl md:text-3xl font-light text-foreground leading-snug"
                  style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
                >
                  {daily.description ?? daily.alt}
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">by {daily.photographer.name}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(daily)}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
                  >
                    View full
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownload(daily)}
                    className="rounded-full border border-border px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleShare(daily)}
                    className="rounded-full border border-border px-4 py-2 text-sm text-foreground/80 hover:bg-muted/60 transition-colors"
                  >
                    Share
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedPhoto(daily)} className="relative min-h-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={daily.urls.regular} alt={daily.alt} className="h-full w-full object-cover" />
              </button>
            </div>
          </section>
        )}

        {/* Collections */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Featured</p>
              <h2
                className="text-2xl font-light text-foreground"
                style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
              >
                Trending collections
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {collections.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => void openCollection(c)}
                className="group relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/10 text-left"
              >
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-stone-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-sm font-medium text-white line-clamp-2">{c.title}</p>
                  <p className="text-xs text-white/50 mt-1">{formatPhotoCount(c.totalPhotos)} photos</p>
                </div>
              </button>
            ))}
            {!collections.length && loadingHero && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
              ))
            )}
          </div>
        </section>

        {/* Categories */}
        <section>
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Explore</p>
          <h2
            className="text-2xl font-light text-foreground mb-5"
            style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
          >
            Categories
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {PHOTO_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.id)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-2.5 text-sm backdrop-blur-md transition-colors',
                  activeCategory === cat.id
                    ? 'border-foreground/30 bg-foreground/10 text-foreground'
                    : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                <span className="mr-1.5">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Flame className="size-4 text-orange-500 dark:text-orange-400/80" />
            <h2
              className="text-2xl font-light text-foreground"
              style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
            >
              Trending now
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {trending.map(photo => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-black/[0.06] dark:ring-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.urls.small}
                  alt={photo.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{photo.photographer.name}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Search */}
        <section className="max-w-2xl mx-auto w-full">
          <form
            onSubmit={e => {
              e.preventDefault()
              runSearch(searchQuery)
            }}
            className="relative flex items-center gap-3 border-b-2 border-border focus-within:border-foreground transition-colors pb-3"
          >
            <Search className="size-5 text-muted-foreground shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search photos…"
              className="flex-1 bg-transparent text-lg md:text-xl font-light tracking-tight text-foreground placeholder:text-muted-foreground/45 outline-none min-w-0"
              style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                aria-label="Clear"
              >
                <X className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void runSurprise()}
              disabled={loadingSurprise}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-border text-[11px] uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60"
            >
              {loadingSurprise ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Shuffle className="size-3.5" />
              )}
              Surprise
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {SEARCH_SUGGESTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSearchQuery(s)
                  runSearch(s)
                }}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {(submittedQuery || activeCategory) && (
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Filters</p>
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Orientation</p>
                  <div className="flex flex-wrap gap-2">
                    {ORIENTATIONS.map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          const next = {
                            ...filters,
                            orientation: filters.orientation === o.id ? undefined : o.id,
                          }
                          setFilters(next)
                          void loadGallery({ reset: true, pageNum: 1, nextFilters: next })
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs',
                          filters.orientation === o.id
                            ? 'border-foreground/30 bg-foreground/10 text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const next = {
                            ...filters,
                            color:
                              filters.color === c.id
                                ? undefined
                                : (c.id as UnsplashSearchFilters['color']),
                          }
                          setFilters(next)
                          void loadGallery({ reset: true, pageNum: 1, nextFilters: next })
                        }}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
                          filters.color === c.id
                            ? 'border-foreground/30 bg-foreground/10 text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        <span className="size-2.5 rounded-full" style={{ background: c.swatch }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sort</p>
                  <div className="flex gap-2">
                    {(['relevant', 'latest'] as const).map(o => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => {
                          const next = { ...filters, orderBy: o }
                          setFilters(next)
                          void loadGallery({ reset: true, pageNum: 1, nextFilters: next })
                        }}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs capitalize',
                          (filters.orderBy ?? 'relevant') === o
                            ? 'border-foreground/30 bg-foreground/10 text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Main gallery */}
        <section ref={galleryRef}>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2
                className="text-2xl font-light text-foreground"
                style={{ fontFamily: 'var(--font-display-serif), Georgia, serif' }}
              >
                {galleryTitle}
              </h2>
              {searchTotal > 0 && submittedQuery && (
                <p className="text-sm text-muted-foreground mt-1">{searchTotal.toLocaleString()} results</p>
              )}
            </div>
          </div>
          <PhotoMasonry
            photos={gallery}
            loading={loadingGallery}
            onPhotoClick={setSelectedPhoto}
            onDownload={p => void handleDownload(p)}
          />
          <div ref={loadMoreRef} className="h-8 mt-4 flex items-center justify-center">
            {loadingGallery && gallery.length > 0 && (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            )}
          </div>
        </section>
      </div>

      <PhotoDetailModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDownload={() => {
          if (selectedPhoto) void handleDownload(selectedPhoto)
        }}
        onShare={() => {
          if (selectedPhoto) void handleShare(selectedPhoto)
        }}
        onPhotographerClick={user => {
          setSelectedPhoto(null)
          void openPhotographer(user)
        }}
      />

      <PhotographerPanel
        user={profileUser}
        photos={profilePhotos}
        loading={loadingProfile}
        onClose={() => setProfileUser(null)}
        onPhotoClick={photo => {
          setProfileUser(null)
          setSelectedPhoto(photo)
        }}
      />
    </div>
  )
}
