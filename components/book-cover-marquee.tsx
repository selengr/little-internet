"use client"

import { useEffect, useMemo, useState, useCallback, type CSSProperties } from "react"
import Link from "next/link"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UnsplashPhotoView } from "@/types/unsplash"

const TILE_PX = 51
const TILE_GAP = 8
const LARGE_W = 720 // the photo shown in the viewer: 4:5 portrait
const LARGE_H = 900
/** Base wave pattern — tripled so one loop half is wider than any screen (no duplicate halves visible) */
const BASE_COLUMN_COUNTS = [6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6, 5, 4, 6, 5, 4, 5, 6, 4, 5, 6]
const COLUMN_COUNTS = [...BASE_COLUMN_COUNTS, ...BASE_COLUMN_COUNTS, ...BASE_COLUMN_COUNTS]
const TOTAL_SLOTS = COLUMN_COUNTS.reduce((sum, n) => sum + n, 0)
const MIN_REPEAT_GAP = 18
const TRACK_H = 6 * TILE_PX + 5 * TILE_GAP
const SECTION_H = TRACK_H + 48
const IMG_PX = TILE_PX * 2
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

/** Extra portrait batches — ~50+ unique images after dedupe */
const EXTRA_PORTRAIT_QUERIES = [
  "standing portrait full body",
  "editorial fashion portrait",
  "cinematic portrait person",
  "studio portrait professional",
  "artistic portrait photography",
  "dramatic portrait lighting",
  "street portrait candid",
  "minimal portrait aesthetic",
  "portrait photography emotion",
  "full length portrait standing",
]

const EXTRA_FETCH_PAGES = 2

const FETCH_PAGES = 5
const PER_PAGE = 30
const LATEST_PAGES = 4
const PRELOAD_COUNT = 64
const PRELOAD_TIMEOUT_MS = 6000

type GridPhoto = {
  id: string
  alt: string
  tileSrc: string
  largeSrc: string
  /** Dominant colour of the photo (hex); used for the viewer's lighting. */
  color?: string
  photographer?: { name: string; url: string }
  pageUrl?: string
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
  "photo-1600880292203-757bb62b4baf",
  "photo-1621761191319-c6fb62004040",
  "photo-1635070041078-e363dbe005cb",
  "photo-1498050108023-c5249f4df085",
  "photo-1521737711867-e3b97375f902",
  "photo-1551434678-e076c223a692",
  "photo-1556761175-5973dc0f32e7",
  "photo-1563986768609-322da13575f3",
  "photo-1573164713714-d95e436ab8d6",
  "photo-1600880292089-90a7e086ee0c",
  "photo-1611224923853-80b023f02d71",
  "photo-1626785774573-4b799315345d",
  "photo-1460925895917-afdab827c52f",
  "photo-1487058792275-0ad4aaf24ca7",
  "photo-1497215728101-856f4ea42174",
  "photo-1504384308090-c894fdcc538d",
  "photo-1517245386807-bb43f82c33c4",
  "photo-1522071820081-009f0129c71c",
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
  "photo-1579621970795-87facc2f976d",
  "photo-1454165804606-c3d57bc86b40",
]

function largeUrl(url: string) {
  const base = url.split("?")[0]
  return `${base}?auto=format&fit=crop&crop=faces,entropy&w=${LARGE_W}&h=${LARGE_H}&q=80`
}

const FALLBACK_PHOTOS: GridPhoto[] = FALLBACK_IDS.map(id => ({
  id: `fallback-${id}`,
  alt: "",
  tileSrc: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${IMG_PX}&h=${IMG_PX}&crop=top&q=85`,
  largeSrc: largeUrl(`https://images.unsplash.com/${id}`),
}))

let photoCache: GridPhoto[] | null = null

function tileUrl(url: string, size: number) {
  const base = url.split("?")[0]
  return `${base}?auto=format&fit=crop&w=${size}&h=${size}&crop=top&q=85`
}

