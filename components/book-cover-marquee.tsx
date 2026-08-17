"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { UnsplashPhotoView } from "@/types/unsplash"

const TILE_PX = 49
const TILE_GAP = 8
const COLUMN_COUNTS = [6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6]
const TOTAL_SLOTS = COLUMN_COUNTS.reduce((sum, n) => sum + n, 0)
/** At least this many unique shots before the same one can appear again in the strip */
const MIN_REPEAT_GAP = 3
const SECTION_MIN_H = 6 * TILE_PX + 5 * TILE_GAP + 48

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

const INITIAL_PAGES = 2
const FULL_PAGES = 5
const PER_PAGE = 10
const PRELOAD_COUNT = 36
const PRELOAD_TIMEOUT_MS = 3500

type GridPhoto = {
  id: string
  alt: string
  tileSrc: string
  href: string
}

const FALLBACK_IDS = [
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
  "photo-1521737711867-e3b97375f902",
  "photo-1551434678-e076c223a692",
  "photo-1556761175-5973dc0f32e7",
  "photo-1563986768609-322da13575f3",
  "photo-1573164713714-d95e436ab8d6",
  "photo-1588196749597-9ff075978c01",
  "photo-1600880292089-90a7e086ee0c",
  "photo-1611224923853-80b023f02d71",
  "photo-1626785774573-4b799315345d",
  "photo-1642543499071-20e7562b3c96",
  "photo-1460925895917-afdab827c52f",
  "photo-1472286346138-688178124c04",
  "photo-1487058792275-0ad4aaf24ca7",
  "photo-1497215728101-856f4ea42174",
  "photo-1504384308090-c894fdcc538d",
  "photo-1517245386807-bb43f82c33c4",
  "photo-1522071820081-009f0129c71c",
  "photo-1532619675605-1ede6c2ed2a0",
  "photo-1542744173-8e7e53415bb0",
  "photo-1553877522-43269d4ea984",
]

const FALLBACK_PHOTOS: GridPhoto[] = FALLBACK_IDS.map((id, i) => ({
  id: `fallback-${id}`,
  alt: "Curated photo",
  tileSrc: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=98&h=98&crop=top&q=85`,
  href: "https://unsplash.com",
}))

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

function mergeUnique(primary: GridPhoto[], extra: GridPhoto[]) {
  const seen = new Set(primary.map(p => p.id))
  const out = [...primary]
  for (const photo of extra) {
    if (seen.has(photo.id)) continue
    seen.add(photo.id)
    out.push(photo)
  }
  return out
}

/** Spread repeats — same image won't appear within the next N slots */
function buildSpacedSequence(photos: GridPhoto[], length: number, minGap = MIN_REPEAT_GAP) {
  if (photos.length === 0) return []

  let pool = photos
  if (pool.length <= minGap) {
    pool = mergeUnique(pool, FALLBACK_PHOTOS)
  }

  const sequence: GridPhoto[] = []
  const recent: string[] = []
  let scan = 0

  for (let i = 0; i < length; i++) {
    let picked: GridPhoto | null = null

    for (let attempt = 0; attempt < pool.length; attempt++) {
      const candidate = pool[(scan + attempt) % pool.length]
      if (!recent.slice(-minGap).includes(candidate.id)) {
        picked = candidate
        scan = (scan + attempt + 1) % pool.length
        break
      }
    }

    if (!picked) picked = pool[i % pool.length]

    sequence.push(picked)
    recent.push(picked.id)
    if (recent.length > minGap * 2) recent.splice(0, recent.length - minGap * 2)
  }

  return sequence
}

function buildColumns(sequence: GridPhoto[]) {
  let cursor = 0
  return COLUMN_COUNTS.map((count, colIndex) => {
    const column = sequence.slice(cursor, cursor + count)
    cursor += count
    return { id: colIndex, photos: column }
  })
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
      style={{ width: TILE_PX, height: TILE_PX, minWidth: TILE_PX, minHeight: TILE_PX }}
      title={photo.alt}
    >
      <img
        src={photo.tileSrc}
        alt={photo.alt}
        width={TILE_PX}
        height={TILE_PX}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover object-top opacity-90 transition-opacity group-hover:opacity-100"
      />
    </a>
  )
}

function MarqueeTrack({ columns }: { columns: ReturnType<typeof buildColumns> }) {
  return (
    <div className="flex items-center px-2" style={{ gap: TILE_GAP }}>
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
}

export function BookCoverMarquee() {
  const [photos, setPhotos] = useState<GridPhoto[]>(() => photoCache ?? [])
  const [ready, setReady] = useState(() => Boolean(photoCache?.length))

  const columns = useMemo(() => {
    const sequence = buildSpacedSequence(photos, TOTAL_SLOTS, MIN_REPEAT_GAP)
    return buildColumns(sequence)
  }, [photos])

  useEffect(() => {
    if (ready) return

    let cancelled = false

    async function prepare() {
      try {
        let pool = await fetchPages(INITIAL_PAGES)
        if (pool.length === 0) pool = FALLBACK_PHOTOS
        else if (pool.length < 40) pool = mergeUnique(pool, FALLBACK_PHOTOS)

        await preloadWithTimeout(pool, PRELOAD_COUNT)
        if (cancelled) return

        photoCache = pool
        setPhotos(pool)
        setReady(true)

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

  return (
    <section
      className="relative overflow-hidden bg-transparent py-6"
      style={{ minHeight: SECTION_MIN_H, maxHeight: 500 }}
      aria-hidden={!ready}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent md:w-24" />

      <div
        className={cn(
          "flex overflow-hidden motion-reduce:[&_*]:!animate-none transition-opacity duration-500",
          ready ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {ready && photos.length > 0 && (
          <div
            className="flex shrink-0 will-change-transform"
            style={{ animation: "unsplashMarqueeLeft 50s linear infinite" }}
          >
            <MarqueeTrack columns={columns} />
            <MarqueeTrack columns={columns} />
          </div>
        )}
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
