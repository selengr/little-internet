'use client'

import type { GameId } from '@/lib/games-catalog'
import { RickMortyGame } from '@/components/games/rick-morty-game'
import { TriviaGame } from '@/components/games/trivia-game'
import { PokemonGame } from '@/components/games/pokemon-game'
import { ChessPuzzleGame } from '@/components/games/chess-puzzle-game'
import { SudokuGame } from '@/components/games/sudoku-game'
import { HigherLowerGame } from '@/components/games/higher-lower-game'
import { RpsGame } from '@/components/games/rps-game'

export function GamesActiveTable({ gameId, shareUrl }: { gameId: GameId; shareUrl: string }) {
  switch (gameId) {
    case 'portal':
      return <RickMortyGame shareUrl={shareUrl} />
    case 'trivia':
      return <TriviaGame shareUrl={shareUrl} />
    case 'pokemon':
      return <PokemonGame shareUrl={shareUrl} />
    case 'chess':
      return <ChessPuzzleGame shareUrl={shareUrl} />
    case 'sudoku':
      return <SudokuGame shareUrl={shareUrl} />
    case 'higherlower':
      return <HigherLowerGame shareUrl={shareUrl} />
    case 'rps':
      return <RpsGame shareUrl={shareUrl} />
    default:
      return null
  }
}
