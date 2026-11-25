'use client'

import { useEffect } from 'react'
import type { GameId } from '@/lib/games-catalog'

export function useGamesArcadeShortcuts(opts: {
  gameId: GameId | null
  onRandom: () => void
  onBackToGrid: () => void
  onOpenAtIndex?: (index: number) => void
  onToggleHelp?: () => void
  onFocusSearch?: () => void
  onAdjacentTable?: (direction: 'prev' | 'next') => void
  onResumeLast?: () => void
}) {
  const { gameId, onRandom, onBackToGrid, onOpenAtIndex, onToggleHelp, onFocusSearch, onAdjacentTable, onResumeLast } =
    opts

  useEffect(() => {
    if (gameId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable="true"]')) return

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        onRandom()
        return
      }

      if (onOpenAtIndex && e.key >= '1' && e.key <= '7') {
        e.preventDefault()
        onOpenAtIndex(Number(e.key) - 1)
        return
      }

      if (onToggleHelp && e.key === '?') {
        e.preventDefault()
        onToggleHelp()
        return
      }

      if (onFocusSearch && e.key === '/') {
        e.preventDefault()
        onFocusSearch()
        return
      }

      if (onResumeLast && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault()
        onResumeLast()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameId, onRandom, onOpenAtIndex, onToggleHelp, onFocusSearch, onResumeLast])

  useEffect(() => {
    if (!gameId) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable="true"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onBackToGrid()
        return
      }

      if (!onAdjacentTable) return
      if (e.key === '[') {
        e.preventDefault()
        onAdjacentTable('prev')
      } else if (e.key === ']') {
        e.preventDefault()
        onAdjacentTable('next')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameId, onBackToGrid, onAdjacentTable])
}