function mapPhoto(photo: UnsplashPhotoView): GridPhoto {
  return {
    id: photo.id,
    alt: photo.alt || photo.description || "",
    tileSrc: tileUrl(photo.urls.small, IMG_PX),
    largeSrc: largeUrl(photo.urls.regular),
    color: photo.color || undefined,
    photographer: photo.photographer?.name
      ? { name: photo.photographer.name, url: photo.photographer.profileUrl }
      : undefined,
    pageUrl: photo.links?.html,
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
    const start = cursor
    cursor += count
    return { id: colIndex, start, photos: column }
  })
}

/** Which column and row a position in the flat photo sequence occupies. */
function locateSlot(index: number) {
  let acc = 0
  for (let col = 0; col < COLUMN_COUNTS.length; col++) {
    if (index < acc + COLUMN_COUNTS[col]) return { col, row: index - acc }
    acc += COLUMN_COUNTS[col]
  }
  return { col: 0, row: 0 }
}

const slotKeyFor = (index: number, trackId: string) => {
  const { col, row } = locateSlot(index)
  return `${trackId}-${col}-${row}`
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

async function fetchLatestPage(page: number) {
  const params = new URLSearchParams({
    action: "latest",
    per_page: String(PER_PAGE),
    page: String(page),
  })
  const res = await fetch(`/api/unsplash?${params}`, { cache: "no-store" })
  if (!res.ok) return [] as UnsplashPhotoView[]
  const json = await res.json()
  return (json.photos ?? []) as UnsplashPhotoView[]
}

async function fetchQueryPages(query: string, maxPages: number) {
  const photos: UnsplashPhotoView[] = []
  for (let page = 1; page <= maxPages; page++) {
    const batch = await fetchSearchPage(query, page)
    if (batch.length === 0) break
    photos.push(...batch)
  }
  return photos
}

function dedupePhotos(photos: UnsplashPhotoView[]) {
  const seen = new Set<string>()
  const unique: GridPhoto[] = []
  for (const photo of photos) {
    if (seen.has(photo.id)) continue
    seen.add(photo.id)
    unique.push(mapPhoto(photo))
  }
  return unique
}

async function fetchAllPhotos() {
  const [searchBatches, latestBatches, extraBatches] = await Promise.all([
    Promise.all(SEARCH_QUERIES.map(q => fetchQueryPages(q, FETCH_PAGES))),
    Promise.all(Array.from({ length: LATEST_PAGES }, (_, i) => fetchLatestPage(i + 1))),
    Promise.all(EXTRA_PORTRAIT_QUERIES.map(q => fetchQueryPages(q, EXTRA_FETCH_PAGES))),
  ])

  return dedupePhotos([
    ...searchBatches.flat(),
    ...latestBatches.flat(),
    ...extraBatches.flat(),
  ])
}

type Rect = { left: number; top: number; width: number; height: number }
/** `photo` is the photo that was picked, kept by value: the wall can reload its photo set after the viewer opens. */
type Selection = { index: number; trackId: "a" | "b"; origin: Rect; navigated: boolean; photo: GridPhoto }

// ─── Lighting ───────────────────────────────────────────────────────────────────────────────────
// The viewer is lit by the photo itself: a soft aura in its dominant colour behind the card (outside
// is where light reads best on a photo; inside it would wash the picture out), a thin light running
// along the card's inner edge, and a tint in the backdrop. The empty slot it leaves in the wall is
// small, so that one glows from the inside.

type Glow = { base: string; accent: string; soft: string }

function glowPalette(hex?: string): Glow {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "")
  let h = 215
  let s = 85
  let l = 62
  if (m) {
    const n = parseInt(m[1], 16)
    const r = ((n >> 16) & 255) / 255
    const g = ((n >> 8) & 255) / 255
    const b = (n & 255) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    const lum = (max + min) / 2
    if (d === 0) {
      s = 0
    } else {
      s = d / (1 - Math.abs(2 * lum - 1))
      h =
        max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
      h = (h * 60 + 360) % 360
      s = Math.min(100, Math.max(s * 100, 58)) // dull photo colours still need to glow
    }
    l = Math.min(66, Math.max(lum * 100, 54))
  }
  return {
    base: `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`,
    accent: `hsl(${Math.round((h + 42) % 360)} ${Math.round(s)}% ${Math.round(Math.min(72, l + 6))}%)`,
    soft: `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}% / 0.35)`,
  }
}

