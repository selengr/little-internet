'use client'

import { isGameId, type GameId } from '@/lib/games-catalog'

// Personal-best tracking for the /games arcade, stored in the visitor's own
// browser — no account, no server round trip. Each game picks whichever
// metric makes sense (accuracy %, time, streak) and whether a higher or
// lower number is the win.

const PREFIX = 'li-games-best:'

/** Last opened arcade table on /games — used by Surprise me / Last table. */
export const GAMES_LAST_MODE_KEY = 'li-games-last-mode'

export function getLastPlayedGameId(): GameId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(GAMES_LAST_MODE_KEY)
    return isGameId(raw) ? raw : null
  } catch {
    return null
  }
}

export function setLastPlayedGameId(id: GameId) {
  try {
    window.localStorage.setItem(GAMES_LAST_MODE_KEY, id)
  } catch {
    /* quota or private mode */
  }
}

export function getBestScore(key: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  } catch {
    // Private browsing, storage disabled, or a full quota — the game still
    // works, it just won't remember a best score this visit.
    return null
  }
}

/** Saves `value` as the new best if it beats the stored one, and returns whichever is now best. */
/** Scoreboard keys on picker cards — only games that persist a best in localStorage. */
export const ARCADE_BEST_SCORE_KEYS: Partial<
  Record<GameId, { storageKey: string; higherIsBetter: boolean; label: string }>
> = {
  chess: { storageKey: 'chess', higherIsBetter: true, label: 'Best puzzles' },
  rps: { storageKey: 'rps', higherIsBetter: true, label: 'Best streak' },
  higherlower: { storageKey: 'higherlower', higherIsBetter: true, label: 'Best run' },
}

export function saveBestScore(key: string, value: number, higherIsBetter: boolean): number {
  const current = getBestScore(key)
  const best = current === null ? value : higherIsBetter ? Math.max(current, value) : Math.min(current, value)
  try {
    window.localStorage.setItem(PREFIX + key, String(best))
  } catch {
    // Same as above — a failed write just means the best isn't remembered.
  }
  return best
}
