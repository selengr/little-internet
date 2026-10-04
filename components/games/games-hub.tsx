'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Gamepad2, Layers, Swords, Zap } from 'lucide-react'
import { TriviaGame } from '@/components/games/trivia-game'
import { PokemonGame } from '@/components/games/pokemon-game'
import { MemoryCardsGame } from '@/components/games/memory-cards-game'
import { RpsGame } from '@/components/games/rps-game'
import { SITE_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

type Mode = 'trivia' | 'cards' | 'rps' | 'pokemon'

const MODES: {
  id: Mode
  label: string
  blurb: string
  icon: typeof Gamepad2
  accent: string
}[] = [
  {
    id: 'trivia',
    label: 'Trivia',
    blurb: '10 categories, any difficulty',
    icon: Gamepad2,
    accent: '#6366f1',
  },
  {
    id: 'pokemon',
    label: "Who's That Pokémon",
    blurb: 'Guess from the silhouette',
    icon: Zap,
    accent: '#f59e0b',
  },
  {
    id: 'cards',
    label: 'Memory Cards',
    blurb: 'Flip and match the pairs',
    icon: Layers,
    accent: '#0891b2',
  },
  {
    id: 'rps',
    label: 'Rock Paper Scissors',
    blurb: 'Best of five, no mercy',
    icon: Swords,
    accent: '#10b981',
  },
]

const MODE_IDS = MODES.map(m => m.id)

function readModeFromParams(params: URLSearchParams): Mode {
  const raw = params.get('mode')
  return (MODE_IDS as string[]).includes(raw ?? '') ? (raw as Mode) : 'trivia'
}

export function GamesHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setModeState] = useState<Mode>(() => readModeFromParams(searchParams))
  const active = MODES.find(m => m.id === mode)!
  const ActiveIcon = active.icon

  const setMode = useCallback(
    (next: Mode) => {
      setModeState(next)
      const params = new URLSearchParams(searchParams.toString())
      params.set('mode', next)
      router.replace(`/games?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div>
      {/* Game switcher — a single-row segmented control, like a console's menu tabs. */}
      <div
        role="tablist"
        aria-label="Choose a game"
        className="mb-6 flex flex-wrap justify-center gap-1.5"
      >
        {MODES.map(m => {
          const Icon = m.icon
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMode(m.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-foreground/65 hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]',
              )}
              style={isActive ? { backgroundColor: m.accent } : undefined}
            >
              <Icon className="size-4" />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Selected game — a card with a quiet header naming it, then the game itself. */}
      <div className="rounded-3xl border border-black/[0.07] bg-card/40 p-5 backdrop-blur-sm dark:border-white/[0.09] sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${active.accent}17`, color: active.accent }}
          >
            <ActiveIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-foreground">{active.label}</div>
            <div className="truncate text-[12px] text-muted-foreground">{active.blurb}</div>
          </div>
        </div>

        {mode === 'trivia' && <TriviaGame shareUrl={`${SITE_URL}/games?mode=trivia`} />}
        {mode === 'pokemon' && <PokemonGame shareUrl={`${SITE_URL}/games?mode=pokemon`} />}
        {mode === 'cards' && <MemoryCardsGame shareUrl={`${SITE_URL}/games?mode=cards`} />}
        {mode === 'rps' && <RpsGame shareUrl={`${SITE_URL}/games?mode=rps`} />}
      </div>
    </div>
  )
}
