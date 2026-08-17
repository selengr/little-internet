"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { UnsplashPhotoView } from "@/types/unsplash"

const TILE_PX = 50
const TILE_GAP = 8
/** Base wave pattern — tripled so one loop half is wider than any screen (no duplicate halves visible) */
const BASE_COLUMN_COUNTS = [6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6]
const COLUMN_COUNTS = [...BASE_COLUMN_COUNTS, ...BASE_COLUMN_COUNTS, ...BASE_COLUMN_COUNTS]
const TOTAL_SLOTS = COLUMN_COUNTS.reduce((sum, n) => sum + n, 0)
const MIN_REPEAT_GAP = 18
const TRACK_H = 6 * TILE_PX + 5 * TILE_GAP
const SECTION_H = TRACK_H + 48
const MIN_POOL_BEFORE_SHOW = 180

const SEARCH_QUERIES = [
  "psychology portrait",
  "mental health therapy",
  "brain neuroscience",
  "programming developer",
  "software coding laptop",
  "computer technology desk",
  "books reading library",
  "study education student",
  "science laboratory research",
  "chemistry microscope",
  "habits productivity journal",
  "morning routine wellness",
  "english language learning",
  "writing notebook pen",
  "data science analytics",
  "startup office team",
  "mindfulness meditation",
  "yoga calm portrait",
  "architecture minimal",
  "nature forest portrait",
  "coffee shop work",
  "creative design studio",
  "mathematics physics",
  "robotics engineering",
]

const FETCH_PAGES = 5
const PER_PAGE = 30
const LATEST_PAGES = 4
const PRELOAD_COUNT = 64
const PRELOAD_TIMEOUT_MS = 6000

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
  "photo-1541961017774-22349e4a1262",
  "photo-1577083288073-40892c0860a4",
  "photo-1518998053901-5348d3961a04",
  "photo-1536924940846-227afb31e2a5",
  "photo-1550859492-d5da9d8e45f3",
  "photo-1482160549825-59d1b23cb208",
  "photo-1501472312651-726afe119ff1",
  "photo-1516026672322-bc52d61a55d5",
  "photo-1469474968028-56623f02e42e",
  "photo-1476514525535-07fb3b4ae5f1",
  "photo-1547981609-4b6bfe67ca0b",
  "photo-1564507592333-c60657eea523",
  "photo-1496442226666-8d4d0e62e6e9",
  "photo-1537996194471-e657df975ab4",
  "photo-1486406146926-c627a92ad1ab",
  "photo-1621761191319-c6fb62004040",
  "photo-1579621970795-87facc2f976d",
  "photo-1454165804606-c3d57bc86b40",
]

