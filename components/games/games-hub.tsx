'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Gamepad2, Sparkles } from 'lucide-react'
import { GAMES, gameShareUrl, isGameId, type GameId } from '@/lib/games-catalog'
import { getLastPlayedGameId, setLastPlayedGameId } from '@/lib/game-scores'
import { useGamesArcadeDocTitle } from '@/components/games/games-arcade-doc-title'
import { useGamesArcadeShortcuts } from '@/components/games/games-arcade-shortcuts'
import { GameCard } from '@/components/games/game-card'
import { GamePlayHeader } from '@/components/games/game-play-header'
import { TriviaGame } from '@/components/games/trivia-game'
import { PokemonGame } from '@/components/games/pokemon-game'
import { RpsGame } from '@/components/games/rps-game'
import { ChessPuzzleGame } from '@/components/games/chess-puzzle-game'
import { SudokuGame } from '@/components/games/sudoku-game'
import { HigherLowerGame } from '@/components/games/higher-lower-game'
import { RickMortyGame } from '@/components/games/rick-morty-game'

export function GamesHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion()

  // null = showing the grid of games to pick from.
  const [gameId, setGameId] = useState<GameId | null>(() => {
    const raw = searchParams.get('mode')
    return isGameId(raw) ? raw : null
  })

  useEffect(() => {
    const raw = searchParams.get('mode')
    const next = isGameId(raw) ? raw : null
    setGameId(prev => (prev === next ? prev : next))
  }, [searchParams])

  const openGame = useCallback(
    (id: GameId) => {
      setLastPlayedGameId(id)
      setGameId(id)
      const params = new URLSearchParams(searchParams.toString())
      params.set('mode', id)
      router.replace(`/games?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const backToGrid = useCallback(() => {
    setGameId(null)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('mode')
    const query = params.toString()
    router.replace(query ? `/games?${query}` : '/games', { scroll: false })
  }, [router, searchParams])

  const pickRandom = useCallback(() => {
    const pick = GAMES[Math.floor(Math.random() * GAMES.length)]!
    openGame(pick.id)
  }, [openGame])

  const resumeLast = useCallback(() => {
    const last = getLastPlayedGameId()
    if (last) openGame(last)
    else pickRandom()
  }, [openGame, pickRandom])

  // A direct link like /games?mode=chess opens straight into that game.
  // Otherwise every visit starts on the picker grid — no "remembers what you
  // last played" magic, so the page behaves the same way every time.
  const game = gameId ? GAMES.find(g => g.id === gameId) : null

  const sectionLabel = useMemo(
    () => (game ? `${game.name} — playing` : 'Game picker — choose a table'),
    [game],
  )

  useGamesArcadeDocTitle(gameId)
  useGamesArcadeShortcuts({ gameId, onRandom: pickRandom, onBackToGrid: backToGrid })

  return (
    <div aria-label={sectionLabel}>
      {/* The heading only makes sense on the picker grid — showing "Pick a
          game" above an in-progress game you already picked is confusing,
          so it lives here instead of the static page shell. */}
      {!game && (
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            <Gamepad2 className="size-9 shrink-0 text-indigo-500 sm:size-10" strokeWidth={2.25} />
            Pick a game
          </h1>
          <p className="mx-auto mt-2.5 max-w-xs text-[14.5px] text-muted-foreground sm:max-w-sm">
            {GAMES.length} quick tables — each one is a round with a clean scoreboard.{' '}
            <a href="/games-v2" className="underline underline-offset-2">
              New table
            </a>
          </p>
          <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={pickRandom}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:border-foreground/25 hover:bg-muted/60"
            >
              <Sparkles className="size-3.5 text-amber-500" aria-hidden />
              Surprise me
            </button>
            <button
              type="button"
              onClick={resumeLast}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              Last table
            </button>
          </div>
          <p className="mt-3 text-[10px] text-muted-foreground/80">
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">R</kbd> random ·{' '}
            <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Esc</kbd> back to grid
          </p>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!game ? (
          <motion.div
            key="grid"
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
          >
            {GAMES.map((g, index) => (
              <GameCard key={g.id} game={g} index={index} onPlay={() => openGame(g.id)} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <GamePlayHeader game={game} shareUrl={gameShareUrl(game.id)} onBack={backToGrid} />
            <div
              className="rounded-[28px] border bg-card/20 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-7 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              style={{
                borderColor: `${game.to}26`,
                backgroundImage: `linear-gradient(180deg, ${game.to}0f, transparent 45%)`,
              }}
            >
              {game.id === 'portal' && <RickMortyGame shareUrl={gameShareUrl('portal')} />}
              {game.id === 'trivia' && <TriviaGame shareUrl={gameShareUrl('trivia')} />}
              {game.id === 'pokemon' && <PokemonGame shareUrl={gameShareUrl('pokemon')} />}
              {game.id === 'chess' && <ChessPuzzleGame shareUrl={gameShareUrl('chess')} />}
              {game.id === 'sudoku' && <SudokuGame shareUrl={gameShareUrl('sudoku')} />}
              {game.id === 'higherlower' && <HigherLowerGame shareUrl={gameShareUrl('higherlower')} />}
              {game.id === 'rps' && <RpsGame shareUrl={gameShareUrl('rps')} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
