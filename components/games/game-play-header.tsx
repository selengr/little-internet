'use client'

import { ArrowLeft } from 'lucide-react'
import type { GameEntry } from '@/lib/games-catalog'

export function GamePlayHeader({ game, onBack }: { game: GameEntry; onBack: () => void }) {
  const Icon = game.icon

  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-foreground/70 transition-colors hover:bg-black/[0.04] active:scale-95 dark:border-white/15 dark:hover:bg-white/[0.06]"
        aria-label="Back to all games"
      >
        <ArrowLeft className="size-4" />
      </button>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ backgroundImage: `linear-gradient(145deg, ${game.from}, ${game.to})` }}
      >
        <Icon className="size-5" />
      </span>
      <h2 className="truncate text-[17px] font-extrabold text-foreground sm:text-[19px]">{game.name}</h2>
    </div>
  )
}
