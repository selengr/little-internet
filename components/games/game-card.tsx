'use client'

import type { GameEntry } from '@/lib/games-catalog'

/**
 * A big, bright, tappable card — the whole point is that a kid can look at
 * this grid and know exactly what to press, no reading required beyond the
 * one short name under the icon.
 */
export function GameCard({ game, onPlay }: { game: GameEntry; onPlay: () => void }) {
  const Icon = game.icon

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[28px] p-4 text-left shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)] outline-none transition-transform duration-150 ease-out hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.96] active:translate-y-0 sm:rounded-[32px] sm:p-5"
      style={{ backgroundImage: `linear-gradient(145deg, ${game.from}, ${game.to})` }}
    >
      {/* A couple of soft decorative circles — playful, not busy. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 size-28 rounded-full bg-white/10 transition-transform duration-300 group-hover:scale-110"
      />
      <span aria-hidden className="pointer-events-none absolute -top-6 -left-6 size-16 rounded-full bg-white/10" />

      <span className="relative flex size-12 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm sm:size-14">
        <Icon className="size-6 text-white sm:size-7" strokeWidth={2.25} />
      </span>

      <span className="relative">
        <span className="block text-[15px] font-extrabold leading-tight text-white sm:text-[17px]">{game.name}</span>
        <span className="mt-0.5 block text-[11.5px] font-medium text-white/80">{game.tag}</span>
      </span>
    </button>
  )
}
