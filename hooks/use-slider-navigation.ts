"use client"

import { useState, useCallback, useEffect } from "react"

interface UseSliderNavigationProps {
  totalSlides: number
  enableKeyboard?: boolean
}

interface UseSliderNavigationReturn {
  currentIndex: number
  goToNext: () => void
  goToPrev: () => void
  goToSlide: (index: number) => void
  goToFirst: () => void
  goToLast: () => void
}

export function useSliderNavigation({
  totalSlides,
  enableKeyboard = true,
}: UseSliderNavigationProps): UseSliderNavigationReturn {
  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1))
  }, [totalSlides])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)))
    },
    [totalSlides],
  )

  const goToFirst = useCallback(() => {
    setCurrentIndex(0)
  }, [])

  const goToLast = useCallback(() => {
    setCurrentIndex(totalSlides - 1)
  }, [totalSlides])

  useEffect(() => {
    if (!enableKeyboard) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Never steal keys from text fields (typing "a" or "d" used to flip the slider) or shortcuts.
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
          goToNext()
          break
        case "ArrowLeft":
        case "a":
        case "A":
          goToPrev()
          break
        case "Home":
          goToFirst()
          break
        case "End":
          goToLast()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enableKeyboard, goToNext, goToPrev, goToFirst, goToLast])

  return {
    currentIndex,
    goToNext,
    goToPrev,
    goToSlide,
    goToFirst,
    goToLast,
  }
}
