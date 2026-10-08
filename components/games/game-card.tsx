'use client'

import type { GameEntry } from '@/lib/games-catalog'

/**
 * A big, bright, tappable card — the whole point is that a kid can look at
 * this grid and know exactly what to press, no reading required beyond the
 * one short name under the icon.
 *
 * The entrance is a plain CSS animation (not framer-motion), always applied —
 * reduced-motion is handled by a CSS media query in globals.css (.game-card-pop-in),
 * not a JS hook. A hook like useReducedMotion() reads window.matchMedia, which can
 * disagree between the server render and the client's first paint and bake a real
 * hydration mismatch into the markup; a CSS media query is evaluated by the browser
 * itself and can't cause that. Pass `index` to stagger the delay.
 */
export function GameCard({
  game,
  onPlay,
  index = 0,
}: {
  game: GameEntry
  onPlay: () => void
  index?: number
}) {
  const Icon = game.icon

  return (
    <button
      type="button"
      onClick={onPlay}
      className="game-card-pop-in group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[28px] p-4 text-left shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)] outline-none transition-transform duration-150 ease-out hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.96] active:translate-y-0 sm:rounded-[32px] sm:p-5"
      style={{
        backgroundImage: `linear-gradient(145deg, ${game.from}, ${game.to})`,
        animationDelay: `${index * 45}ms`,
      }}
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
