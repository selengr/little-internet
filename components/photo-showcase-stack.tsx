"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import type { UnsplashPhotoView } from "@/types/unsplash"

interface ShowcaseCategory {
  id: string
  label: string
  query: string
  title: string
  desc: string
}

// ids match PHOTO_CATEGORIES in lib/unsplash.ts so cards deep-link straight
// into the matching filter on the /photos page.
const CATEGORIES: ShowcaseCategory[] = [
  {
    id: "nature",
    label: "NATURE",
    query: "nature landscape",
    title: "Nature & landscapes",
    desc: "Mountains, forests, and untouched wilderness — pulled live from Unsplash.",
  },
  {
    id: "architecture",
    label: "ARCHITECTURE",
    query: "architecture",
    title: "Architecture & cities",
    desc: "Striking structures and skylines, refreshed automatically every few seconds.",
  },
  {
    id: "people",
    label: "PORTRAITS",
    query: "people portrait",
    title: "People & portraits",
    desc: "Candid moments and studio portraits from creators around the world.",
  },
  {
    id: "space",
    label: "SPACE",
    query: "space galaxy",
    title: "Space & galaxies",
    desc: "Nebulae, stars, and cosmic wonder — a rotating window into the cosmos.",
  },
]

const STICKY_TOP  = 80   // matches top: 80px on first card
const STICKY_STEP = 16   // each card stacks 16px lower
const SCALE_STEP  = 0.04 // scale reduction per card stacked on top
const OFFSET_STEP = 8    // px pushed down per card stacked on top
const ROTATE_MS   = 4200 // how often one random card swaps its photo

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
      {children}
    </span>
  )
}

const MOBILE_MASK =
  "linear-gradient(to bottom, black 0%, black 40%, transparent 88%)"
const DESKTOP_MASK =
  "linear-gradient(to right, transparent 0%, black 28%, black 62%, transparent 94%)"

export function PhotoShowcaseStack() {
  const router = useRouter()
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  // depth[i] = how many cards are currently stacked on top of card i
  const [depth, setDepth] = useState<number[]>(CATEGORIES.map(() => 0))
  const [pools, setPools] = useState<UnsplashPhotoView[][]>(CATEGORIES.map(() => []))
  const [activeIdx, setActiveIdx] = useState<number[]>(CATEGORIES.map(() => 0))

  // Fetch a small rotating pool of photos per category
  useEffect(() => {
    let cancelled = false
    async function load() {
      const results = await Promise.all(
        CATEGORIES.map(async cat => {
          try {
            const params = new URLSearchParams({
              action: "search",
              query: cat.query,
              per_page: "6",
              order_by: "latest",
            })
            const res = await fetch(`/api/unsplash?${params}`, { cache: "no-store" })
            const json = await res.json()
            return (json.photos ?? []) as UnsplashPhotoView[]
          } catch {
            return []
          }
        }),
      )
      if (!cancelled) setPools(results)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Every few seconds, advance one random card to the next photo in its pool
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx(prev => {
        const eligible = CATEGORIES.map((_, i) => i).filter(i => pools[i]?.length > 1)
        if (!eligible.length) return prev
        const pick = eligible[Math.floor(Math.random() * eligible.length)]
        const next = [...prev]
        next[pick] = (next[pick] + 1) % pools[pick].length
        return next
      })
    }, ROTATE_MS)
    return () => clearInterval(interval)
  }, [pools])

  useEffect(() => {
    function onScroll() {
      const nextDepth = CATEGORIES.map((_, i) => {
        let count = 0
        for (let j = i + 1; j < CATEGORIES.length; j++) {
          const el = cardRefs.current[j]
          if (!el) continue
          const rect = el.getBoundingClientRect()
          const stickyTopJ = STICKY_TOP + j * STICKY_STEP
          if (rect.top <= stickyTopJ + 2) count++
        }
        return count
      })
      setDepth(nextDepth)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="flex flex-col" style={{ perspective: "1400px", perspectiveOrigin: "50% 0%" }}>
      {CATEGORIES.map((cat, i) => {
        const d = depth[i]
        const scale = 1 - d * SCALE_STEP
        const translateY = d * OFFSET_STEP
        const pool = pools[i]
        const photo = pool?.length ? pool[activeIdx[i] % pool.length] : undefined

        return (
          <div
            key={cat.id}
            ref={el => { cardRefs.current[i] = el }}
            className="sticky mb-4"
            style={{ top: `${STICKY_TOP + i * STICKY_STEP}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform:      `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "top center",
                transition:     "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange:     "transform",
              }}
            >
              <button
                type="button"
                onClick={() => router.push(`/photos?category=${cat.id}`)}
                className="group relative block w-full text-left bg-[#faf9f7] rounded-2xl border border-black/[0.07] overflow-hidden cursor-pointer"
              >
                {/* ── MOBILE: image top, fades out at bottom ── */}
                <div className="relative w-full h-56 pointer-events-none md:hidden overflow-hidden bg-stone-200/60">
                  <AnimatePresence>
                    {photo && (
                      <motion.img
                        key={photo.id}
                        src={photo.urls.regular}
                        alt={photo.alt}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        style={{ maskImage: MOBILE_MASK, WebkitMaskImage: MOBILE_MASK }}
                      />
                    )}
                  </AnimatePresence>
                  {!photo && <div className="absolute inset-0 animate-pulse bg-stone-300/50" />}
                </div>

                {/* ── DESKTOP: image right, visible mid-card then dissolving before the edge ── */}
                <div className="hidden md:block absolute inset-y-0 right-0 w-[58%] overflow-hidden pointer-events-none">
                  <AnimatePresence>
                    {photo && (
                      <motion.img
                        key={photo.id}
                        src={photo.urls.regular}
                        alt={photo.alt}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.9, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        style={{ maskImage: DESKTOP_MASK, WebkitMaskImage: DESKTOP_MASK }}
                      />
                    )}
                  </AnimatePresence>
                  {!photo && <div className="absolute inset-0 animate-pulse bg-stone-200/60" />}
                </div>

                {/* Text content */}
                <div className="relative z-10 p-8">
                  <div className="md:max-w-[54%]">
                    <div className="flex items-center justify-between mb-6">
                      <Tag>{cat.label}</Tag>
                      <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] text-black/30 tracking-widest uppercase">
                        <span className="relative flex size-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    </div>
                    <h3 className="text-xl font-light mb-3">{cat.title}</h3>
                    <p className="text-sm text-black/45 leading-relaxed mb-3">{cat.desc}</p>
                    <p className="text-xs italic text-black/35 mb-8 min-h-[1.5em]">
                      {photo ? `“${photo.alt}” — ${photo.photographer.name}` : "\u00A0"}
                    </p>
                  </div>
                  <div className="flex items-end gap-8 pt-6 border-t border-black/[0.06]">
                    <div>
                      <div className="text-2xl font-light tabular-nums">
                        {photo ? formatPhotoCount(photo.likes) : "—"}
                      </div>
                      <div className="text-[11px] text-black/35 tracking-widest mt-0.5">downloads</div>
                    </div>
                    <div>
                      <div className="text-2xl font-light tabular-nums">
                        {photo ? new Date(photo.createdAt).getFullYear() : "—"}
                      </div>
                      <div className="text-[11px] text-black/35 tracking-widest mt-0.5">captured</div>
                    </div>
                    <div className="ml-auto text-xs text-black/40 group-hover:text-black/70 group-hover:translate-x-0.5 transition-all">
                      Explore →
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
