'use client'

import { useEffect } from 'react'
import type { GameId } from '@/lib/games-catalog'

export function useGamesArcadeShortcuts(opts: {
  gameId: GameId | null
  onRandom: () => void
  onBackToGrid: () => void
}) {
  const { gameId, onRandom, onBackToGrid } = opts

  useEffect(() => {
    if (gameId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (e.metaKey || e.ctrlKey || e.altKey) return
        const t = e.target as HTMLElement
        if (t.closest('input, textarea, [contenteditable="true"]')) return
        e.preventDefault()
        onRandom()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameId, onRandom])

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
