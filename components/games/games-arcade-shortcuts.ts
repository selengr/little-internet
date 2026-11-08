'use client'

import { useEffect } from 'react'
import type { GameId } from '@/lib/games-catalog'

export function useGamesArcadeShortcuts(opts: {
  gameId: GameId | null
  onRandom: () => void
  onBackToGrid: () => void
  onOpenAtIndex?: (index: number) => void
}) {
  const { gameId, onRandom, onBackToGrid, onOpenAtIndex } = opts

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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameId, onRandom, onOpenAtIndex])

  useEffect(() => {
    if (!gameId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault()
      onBackToGrid()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameId, onBackToGrid])
}
