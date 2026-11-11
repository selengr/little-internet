'use client'

import { GAMES, type GameId } from '@/lib/games-catalog'

export function GamesRecentStrip({
  recentIds,
  onOpen,
}: {
  recentIds: GameId[]
  onOpen: (id: GameId) => void
}) {
  if (!recentIds.length) return null

  return (
    <div className="mx-auto mt-4 flex max-w-lg flex-wrap items-center justify-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">Recent</span>
      {recentIds.map(id => {
        const game = GAMES.find(g => g.id === id)
        if (!game) return null
        return (
          <button
            key={id}
            type="button"
            onClick={() => onOpen(id)}
            className="rounded-full border border-border bg-card/80 px-2.5 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {game.name}
          </button>
        )
      })}
    </div>
  )
}
