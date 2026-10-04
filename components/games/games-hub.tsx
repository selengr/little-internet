'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
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
  shelfLabel: string
  blurb: string
  icon: typeof Gamepad2
  accent: string
}[] = [
  {
    id: 'trivia',
    label: 'Trivia',
    shelfLabel: 'Trivia',
    blurb: '10 categories, any difficulty',
    icon: Gamepad2,
    accent: '#6366f1',
  },
  {
    id: 'pokemon',
    label: "Who's That Pokémon",
    shelfLabel: 'Pokémon',
    blurb: 'Guess from the silhouette',
    icon: Zap,
    accent: '#f59e0b',
  },
  {
    id: 'cards',
    label: 'Memory Cards',
    shelfLabel: 'Cards',
    blurb: 'Flip and match the pairs',
    icon: Layers,
    accent: '#0891b2',
  },
  {
    id: 'rps',
    label: 'Rock Paper Scissors',
    shelfLabel: 'RPS',
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
      if (next === mode) return
      setModeState(next)
      const params = new URLSearchParams(searchParams.toString())
      params.set('mode', next)
      router.replace(`/games?${params.toString()}`, { scroll: false })
    },
    [mode, router, searchParams],
  )

  return (
    <div>
      {/* The shelf — a row of game icons, like a console's home screen. */}
      <div role="tablist" aria-label="Choose a game" className="mb-7 flex justify-center gap-2.5 sm:gap-3.5">
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
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-2xl transition-all duration-200 sm:size-14',
                  isActive ? 'scale-[1.06] text-white shadow-md' : 'text-foreground/55 group-hover:text-foreground',
                )}
                style={{
                  backgroundColor: isActive ? m.accent : `${m.accent}14`,
                  boxShadow: isActive ? `0 8px 20px -8px ${m.accent}80` : undefined,
                }}
              >
                <Icon className="size-5 sm:size-6" />
              </span>
              <span
                className={cn(
                  'text-[10.5px] transition-colors',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground/80',
                )}
              >
                {m.shelfLabel}
              </span>
            </button>
          )
        })}
      </div>

      {/* The stage — selected game, in a panel softly tinted with its own colour. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="rounded-[28px] border p-5 sm:p-8"
          style={{
            borderColor: `${active.accent}26`,
            backgroundImage: `linear-gradient(180deg, ${active.accent}0f, transparent 45%)`,
          }}
        >
          <div className="mb-7 flex items-center gap-3.5">
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-white sm:size-12"
              style={{ backgroundColor: active.accent }}
            >
              <ActiveIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-semibold text-foreground sm:text-[17px]">{active.label}</h2>
              <p className="truncate text-[12.5px] text-muted-foreground">{active.blurb}</p>
            </div>
          </div>

          {mode === 'trivia' && <TriviaGame shareUrl={`${SITE_URL}/games?mode=trivia`} />}
          {mode === 'pokemon' && <PokemonGame shareUrl={`${SITE_URL}/games?mode=pokemon`} />}
          {mode === 'cards' && <MemoryCardsGame shareUrl={`${SITE_URL}/games?mode=cards`} />}
          {mode === 'rps' && <RpsGame shareUrl={`${SITE_URL}/games?mode=rps`} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
