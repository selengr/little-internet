import type { GameId, GameMood } from '@/lib/games-catalog'
import { pinsParamValue } from '@/lib/games/pins-param'
import { searchQueryToParam } from '@/lib/games/search-query'

/** Build `/games` with optional table mode, mood filter, search, pins, and help sheet. */
export function buildGamesPickerPath(opts: {
  mode?: GameId | null
  mood?: GameMood | null
  q?: string | null
  pins?: boolean
  help?: boolean
}) {
  const params = new URLSearchParams()
  if (opts.mode) params.set('mode', opts.mode)
  if (opts.mood) params.set('mood', opts.mood)
  const q = opts.q ? searchQueryToParam(opts.q) : null
  if (q) params.set('q', q)
  const pins = pinsParamValue(Boolean(opts.pins))
  if (pins) params.set('pins', pins)
  if (opts.help) params.set('help', '1')
  const query = params.toString()
  return query ? `/games?${query}` : '/games'
}