const WALL_LIGHT_CSS = `
  @property --wall-angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
  @property --wall-glow { syntax: '<color>'; initial-value: hsl(215 85% 62%); inherits: true; }
  @keyframes wall-spin { to { --wall-angle: 360deg; } }
  @keyframes wall-breathe { 0%, 100% { opacity: .42; } 50% { opacity: .72; } }
  @keyframes wall-slot-pulse { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
  .wall-backdrop {
    background: radial-gradient(70% 58% at 50% 46%, color-mix(in srgb, var(--wall-glow) 38%, transparent), rgba(3, 5, 10, .8) 74%);
    -webkit-backdrop-filter: blur(10px) saturate(1.15); backdrop-filter: blur(10px) saturate(1.15);
    transition: --wall-glow .7s ease;
  }
  .wall-aura {
    position: absolute; inset: -24px; z-index: -1; pointer-events: none; border-radius: 2.25rem;
    background: conic-gradient(from var(--wall-angle), var(--g-base), var(--g-accent), var(--g-base), var(--g-accent), var(--g-base));
    filter: blur(36px); opacity: .58;
    animation: wall-spin 18s linear infinite, wall-breathe 5.5s ease-in-out infinite;
  }
  .wall-rim {
    position: absolute; inset: 0; pointer-events: none; border-radius: 22px; padding: 1px;
    background: conic-gradient(from var(--wall-angle), transparent 0 48%, rgba(255,255,255,.9) 70%, var(--g-accent) 86%, transparent 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    animation: wall-spin 9s linear infinite;
  }
  .wall-slot { animation: wall-slot-pulse 2.2s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) { .wall-aura, .wall-rim, .wall-slot { animation: none; } }
`

// ─── Viewer ─────────────────────────────────────────────────────────────────────────────────────

const CARD_RATIO = LARGE_H / LARGE_W
const EASE = [0.22, 1, 0.36, 1] as const

function cardRect(): Rect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(vw * 0.92, 420, (vh * 0.84) / CARD_RATIO)
  const height = width * CARD_RATIO
  return { left: (vw - width) / 2, top: (vh - height) / 2, width, height }
}

/** A small, fast version of the large image, shown (lightly blurred) while the full one downloads. */
const midSrcOf = (largeSrc: string) => largeSrc.replace(`w=${LARGE_W}&h=${LARGE_H}&q=80`, "w=240&h=300&q=55")

function rectOfSlot(key: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-slot-key="${key}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const visible = r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight
  return visible ? { left: r.left, top: r.top, width: r.width, height: r.height } : null
}

function LightboxImage({ photo }: { photo: GridPhoto }) {
  const [sharp, setSharp] = useState(false)

  useEffect(() => {
    setSharp(false)
    const img = new Image()
    img.onload = () => setSharp(true)
    img.onerror = () => setSharp(true)
    img.src = photo.largeSrc
  }, [photo.largeSrc])

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* The small tile is already cached, so something is on screen the instant the card opens. */}
      <img
        src={photo.tileSrc}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
      />
      <img
        src={midSrcOf(photo.largeSrc)}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover blur-[3px]"
      />
      <img
        src={photo.largeSrc}
        alt={photo.alt}
        draggable={false}
        className={cn(
          "absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-500",
          sharp ? "opacity-100" : "opacity-0",
        )}
      />
    </motion.div>
  )
}