const FALLBACK_PHOTOS: GridPhoto[] = FALLBACK_IDS.map(id => ({
  id: `fallback-${id}`,
  alt: "Curated photo",
  tileSrc: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=100&h=100&crop=top&q=85`,
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

function shufflePhotos(photos: GridPhoto[], seed: number) {
  const arr = [...photos]
  let s = seed
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Prefer all-unique sequence when pool is large enough; otherwise maximize spacing */
function buildSpacedSequence(photos: GridPhoto[], length: number, minGap: number) {
  if (photos.length === 0) return []

  const merged = mergeUnique(photos, FALLBACK_PHOTOS)
  const pool = shufflePhotos(merged, length + merged.length)

  if (pool.length >= length) {
    return shufflePhotos(pool, length + 99).slice(0, length)
  }

  const gap = Math.max(minGap, Math.ceil(length / pool.length) + 4)
  const sequence: GridPhoto[] = []
  const recent: string[] = []
  let scan = 0

  for (let i = 0; i < length; i++) {
    let picked: GridPhoto | null = null

    for (let attempt = 0; attempt < pool.length; attempt++) {
      const candidate = pool[(scan + attempt) % pool.length]
      if (!recent.slice(-gap).includes(candidate.id)) {
        picked = candidate
        scan = (scan + attempt + 1) % pool.length
        break
      }
    }

    if (!picked) {
      picked =
        pool.find(p => !recent.slice(-Math.min(5, gap)).includes(p.id)) ??
        pool[(i + scan) % pool.length]
    }

    sequence.push(picked)
    recent.push(picked.id)
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
    if (!src) return resolve()
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

async function preloadWithTimeout(photos: GridPhoto[], limit: number) {
  await Promise.race([
    Promise.all(photos.slice(0, limit).map(p => preloadImage(p.tileSrc))),
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

function PhotoTile({
  photo,
  priority,
  loaded,
}: {
  photo: GridPhoto
  priority?: boolean
  loaded: boolean
}) {
  return (
    <a
      href={photo.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative block shrink-0 overflow-hidden rounded-[14px] bg-[#141414]",
        "hover:scale-[1.06] hover:transition-transform hover:duration-300",
      )}
      style={{
        width: TILE_PX,
        height: TILE_PX,
        minWidth: TILE_PX,
        minHeight: TILE_PX,
        maxWidth: TILE_PX,
        maxHeight: TILE_PX,
      }}
      title={photo.alt}
    >
      {loaded && photo.tileSrc ? (
        <img
          src={photo.tileSrc}
          alt={photo.alt}
          width={TILE_PX}
          height={TILE_PX}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          className="block h-full w-full object-cover object-top"
        />
      ) : null}
    </a>
  )
}

function MarqueeTrack({
  columns,
  loaded,
}: {
  columns: ReturnType<typeof buildColumns>
  loaded: boolean
}) {
  return (
    <div
      className="flex shrink-0 items-center px-2"
      style={{ gap: TILE_GAP, height: TRACK_H }}
    >
      {columns.map(col => (
        <div key={col.id} className="flex flex-col" style={{ gap: TILE_GAP }}>
          {col.photos.map((photo, i) => (
            <PhotoTile
              key={`${col.id}-${i}`}
              photo={photo}
              loaded={loaded}
              priority={col.id < 4 && i < 2}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function BookCoverMarquee() {
  const sequenceRef = useRef<GridPhoto[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  const placeholderSequence = useMemo(
    () => buildSpacedSequence(FALLBACK_PHOTOS, TOTAL_SLOTS, MIN_REPEAT_GAP),
    [],
  )

  const columns = useMemo(() => {
    const sequence = sequenceRef.current ?? placeholderSequence
    return buildColumns(sequence)
  }, [placeholderSequence, loaded])

  useEffect(() => {
    let cancelled = false

    async function prepare() {
      try {
        let pool = await fetchPages(INITIAL_PAGES)
        if (pool.length === 0) pool = FALLBACK_PHOTOS
        else pool = mergeUnique(pool, FALLBACK_PHOTOS)

        const sequence = buildSpacedSequence(pool, TOTAL_SLOTS, MIN_REPEAT_GAP)
        await preloadWithTimeout(sequence, PRELOAD_COUNT)
        if (cancelled) return

        sequenceRef.current = sequence
        photoCache = pool
        setLoaded(true)

        // Cache more for next visit — do not rebuild strip (prevents shift while moving)
        fetchPages(FULL_PAGES).then(full => {
          if (full.length > 0) photoCache = mergeUnique(full, FALLBACK_PHOTOS)
        })
      } catch {
        if (cancelled) return
        sequenceRef.current = buildSpacedSequence(FALLBACK_PHOTOS, TOTAL_SLOTS, MIN_REPEAT_GAP)
        setLoaded(true)
      }
    }

    prepare()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      className="relative overflow-hidden bg-transparent"
      style={{ height: SECTION_H, maxHeight: 500 }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent md:w-24" />

      <div
        className="flex items-center overflow-hidden py-6 motion-reduce:[&_*]:!animate-none"
        style={{ height: SECTION_H }}
      >
        <div
          className="flex shrink-0 will-change-transform"
          style={{
            height: TRACK_H,
            animation: "unsplashMarqueeLeft 90s linear infinite",
          }}
        >
          <MarqueeTrack columns={columns} loaded={loaded} />
          <MarqueeTrack columns={columns} loaded={loaded} />
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
