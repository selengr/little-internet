'use client'

import { GAME_COUNT, GAME_MOOD_LABEL, type GameMood } from '@/lib/games-catalog'
import { moodTableCounts } from '@/lib/games/mood-counts'
import { cn } from '@/lib/utils'

const MOODS: (GameMood | null)[] = [null, 'quick', 'think', 'guess']

export function GamesPickerFilters({
  mood,
  onMoodChange,
  search,
  onSearchChange,
  resultCount,
  onClearAll,
  pinnedOnly = false,
  onPinnedOnlyChange,
  onSearchSubmit,
}: {
  mood: GameMood | null
  onMoodChange: (mood: GameMood | null) => void
  search: string
  onSearchChange: (value: string) => void
  resultCount: number
  onClearAll?: () => void
  pinnedOnly?: boolean
  onPinnedOnlyChange?: (value: boolean) => void
  onSearchSubmit?: () => void
}) {
  const hasFilters = mood !== null || search.trim().length > 0
  const moodCounts = moodTableCounts()

  return (
    <div className="mx-auto mt-5 flex w-full max-w-lg flex-col gap-3">
      <label className="sr-only" htmlFor="games-picker-search">
        Search tables
      </label>
      <input
        id="games-picker-search"
        type="search"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSearchSubmit?.()
        }}
        placeholder="Search by name, vibe, or 1–7…"
        autoComplete="off"
        className="w-full rounded-2xl border border-border bg-card/80 px-4 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-foreground/10"
      />
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="group" aria-label="Filter by mood">
        {MOODS.map(m => {
          const active = mood === m
          const label = m === null ? `All (${GAME_COUNT})` : `${GAME_MOOD_LABEL[m]} (${moodCounts[m]})`
          return (
            <button
              key={m ?? 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => onMoodChange(m)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors',
                active
                  ? 'border-foreground/25 bg-foreground text-background'
                  : 'border-border bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
      {onPinnedOnlyChange && (
        <label className="flex cursor-pointer items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={pinnedOnly}
            onChange={e => onPinnedOnlyChange(e.target.checked)}
            className="size-3.5 rounded border-border"
          />
          Pinned only
        </label>
      )}
      <h2 className="sr-only">Filter tables</h2>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <p className="text-[10px] text-muted-foreground/80" aria-live="polite">
          {resultCount === 0 ? 'No tables match — try another filter.' : `${resultCount} table${resultCount === 1 ? '' : 's'} showing`}
        </p>
        {hasFilters && onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[10px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
