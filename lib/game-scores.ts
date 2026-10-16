'use client'

// Personal-best tracking for the /games arcade, stored in the visitor's own
// browser — no account, no server round trip. Each game picks whichever
// metric makes sense (accuracy %, time, streak) and whether a higher or
// lower number is the win.

const PREFIX = 'li-games-best:'

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
