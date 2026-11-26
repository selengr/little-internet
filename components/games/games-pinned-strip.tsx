'use client'

import { Pin } from 'lucide-react'
import { GAMES, type GameId } from '@/lib/games-catalog'

export function GamesPinnedStrip({
  pinnedIds,
  onOpen,
  onClearPinsView,
  pinsOnly,
}: {
  pinnedIds: GameId[]
  onOpen: (id: GameId) => void
  onClearPinsView?: () => void
  pinsOnly?: boolean
}) {
  if (!pinnedIds.length) return null

  return (
    <div
      className="mx-auto mt-3 flex max-w-lg flex-wrap items-center justify-center gap-1.5"
      aria-label="Pinned tables"
    >
      <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
        <Pin className="size-3" aria-hidden />
        Pinned
      </span>
      {pinnedIds.map(id => {
        const game = GAMES.find(g => g.id === id)
        if (!game) return null
        return (
          <button
            key={id}
            type="button"
            onClick={() => onOpen(id)}
            className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-foreground transition-colors hover:bg-amber-500/20"
          >
            {game.name}
          </button>
        )
      })}
      {pinsOnly && onClearPinsView && (
        <button
          type="button"
          onClick={onClearPinsView}
          className="rounded-full border border-dashed border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          Show all
        </button>
      )}
    </div>
  )
}