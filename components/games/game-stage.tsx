import type { ReactNode } from 'react'
import type { GameEntry } from '@/lib/games-catalog'

/** Tinted play surface shared by every arcade table. */
export function GameStage({ game, children }: { game: GameEntry; children: ReactNode }) {
  return (
    <div
      id="active-game-stage"
      className="rounded-[28px] border bg-card/20 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-7 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
      style={{
        borderColor: `${game.to}26`,
        backgroundImage: `linear-gradient(180deg, ${game.to}0f, transparent 45%)`,
      }}
    >
      {children}
    </div>
  )
}
