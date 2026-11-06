'use client'

import { useEffect } from 'react'
import { GAMES, type GameId } from '@/lib/games-catalog'

/** Browser tab title while a table is open — returns on unmount. */
export function useGamesArcadeDocTitle(gameId: GameId | null) {
  useEffect(() => {
    if (!gameId) {
      document.title = 'Games — Little Internet'
      return
    }
    const g = GAMES.find(x => x.id === gameId)
    document.title = g ? `${g.name} — Games — Little Internet` : 'Games — Little Internet'
    return () => {
      document.title = 'Games — Little Internet'
    }
  }, [gameId])
}
