import { GAMES, type GameId } from '@/lib/games-catalog'
import { ARCADE_BEST_SCORE_KEYS, getBestScore } from '@/lib/game-scores'
import { SITE_URL } from '@/lib/site'

export type ArcadeBestLine = { gameId: GameId; name: string; label: string; value: number }

export function collectArcadeBests(): ArcadeBestLine[] {
  const rows: ArcadeBestLine[] = []
  for (const game of GAMES) {
    const meta = ARCADE_BEST_SCORE_KEYS[game.id]
    if (!meta) continue
    const value = getBestScore(meta.storageKey)
    if (value === null) continue
    rows.push({ gameId: game.id, name: game.name, label: meta.label, value })
  }
  const sudokuDiffs = ['easy', 'medium', 'hard'] as const
  for (const d of sudokuDiffs) {
    const value = getBestScore(`sudoku:${d}`)
    if (value === null) continue
    rows.push({
      gameId: 'sudoku',
      name: 'Sudoku',
      label: `${d} best time`,
      value,
    })
  }
  return rows
}

export function formatArcadeBestsShareText(origin = SITE_URL): string {
  const lines = collectArcadeBests()
  const base = origin.replace(/\/$/, '')
  if (lines.length === 0) {
    return `My Little Internet arcade scores (none saved yet) — pick a table: ${base}/games`
  }
  const body = lines.map(l => `• ${l.name}: ${l.label} ${l.value}`).join('\n')
  return `My Little Internet arcade bests:\n${body}\n\nTry the tables: ${base}/games`
}