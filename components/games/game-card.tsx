'use client'

import { GAME_MOOD_LABEL, type GameEntry } from '@/lib/games-catalog'
import { cn } from '@/lib/utils'

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
  pickerKey,
  isLastPlayed = false,
  personalBest,
}: {
  game: GameEntry
  onPlay: () => void
  index?: number
  /** Shown on the card and matched to keyboard digits 1–7. */
  pickerKey?: number
  isLastPlayed?: boolean
  personalBest?: { label: string; value: number }
}) {
  const Icon = game.icon

  return (
    <button
      type="button"
      onClick={onPlay}
      title={`${game.name} — ${game.tag} (${game.duration})`}
      aria-label={`Open ${game.name}: ${game.tag}. Typical round ${game.duration}.`}
      className={cn(
        'game-card-pop-in group relative flex aspect-[4/3] flex-col justify-between overflow-hidden rounded-[28px] p-4 text-left shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)] outline-none transition-transform duration-150 ease-out hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-white/60 active:scale-[0.96] active:translate-y-0 sm:rounded-[32px] sm:p-5',
        isLastPlayed && 'game-card-last-played',
      )}
      style={{
        backgroundImage: `linear-gradient(145deg, ${game.from}, ${game.to})`,
        animationDelay: `${index * 45}ms`,
      }}
    >
      {/* A couple of soft decorative circles — playful, not busy. */}
      {pickerKey !== undefined && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-black/25 text-[11px] font-bold tabular-nums text-white"
        >
          {pickerKey}
        </span>
      )}

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
        {personalBest !== undefined && (
          <span className="mt-1 block text-[10px] font-semibold text-white/90">
            {personalBest.label}: {personalBest.value}
          </span>
        )}
        <span className="mt-1 flex flex-wrap gap-1">
          <span className="inline-block rounded-full bg-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/85">
            {game.duration}
          </span>
          <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90">
            {GAME_MOOD_LABEL[game.mood]}
          </span>
        </span>
      </span>
    </button>
  )
}