function PhotoLightbox({
  selection,
  photos,
  onClose,
  onStep,
}: {
  selection: Selection
  photos: GridPhoto[]
  onClose: () => void
  onStep: (delta: number) => void
}) {
  const reduce = useReducedMotion()
  const photo = selection.photo
  const position = useMemo(() => photos.findIndex(p => p.id === photo.id), [photos, photo.id])
  const [rect, setRect] = useState<Rect>(() => cardRect())
  const glow = useMemo(() => glowPalette(photo.color), [photo.color])

  useEffect(() => {
    const onResize = () => setRect(cardRect())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onStep(1)
      else if (e.key === "ArrowLeft") onStep(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onStep])

  // Load the neighbours ahead of time so stepping through feels instant.
  useEffect(() => {
    if (position < 0) return
    for (const d of [1, -1]) {
      const next = photos[(position + d + photos.length) % photos.length]
      if (next) void preloadImage(next.largeSrc)
    }
  }, [position, photos])

  // Closing flies back to the wall slot, unless the viewer has moved on to a photo whose slot is off screen.
  const sameSlot = photos[selection.index]?.id === photo.id
  const exitRect = useMemo(
    () =>
      !sameSlot
        ? null
        : selection.navigated
          ? rectOfSlot(slotKeyFor(selection.index, selection.trackId))
          : selection.origin,
    [selection, sameSlot],
  )

  const from = reduce ? rect : selection.origin
  const vars = { "--g-base": glow.base, "--g-accent": glow.accent, "--wall-glow": glow.base } as CSSProperties
  const label = photo.photographer ? `Photo by ${photo.photographer.name}` : "Photo"
  const utm = "utm_source=little_internet&utm_medium=referral"
  const withUtm = (url?: string) => (url ? `${url}${url.includes("?") ? "&" : "?"}${utm}` : undefined)

  const frost =
    "flex items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-colors hover:bg-black/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"

  return (
    <DialogPrimitive.Root open onOpenChange={open => !open && onClose()}>
      <DialogPrimitive.Portal>
        <style>{WALL_LIGHT_CSS}</style>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            className="wall-backdrop fixed inset-0 z-[190]"
            style={vars}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </DialogPrimitive.Overlay>

        <DialogPrimitive.Content asChild aria-describedby={undefined}>
          <motion.div
            className="fixed z-[200] outline-none"
            style={vars}
            initial={{ ...from, opacity: reduce ? 0 : 1 }}
            animate={{ ...rect, opacity: 1 }}
            exit={
              exitRect && !reduce
                ? { ...exitRect, opacity: 0, transition: { duration: 0.34, ease: EASE, opacity: { delay: 0.24, duration: 0.1 } } }
                : { opacity: 0, scale: 0.96, transition: { duration: 0.2 } }
            }
            transition={{ type: "spring", stiffness: 230, damping: 29, mass: 0.9 }}
          >
            <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>

            <motion.span
              aria-hidden
              className="wall-aura"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />

            <motion.div
              className="relative h-full w-full touch-pan-y overflow-hidden bg-neutral-900"
              initial={{ borderRadius: 14 }}
              animate={{ borderRadius: 22 }}
              drag="x"
              dragSnapToOrigin
              dragElastic={0.3}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -450) onStep(1)
                else if (info.offset.x > 70 || info.velocity.x > 450) onStep(-1)
              }}
            >
              <AnimatePresence initial={false}>
                <LightboxImage key={photo.id} photo={photo} />
              </AnimatePresence>

              {/* Light from the edge, reaching a little way into the photo. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[22px]"
                style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,.35), inset 0 0 44px -16px ${glow.base}` }}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

              <motion.div
                className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 sm:p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
              >
                <div className="min-w-0">
                  {photo.photographer && (
                    <a
                      href={withUtm(photo.photographer.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] font-medium text-white underline-offset-4 hover:underline"
                    >
                      {photo.photographer.name}
                    </a>
                  )}
                  {photo.alt && (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/70">{photo.alt}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/photos"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Explore photos
                  </Link>
                  {photo.pageUrl && (
                    <a
                      href={withUtm(photo.pageUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-white/25 bg-white/10 px-3.5 text-[13px] text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Unsplash
                      <ArrowUpRight className="size-3.5" aria-hidden />
                    </a>
                  )}
                </div>
              </motion.div>

              <DialogPrimitive.Close aria-label="Close photo" className={cn(frost, "absolute right-3 top-3 size-9")}>
                <X className="size-4" aria-hidden />
              </DialogPrimitive.Close>
              <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 font-mono text-[10px] tracking-wider text-white/80 backdrop-blur-md">
                {position >= 0 ? `${position + 1} / ${photos.length}` : "Photo"}
              </span>
            </motion.div>

            <span aria-hidden className="wall-rim" />

            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => onStep(-1)}
              className={cn(frost, "absolute left-2 top-1/2 size-10 -translate-y-1/2 md:-left-16 md:size-11")}
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => onStep(1)}
              className={cn(frost, "absolute right-2 top-1/2 size-10 -translate-y-1/2 md:-right-16 md:size-11")}
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ─── Wall ───────────────────────────────────────────────────────────────────────────────────────

function PhotoTile({
  photo,
  priority,
  showImage,
  slotKey,
  index,
  selected,
  broken,
  onOpen,
  onBroken,
}: {
  photo: GridPhoto
  priority?: boolean
  showImage: boolean
  slotKey: string
  index: number
  selected: boolean
  broken: boolean
  onOpen: (index: number, photo: GridPhoto, rect: DOMRect) => void
  onBroken: (id: string) => void
}) {
  const glow = useMemo(() => glowPalette(photo.color).base, [photo.color])

  return (
    <button
      type="button"
      data-slot-key={slotKey}
      aria-label={photo.alt ? `Open photo: ${photo.alt}` : "Open photo"}
      aria-haspopup="dialog"
      onClick={e => onOpen(index, photo, e.currentTarget.getBoundingClientRect())}
      // Start fetching the big image as early as possible: on hover for a mouse, on touch-down for a finger.
      onPointerEnter={() => {
        if (photo.largeSrc !== photo.tileSrc) void preloadImage(photo.largeSrc)
      }}
      onPointerDown={() => {
        if (photo.largeSrc !== photo.tileSrc) void preloadImage(photo.largeSrc)
      }}
      className={cn(
        "relative shrink-0 cursor-pointer overflow-hidden rounded-[14px] border-0 bg-[#141414] p-0 transition-[transform,box-shadow] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]",
        selected
          ? "z-20"
          : "z-0 hover:z-20 hover:scale-[1.14] hover:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5)] focus-visible:z-20 focus-visible:scale-[1.14]",
      )}
      style={{
        width: TILE_PX,
        height: TILE_PX,
        minWidth: TILE_PX,
        minHeight: TILE_PX,
        maxWidth: TILE_PX,
        maxHeight: TILE_PX,
        flex: `0 0 ${TILE_PX}px`,
      }}
    >
      <img
        src={photo.tileSrc}
        alt=""
        width={TILE_PX}
        height={TILE_PX}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onError={() => onBroken(photo.id)}
        className={cn(
          "block h-full w-full select-none object-cover object-top transition-[opacity,filter] duration-300",
          showImage && photo.tileSrc && !broken ? (selected ? "opacity-25 saturate-50" : "opacity-100") : "opacity-0",
        )}
      />
      {selected && (
        <span
          aria-hidden
          className="wall-slot pointer-events-none absolute inset-0 rounded-[14px]"
          style={{ boxShadow: `inset 0 0 0 1.5px ${glow}, inset 0 0 18px 2px ${glow}` }}
        />
      )}
    </button>
  )
}

function MarqueeTrack({
  columns,
  showImage,
  trackId,
  selectedKey,
  failed,
  onOpen,
  onBroken,
}: {
  columns: ReturnType<typeof buildColumns>
  showImage: boolean
  trackId: "a" | "b"
  selectedKey: string | null
  failed: Set<string>
  onOpen: (index: number, trackId: "a" | "b", photo: GridPhoto, rect: DOMRect) => void
  onBroken: (id: string) => void
}) {
  return (
    <div
      className="flex shrink-0 items-center px-2"
      style={{ gap: TILE_GAP, height: TRACK_H, minHeight: TRACK_H, maxHeight: TRACK_H }}
    >
      {columns.map(col => (
        <div
          key={col.id}
          className="flex shrink-0 flex-col"
          style={{ gap: TILE_GAP, width: TILE_PX }}
        >
          {col.photos.map((photo, i) => {
            const slotKey = `${trackId}-${col.id}-${i}`
            return (
              <PhotoTile
                key={slotKey}
                slotKey={slotKey}
                index={col.start + i}
                photo={photo}
                showImage={showImage}
                priority={col.id < 4 && i < 2}
                selected={selectedKey === slotKey}
                broken={failed.has(photo.id)}
                onOpen={(index, picked, rect) => onOpen(index, trackId, picked, rect)}
                onBroken={onBroken}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function BookCoverMarquee() {
  const [sequence, setSequence] = useState<GridPhoto[]>(() =>
    buildSpacedSequence(FALLBACK_PHOTOS, TOTAL_SLOTS, MIN_REPEAT_GAP),
  )
  const [pool, setPool] = useState<GridPhoto[]>(FALLBACK_PHOTOS)
  const [failed, setFailed] = useState<Set<string>>(() => new Set())
  const [showImage, setShowImage] = useState(true)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [hovering, setHovering] = useState(false)

  // A photo that no longer exists (old fallback ids, deleted shots) is swapped for a working spare.
  const photos = useMemo(() => {
    const inUse = new Set(sequence.map(p => p.id))
    const spare = pool.filter(p => !inUse.has(p.id) && !failed.has(p.id))
    let next = 0
    return sequence.map(p => (failed.has(p.id) ? (spare[next++] ?? p) : p))
  }, [sequence, pool, failed])

  const columns = useMemo(() => buildColumns(photos), [photos])

  const handleBroken = useCallback((id: string) => {
    setFailed(prev => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])

  const handleOpen = useCallback(
    (index: number, trackId: "a" | "b", photo: GridPhoto, rect: DOMRect) => {
      setSelection({
        index,
        trackId,
        photo,
        navigated: false,
        origin: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      })
    },
    [],
  )

  const handleClose = useCallback(() => setSelection(null), [])

  const handleStep = useCallback(
    (delta: number) => {
      setSelection(prev => {
        if (!prev) return prev
        const at = photos.findIndex(p => p.id === prev.photo.id)
        const index = ((at >= 0 ? at : prev.index) + delta + photos.length) % photos.length
        return { ...prev, index, photo: photos[index], navigated: true }
      })
    },
    [photos],
  )

  useEffect(() => {
    let cancelled = false

    async function prepare() {
      try {
        let fetched = await fetchAllPhotos()
        if (fetched.length === 0) fetched = FALLBACK_PHOTOS
        else fetched = mergeUnique(fetched, FALLBACK_PHOTOS)

        if (fetched.length < MIN_POOL_BEFORE_SHOW) {
          await new Promise(r => setTimeout(r, 800))
          fetched = mergeUnique(await fetchAllPhotos(), fetched)
        }

        const next = buildSpacedSequence(fetched, TOTAL_SLOTS, MIN_REPEAT_GAP)
        await preloadWithTimeout(
          next.filter(p => p.tileSrc),
          PRELOAD_COUNT,
        )
        if (cancelled) return

        photoCache = fetched
        setPool(fetched)
        setSequence(next)
        setShowImage(true)
      } catch {
        if (cancelled) return
        setSequence(buildSpacedSequence(FALLBACK_PHOTOS, TOTAL_SLOTS, MIN_REPEAT_GAP))
        setShowImage(true)
      }
    }

    prepare()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedKey =
    selection && photos[selection.index]?.id === selection.photo.id
      ? slotKeyFor(selection.index, selection.trackId)
      : null
  const paused = selection !== null || hovering

  return (
    <section
      className="relative w-full max-w-full overflow-x-clip bg-transparent [contain:layout]"
      style={{
        height: SECTION_H,
        minHeight: SECTION_H,
        maxHeight: SECTION_H,
      }}
      // Tiles move at ~55px/s, which makes them hard to click: hold the wall still while the mouse is on it.
      onPointerEnter={e => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <AnimatePresence>
        {selection && (
          <PhotoLightbox key="photo-lightbox" selection={selection} photos={photos} onClose={handleClose} onStep={handleStep} />
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12 md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12 md:w-24" />

      <div
        className="box-border flex items-center overflow-hidden py-6 motion-reduce:[&_*]:!animate-none"
        style={{ height: SECTION_H, minHeight: SECTION_H, maxHeight: SECTION_H }}
      >
        <div
          className="flex shrink-0 will-change-transform"
          style={{
            height: TRACK_H,
            minHeight: TRACK_H,
            maxHeight: TRACK_H,
            animation: "unsplashMarqueeLeft 90s linear infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {(["a", "b"] as const).map(trackId => (
            <MarqueeTrack
              key={trackId}
              trackId={trackId}
              columns={columns}
              showImage={showImage}
              selectedKey={selectedKey}
              failed={failed}
              onOpen={handleOpen}
              onBroken={handleBroken}
            />
          ))}
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
