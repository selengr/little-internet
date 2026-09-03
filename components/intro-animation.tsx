"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

const LETTERS = ["R", "E", "Z", "A", "K", "A", "R", "B", "K", "H" , "S", "H"]

const LETTER_IN_STAGGER  = 90
const LETTER_IN_DUR      = 700
const HOLD_DURATION      = 300
const LETTERS_IN_TOTAL   = LETTER_IN_STAGGER * (LETTERS.length - 1) + LETTER_IN_DUR + HOLD_DURATION

const LETTER_OUT_STAGGER = 55
const LETTER_OUT_DUR     = 450
const LETTERS_OUT_TOTAL  = LETTER_OUT_STAGGER * (LETTERS.length - 1) + LETTER_OUT_DUR

const CURTAIN_DELAY      = LETTERS_IN_TOTAL + 100
const CURTAIN_DURATION   = 1300
const ANIM_TOTAL         = CURTAIN_DELAY + LETTERS_OUT_TOTAL + 1400

export const INTRO_DURATION_MS = CURTAIN_DELAY + CURTAIN_DURATION
export const HERO_REVEAL_MS = CURTAIN_DELAY + CURTAIN_DURATION - 150

type Phase = "idle" | "in" | "out" | "done"

const SKIP_INTRO_KEY = "skip-home-intro"

let usedHistoryNavigation = false

let visitedSubroute = false

function markHistoryNavigation() {
  usedHistoryNavigation = true
  try {
    sessionStorage.setItem(SKIP_INTRO_KEY, "1")
  } catch {}
}

function registerHistoryListeners() {
  if (typeof window === "undefined") return

  const w = window as Window & { __introHistoryHooked?: boolean }
  if (w.__introHistoryHooked) return
  w.__introHistoryHooked = true

  window.addEventListener("popstate", markHistoryNavigation)
  window.addEventListener("pageshow", (e: PageTransitionEvent) => {
    if (e.persisted) markHistoryNavigation()
  })
}

registerHistoryListeners()

function shouldSkipIntro(): boolean {
  if (typeof window === "undefined") return false

  if (usedHistoryNavigation || visitedSubroute) return true

  let navType: string | undefined
  try {
    navType = (
      performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
    )?.type
  } catch {}

  if (navType === "back_forward") {
    usedHistoryNavigation = true
    return true
  }

  try {
    if (navType === "reload" || navType === "navigate") {
      sessionStorage.removeItem(SKIP_INTRO_KEY)
      return false
    }

    if (sessionStorage.getItem(SKIP_INTRO_KEY) === "1") {
      sessionStorage.removeItem(SKIP_INTRO_KEY)
      usedHistoryNavigation = true
      return true
    }
  } catch {}

  return false
}

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [skip] = useState(() => shouldSkipIntro())
  const [phase, setPhase] = useState<Phase>(skip ? "done" : "idle")
  const [curtainUp, setCurtainUp] = useState(false)

  useEffect(() => {
    if (skip) {
      onDone()
      return
    }

    const t0 = setTimeout(() => setPhase("in"), 80)
    const t1 = setTimeout(() => setPhase("out"), LETTERS_IN_TOTAL)
    const t2 = setTimeout(() => setCurtainUp(true), CURTAIN_DELAY)
    const t3 = setTimeout(() => onDone(), HERO_REVEAL_MS)
    const t4 = setTimeout(() => setPhase("done"), ANIM_TOTAL)

    return () => {
      clearTimeout(t0)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [onDone, skip])

  if (skip || phase === "done") return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" aria-hidden="true">

      <div
        className="absolute inset-x-0 top-0"
        style={{
          bottom: curtainUp ? "100%" : "0%",
          transition: curtainUp ? "bottom 1.3s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
          background: "#f5f4f1",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex" style={{ gap: "0.06em" }}>
          {LETTERS.map((letter, i) => {
            const inDelay  = i * LETTER_IN_STAGGER
            const outDelay = i * LETTER_OUT_STAGGER

            const isIdle = phase === "idle"
            const isIn   = phase === "in"
            const isOut  = phase === "out"

            const opacity    = isIdle ? 0 : isIn ? 1 : 0
            const blur       = isIdle ? 36 : isIn ? 0 : 24
            const translateY = isIdle ? 48 : isIn ? 0 : -20

            const transition = isOut
              ? `opacity ${LETTER_OUT_DUR}ms cubic-bezier(0.4,0,1,1) ${outDelay}ms,
                 filter  ${LETTER_OUT_DUR}ms cubic-bezier(0.4,0,1,1) ${outDelay}ms,
                 transform ${LETTER_OUT_DUR}ms cubic-bezier(0.4,0,1,1) ${outDelay}ms`
              : isIn
              ? `opacity ${LETTER_IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${inDelay}ms,
                 filter  ${LETTER_IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${inDelay}ms,
                 transform ${LETTER_IN_DUR}ms cubic-bezier(0.16,1,0.3,1) ${inDelay}ms`
              : "none"

            return (
              <span
                key={i}
                className="font-sans font-bold text-[#111] leading-none select-none"
                style={{
                  fontSize: `calc((100vw - 64px) / ${LETTERS.length})`,
                  letterSpacing: "0.05em",
                  opacity,
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${translateY}px)`,
                  transition,
                  willChange: "opacity, filter, transform",
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export function HomeIntroSkipListener() {
  const pathname = usePathname()

  useEffect(() => {
    registerHistoryListeners()
  }, [])

  useEffect(() => {
    if (pathname && pathname !== "/") {
      visitedSubroute = true
      try {
        sessionStorage.setItem(SKIP_INTRO_KEY, "1")
      } catch {}
    }
  }, [pathname])

  return null
}
