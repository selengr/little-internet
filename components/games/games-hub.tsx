'use client'

import { useState } from 'react'
import { Gamepad2, Layers, Swords, Zap } from 'lucide-react'
import { TriviaGame } from '@/components/games/trivia-game'
import { PokemonGame } from '@/components/games/pokemon-game'
import { cn } from '@/lib/utils'

type Mode = 'trivia' | 'cards' | 'rps' | 'pokemon'

const MODES: { id: Mode; label: string; icon: typeof Gamepad2; live: boolean }[] = [
  { id: 'trivia', label: 'Trivia', icon: Gamepad2, live: true },
  { id: 'pokemon', label: "Who's That Pokémon", icon: Zap, live: true },
  { id: 'cards', label: 'Memory Cards', icon: Layers, live: false },
  { id: 'rps', label: 'Rock Paper Scissors', icon: Swords, live: false },
]

export function GamesHub() {
  const [mode, setMode] = useState<Mode>('trivia')

  return (
    <div>
      <div className="mx-auto mb-10 flex max-w-2xl flex-wrap justify-center gap-2.5 px-4">
        {MODES.map(m => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => m.live && setMode(m.id)}
              disabled={!m.live}
              className={cn(
                'relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] transition-colors',
                active
                  ? 'border-transparent bg-foreground text-background'
                  : m.live
                    ? 'border-black/10 text-foreground/70 hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]'
                    : 'cursor-not-allowed border-black/5 text-muted-foreground/60 dark:border-white/5',
              )}
            >
              <Icon className="size-3.5" />
              {m.label}
              {!m.live && (
                <span className="ml-0.5 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground dark:bg-white/[0.08]">
                  Soon
                </span>
              )}
            </button>
          )
        })}
      </div>

      {mode === 'trivia' && <TriviaGame />}
      {mode === 'pokemon' && <PokemonGame />}
    </div>
  )
}
