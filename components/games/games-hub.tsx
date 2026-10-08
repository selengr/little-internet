'use client'

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GAMES, isGameId, type GameId } from '@/lib/games-catalog'
import { GameCard } from '@/components/games/game-card'
import { GamePlayHeader } from '@/components/games/game-play-header'
import { TriviaGame } from '@/components/games/trivia-game'
import { PokemonGame } from '@/components/games/pokemon-game'
import { RpsGame } from '@/components/games/rps-game'
import { ChessPuzzleGame } from '@/components/games/chess-puzzle-game'
import { SudokuGame } from '@/components/games/sudoku-game'
import { HigherLowerGame } from '@/components/games/higher-lower-game'
import { SITE_URL } from '@/lib/site'

export function GamesHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion()

  // null = showing the grid of games to pick from.
  const [gameId, setGameId] = useState<GameId | null>(() => {
    const raw = searchParams.get('mode')
    return isGameId(raw) ? raw : null
  })

  const openGame = useCallback(
    (id: GameId) => {
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

  // A direct link like /games?mode=chess opens straight into that game.
  // Otherwise every visit starts on the picker grid — no "remembers what you
  // last played" magic, so the page behaves the same way every time.
  const game = gameId ? GAMES.find(g => g.id === gameId) : null

  return (
    <div>
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
            <GamePlayHeader game={game} onBack={backToGrid} />
            <div
              className="rounded-[28px] border bg-card/20 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:p-7 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
              style={{
                borderColor: `${game.to}26`,
                backgroundImage: `linear-gradient(180deg, ${game.to}0f, transparent 45%)`,
              }}
            >
              {game.id === 'trivia' && <TriviaGame shareUrl={`${SITE_URL}/games?mode=trivia`} />}
              {game.id === 'pokemon' && <PokemonGame shareUrl={`${SITE_URL}/games?mode=pokemon`} />}
              {game.id === 'chess' && <ChessPuzzleGame shareUrl={`${SITE_URL}/games?mode=chess`} />}
              {game.id === 'sudoku' && <SudokuGame shareUrl={`${SITE_URL}/games?mode=sudoku`} />}
              {game.id === 'higherlower' && <HigherLowerGame shareUrl={`${SITE_URL}/games?mode=higherlower`} />}
              {game.id === 'rps' && <RpsGame shareUrl={`${SITE_URL}/games?mode=rps`} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
