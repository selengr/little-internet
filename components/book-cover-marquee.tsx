"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { UnsplashPhotoView } from "@/types/unsplash"

const TILE_PX = 44
const TILE_GAP = 8
const COLUMN_COUNTS = [5, 8, 6, 9, 7, 8, 5, 9, 6, 8, 7, 5, 8, 6, 9, 7, 8, 5, 6, 9, 7, 8, 5, 6]

const SEARCH_QUERIES = [
  "psychology portrait",
  "programming developer",
  "books reading standing",
  "science laboratory",
  "habits journal",
  "english study",
  "computer workspace",
  "mindfulness meditation",
]

const MAX_PAGES = 5
const PER_PAGE = 10
/** Warm first visible tiles in browser cache before we mount the strip */
const PRELOAD_COUNT = 56

type GridPhoto = UnsplashPhotoView & { tileSrc: string }

let photoCache: GridPhoto[] | null = null
let photoCachePromise: Promise<GridPhoto[]> | null = null

function tileUrl(url: string, size: number) {
  const base = url.split("?")[0]
  // Portrait standing shots — square crop biased to top so subjects stay visible
  return `${base}?auto=format&fit=crop&w=${size}&h=${size}&crop=top&q=85`
}

function preloadImage(src: string) {
  return new Promise<void>(resolve => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
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

async function fetchQueryPages(query: string) {
  const pages: UnsplashPhotoView[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await fetchSearchPage(query, page)
    if (batch.length === 0) break
    pages.push(...batch)
  }
  return pages
}

async function fetchAllPhotos(): Promise<GridPhoto[]> {
  if (photoCache) return photoCache

  const results = await Promise.all(SEARCH_QUERIES.map(fetchQueryPages))
  const seen = new Set<string>()
  const unique: GridPhoto[] = []

  for (const photo of results.flat()) {
    if (seen.has(photo.id)) continue
    seen.add(photo.id)
    unique.push({
      ...photo,
      tileSrc: tileUrl(photo.urls.small, TILE_PX * 2),
    })
  }

  photoCache = unique
  return unique
}

function getPhotosPromise() {
  if (!photoCachePromise) {
    photoCachePromise = fetchAllPhotos()
  }
  return photoCachePromise
}

// Kick off API fetch as soon as this module loads in the browser
if (typeof window !== "undefined") {
  getPhotosPromise()
}

function PhotoTile({
  photo,
  priority,
}: {
  photo: GridPhoto
  priority?: boolean
}) {
  return (
    <a
      href={photo.links.html}
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
        const pool = await getPhotosPromise()
        if (cancelled || pool.length === 0) return

        // Decode first visible frames before revealing the section
        await Promise.all(pool.slice(0, PRELOAD_COUNT).map(p => preloadImage(p.tileSrc)))

        if (cancelled) return
        setPhotos(pool)
        setReady(true)
      } catch {
        if (!cancelled) setReady(false)
      }
    }

    prepare()
    return () => {
      cancelled = true
    }
  }, [ready])

  // No empty skeleton — section appears only when photos are warmed up
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
