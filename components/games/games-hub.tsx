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
  live: boolean
  from: string
  to: string
}[] = [
  {
    id: 'trivia',
    label: 'Trivia',
    blurb: '10 categories, any difficulty',
    icon: Gamepad2,
    live: true,
    from: '#6366f1',
    to: '#a855f7',
  },
  {
    id: 'pokemon',
    label: "Who's That Pokémon",
    blurb: 'Guess from the silhouette',
    icon: Zap,
    live: true,
    from: '#f59e0b',
    to: '#ef4444',
  },
  {
    id: 'cards',
    label: 'Memory Cards',
    blurb: 'Flip and match the pairs',
    icon: Layers,
    live: true,
    from: '#06b6d4',
    to: '#3b82f6',
  },
  {
    id: 'rps',
    label: 'Rock Paper Scissors',
    blurb: 'Best of five, no mercy',
    icon: Swords,
    live: true,
    from: '#10b981',
    to: '#14b8a6',
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
      <div className="mx-auto mb-12 grid max-w-3xl grid-cols-2 gap-3 px-2 sm:grid-cols-4 sm:gap-4">
        {MODES.map(m => {
          const Icon = m.icon
          const isActive = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => m.live && setMode(m.id)}
              disabled={!m.live}
              className={cn(
                'group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 sm:p-5',
                m.live && 'hover:-translate-y-0.5',
                isActive
                  ? 'border-transparent shadow-lg'
                  : m.live
                    ? 'border-black/[0.08] bg-card/40 hover:border-black/[0.14] dark:border-white/[0.1] dark:hover:border-white/[0.18]'
                    : 'cursor-not-allowed border-black/[0.05] bg-black/[0.015] dark:border-white/[0.05] dark:bg-white/[0.015]',
              )}
              style={
                isActive
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${m.from}, ${m.to})`,
                      boxShadow: `0 10px 30px -12px ${m.to}66`,
                    }
                  : undefined
              }
            >
              {!m.live && (
                <span className="absolute right-3 top-3 rounded-full bg-black/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:bg-white/[0.08]">
                  Soon
                </span>
              )}
              <span
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-xl',
                  isActive ? 'bg-white/20 text-white' : 'text-foreground/70',
                )}
                style={
                  !isActive
                    ? { backgroundImage: `linear-gradient(135deg, ${m.from}22, ${m.to}22)` }
                    : undefined
                }
              >
                <Icon className="size-4" />
              </span>
              <div>
                <div className={cn('text-[13.5px] font-medium', isActive ? 'text-white' : 'text-foreground')}>
                  {m.label}
                </div>
                <div className={cn('mt-0.5 text-[11.5px]', isActive ? 'text-white/75' : 'text-muted-foreground')}>
                  {m.blurb}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div
        className="rounded-[28px] border border-black/[0.06] bg-card/30 p-5 backdrop-blur-sm dark:border-white/[0.08] sm:p-8"
        style={{ boxShadow: `inset 0 1px 0 0 rgba(255,255,255,.4)` }}
      >
        <div
          className="mb-6 h-[3px] w-14 rounded-full"
          style={{ backgroundImage: `linear-gradient(90deg, ${active.from}, ${active.to})` }}
        />
        {mode === 'trivia' && <TriviaGame shareUrl={`${SITE_URL}/games?mode=trivia`} />}
        {mode === 'pokemon' && <PokemonGame shareUrl={`${SITE_URL}/games?mode=pokemon`} />}
        {mode === 'cards' && <MemoryCardsGame shareUrl={`${SITE_URL}/games?mode=cards`} />}
        {mode === 'rps' && <RpsGame shareUrl={`${SITE_URL}/games?mode=rps`} />}
      </div>
    </div>
  )
}
