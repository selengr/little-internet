'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
const LAST_MODE_KEY = 'little-internet:last-game'

function readModeFromParams(params: URLSearchParams): Mode {
  const raw = params.get('mode')
  return (MODE_IDS as string[]).includes(raw ?? '') ? (raw as Mode) : 'trivia'
}

export function GamesHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setModeState] = useState<Mode>(() => readModeFromParams(searchParams))
  const active = MODES.find(m => m.id === mode)!
  const reduceMotion = useReducedMotion()
  const ActiveIcon = active.icon

  const setMode = useCallback(
    (next: Mode) => {
      try {
        localStorage.setItem(LAST_MODE_KEY, next)
      } catch {
        // private browsing / storage disabled — fine, it just won't be remembered
      }
      if (next === mode) return
      setModeState(next)
      const params = new URLSearchParams(searchParams.toString())
      params.set('mode', next)
      router.replace(`/games?${params.toString()}`, { scroll: false })
    },
    [mode, router, searchParams],
  )

  // No explicit ?mode= in the link — pick up where this visitor last left off,
  // the way a console remembers the last game you had open. Runs client-side
  // only, after the deterministic server-rendered default, so there's no
  // hydration mismatch — just a quick settle to the right game on arrival.
  useEffect(() => {
    if (searchParams.get('mode')) return
    try {
      const saved = localStorage.getItem(LAST_MODE_KEY)
      if (saved && (MODE_IDS as string[]).includes(saved)) {
        setModeState(saved as Mode)
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Left/Right (or Home/End) move focus between games, the standard ARIA tabs pattern.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % MODES.length
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + MODES.length) % MODES.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = MODES.length - 1
    if (nextIndex === null) return
    e.preventDefault()
    const next = MODES[nextIndex]
    setMode(next.id)
    tabRefs.current[next.id]?.focus()
  }

  return (
    <div>
      {/* The shelf — a row of game icons, like a console's home screen. */}
      <div role="tablist" aria-label="Choose a game" className="mb-7 flex justify-center gap-2.5 sm:gap-3.5">
        {MODES.map((m, index) => {
          const Icon = m.icon
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              ref={el => {
                tabRefs.current[m.id] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={m.label}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setMode(m.id)}
              onKeyDown={e => onTabKeyDown(e, index)}
              className="group flex flex-col items-center gap-1.5 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22 }}
          className="rounded-[28px] border bg-card/20 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-8 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
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
