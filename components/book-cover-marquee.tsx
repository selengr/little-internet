"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { UnsplashPhotoView } from "@/types/unsplash"

const TILE_PX = 48
const TILE_GAP = 8
/** Max 6 → 5 → 4 tiles per column — matches reference wave grid */
const COLUMN_COUNTS = [6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6]

const SEARCH_QUERIES = [
  "psychology portrait",
  "programming developer",
  "books reading",
  "science laboratory",
  "habits journal",
  "english study",
  "computer workspace",
  "mindfulness",
]

const INITIAL_PAGES = 1
const FULL_PAGES = 5
const PER_PAGE = 10
const PRELOAD_COUNT = 32
const PRELOAD_TIMEOUT_MS = 3500

type GridPhoto = {
  id: string
  alt: string
  tileSrc: string
  href: string
}

/** Direct CDN shots — used when the Unsplash API key is missing or rate-limited */
const FALLBACK_PHOTOS: GridPhoto[] = [
  "photo-1544716278-ca5e3f4abd8c",
  "photo-1516321318423-f06f85e504b3",
  "photo-1455390582262-044cdead277a",
  "photo-1486312338219-ce68d2c6f44d",
  "photo-1451187580459-43490279c0fa",
  "photo-1506905925346-21bda4d32df4",
  "photo-1517694712202-14dd9538aa97",
  "photo-1522202176988-66273c2fd55f",
  "photo-1531485608785-913a5c4d4af3",
  "photo-1552664730-d307ca884978",
  "photo-1573497019940-1c28c88b4f3e",
  "photo-1581091226825-a6a2a5aee158",
  "photo-1596495577886-d920f1fb7748",
  "photo-1600880292203-757bb62b4baf",
  "photo-1621761191319-c6fb62004040",
  "photo-1635070041078-e363dbe005cb",
  "photo-1667372391179-3d5790a4d472",
  "photo-1498050108023-c5249f4df085",
  "photo-1524995992477-879a36b4ae82",
  "photo-1507842217343-583bb7270b33",
].map((id, i) => {
  const base = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=96&h=96&crop=top&q=85`
  return {
    id: `fallback-${i}`,
    alt: "Curated photo",
    tileSrc: base,
    href: "https://unsplash.com",
  }
})

let photoCache: GridPhoto[] | null = null

function tileUrl(url: string, size: number) {
  const base = url.split("?")[0]
  return `${base}?auto=format&fit=crop&w=${size}&h=${size}&crop=top&q=85`
}

function mapPhoto(photo: UnsplashPhotoView): GridPhoto {
  return {
    id: photo.id,
    alt: photo.alt,
    tileSrc: tileUrl(photo.urls.small, TILE_PX * 2),
    href: photo.links.html,
  }
}

function preloadImage(src: string) {
  return new Promise<void>(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

async function preloadWithTimeout(photos: GridPhoto[], limit: number) {
  const batch = photos.slice(0, limit).map(p => preloadImage(p.tileSrc))
  await Promise.race([
    Promise.all(batch),
    new Promise<void>(resolve => setTimeout(resolve, PRELOAD_TIMEOUT_MS)),
  ])
}

async function fetchSearchPage(query: string, page: number) {
  const params = new URLSearchParams({
    action: "search",
    query,
    orientation: "portrait",
    per_page: String(PER_PAGE),
    page: String(page),
    order_by: "relevant",
  })
  const res = await fetch(`/api/unsplash?${params}`, { cache: "no-store" })
  if (!res.ok) return [] as UnsplashPhotoView[]
  const json = await res.json()
  return (json.photos ?? []) as UnsplashPhotoView[]
}

async function fetchPages(maxPages: number) {
  const batches = await Promise.all(
    SEARCH_QUERIES.map(async query => {
      const photos: UnsplashPhotoView[] = []
      for (let page = 1; page <= maxPages; page++) {
        const batch = await fetchSearchPage(query, page)
        if (batch.length === 0) break
        photos.push(...batch)
      }
      return photos
    }),
  )

  const seen = new Set<string>()
  const unique: GridPhoto[] = []
  for (const photo of batches.flat()) {
    if (seen.has(photo.id)) continue
    seen.add(photo.id)
    unique.push(mapPhoto(photo))
  }
  return unique
}

function PhotoTile({ photo, priority }: { photo: GridPhoto; priority?: boolean }) {
  return (
    <a
      href={photo.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-[14px]",
        "bg-[#141414] shadow-sm",
        "transition-transform duration-300 hover:scale-[1.06]",
      )}
      style={{ width: TILE_PX, height: TILE_PX }}
      title={photo.alt}
    >
      <img
        src={photo.tileSrc}
        alt={photo.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover object-top opacity-90 transition-opacity group-hover:opacity-100"
      />
    </a>
  )
}

function buildColumns(photos: GridPhoto[]) {
  if (photos.length === 0) return []

  let cursor = 0
  return COLUMN_COUNTS.map((count, colIndex) => {
    const column: GridPhoto[] = []
    for (let i = 0; i < count; i++) {
      column.push(photos[cursor % photos.length])
      cursor++
    }
    return { id: colIndex, photos: column }
  })
}

export function BookCoverMarquee() {
  const [photos, setPhotos] = useState<GridPhoto[]>(() => photoCache ?? [])
  const [ready, setReady] = useState(() => Boolean(photoCache?.length))

  const columns = useMemo(() => buildColumns(photos), [photos])

  useEffect(() => {
    if (ready) return

    let cancelled = false

    async function prepare() {
      try {
        // Fast first paint — one page per topic
        let pool = await fetchPages(INITIAL_PAGES)
        if (pool.length === 0) pool = FALLBACK_PHOTOS

        await preloadWithTimeout(pool, PRELOAD_COUNT)
        if (cancelled) return

        photoCache = pool
        setPhotos(pool)
        setReady(true)

        // Enrich pool in background (up to 5 pages) when API is healthy
        const full = await fetchPages(FULL_PAGES)
        if (cancelled || full.length <= pool.length) return
        photoCache = full
        setPhotos(full)
      } catch {
        if (cancelled) return
        photoCache = FALLBACK_PHOTOS
        setPhotos(FALLBACK_PHOTOS)
        setReady(true)
      }
    }

    prepare()
    return () => {
      cancelled = true
    }
  }, [ready])

  if (!ready || photos.length === 0) return null

  const track = (
    <div className="flex items-center gap-2 px-2" style={{ gap: TILE_GAP }}>
      {columns.map(col => (
        <div key={col.id} className="flex flex-col" style={{ gap: TILE_GAP }}>
          {col.photos.map((photo, i) => (
            <PhotoTile
              key={`${col.id}-${photo.id}-${i}`}
              photo={photo}
              priority={col.id < 6 && i < 3}
            />
          ))}
        </div>
      ))}
    </div>
  )

  return (
    <section className="relative max-h-[500px] overflow-hidden bg-transparent py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent md:w-24" />

      <div className="flex overflow-hidden motion-reduce:[&_*]:!animate-none">
        <div
          className="flex shrink-0 will-change-transform"
          style={{ animation: "unsplashMarqueeLeft 50s linear infinite" }}
        >
          {track}
          {track}
        </div>
      </div>

      <style>{`
        @keyframes unsplashMarqueeLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
