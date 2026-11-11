import type { GameId, GameMood } from '@/lib/games-catalog'
import { searchQueryToParam } from '@/lib/games/search-query'

export function buildGamesPickerPath(opts: {
  mode?: GameId | null
  mood?: GameMood | null
  q?: string | null
  help?: boolean
}) {
  const params = new URLSearchParams()
  if (opts.mode) params.set('mode', opts.mode)
  if (opts.mood) params.set('mood', opts.mood)
  const q = opts.q ? searchQueryToParam(opts.q) : null
  if (q) params.set('q', q)
  if (opts.help) params.set('help', '1')
  const query = params.toString()
  return query ? `/games?${query}` : '/games'
}
