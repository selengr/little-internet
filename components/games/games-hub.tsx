'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Gamepad2 } from 'lucide-react'
import {
  GAME_COUNT,
  GAMES,
  gameShareUrl,
  isGameId,
  type GameId,
  type GameMood,
} from '@/lib/games-catalog'
import { adjacentGameId } from '@/lib/games/adjacent-table'
import { buildGamesPickerPath } from '@/lib/games/build-picker-url'
import { gamePickerIndex } from '@/lib/games/picker-index'
import { getPinnedTableIds, togglePinnedTableId } from '@/lib/games/pinned-tables'
import { getRecentTableIds, pushRecentTableId } from '@/lib/games/recent-tables'
import { normalizeSearchQueryParam } from '@/lib/games/search-query'
import { filterPickerGames, isGameMood } from '@/lib/games/filter-picker'
import { gameAtPickerIndex } from '@/lib/games/find-game'
import { shouldOpenArcadeHelp } from '@/lib/games/help-param'
import { pickRandomGame } from '@/lib/games/random-picker'
import { ARCADE_BEST_SCORE_KEYS, getBestScore, getLastPlayedGameId, setLastPlayedGameId } from '@/lib/game-scores'
import { useGamesArcadeDocTitle } from '@/components/games/games-arcade-doc-title'
import { useGamesArcadeShortcuts } from '@/components/games/games-arcade-shortcuts'
import { GameCard } from '@/components/games/game-card'
import { GamePlayHeader } from '@/components/games/game-play-header'
import { GamesLiveRegion } from '@/components/games/games-live-region'
import { GamesPickerToolbar } from '@/components/games/games-picker-toolbar'
import { GamesPickerFilters } from '@/components/games/games-picker-filters'
import { GamesArcadeHelp } from '@/components/games/games-arcade-help'
import { GameStage } from '@/components/games/game-stage'
import { GamesActiveTable } from '@/components/games/games-active-table'
import { GamesPickerEmpty } from '@/components/games/games-picker-empty'
import { GamesPickerGrid } from '@/components/games/games-picker-grid'
import { GamesRecentStrip } from '@/components/games/games-recent-strip'

export function GamesHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reduceMotion = useReducedMotion()

  // null = showing the grid of games to pick from.
  const [gameId, setGameId] = useState<GameId | null>(() => {
    const raw = searchParams.get('mode')
    return isGameId(raw) ? raw : null
  })

  const [lastPlayedId, setLastPlayedId] = useState<GameId | null>(null)
  const [personalBests, setPersonalBests] = useState<Partial<Record<GameId, { label: string; value: number }>>>({})
  const [pickerMood, setPickerMood] = useState<GameMood | null>(() => {
    const raw = searchParams.get('mood')
    return isGameMood(raw) ? raw : null
  })
  const [pickerSearch, setPickerSearch] = useState(() => normalizeSearchQueryParam(searchParams.get('q')))
  const [helpOpen, setHelpOpen] = useState(false)
  const [recentIds, setRecentIds] = useState<GameId[]>([])
  const [pinnedIds, setPinnedIds] = useState<GameId[]>([])
  const [pinnedOnly, setPinnedOnly] = useState(false)

  const refreshPickerMeta = useCallback(() => {
    setRecentIds(getRecentTableIds())
    setPinnedIds(getPinnedTableIds())
    setLastPlayedId(getLastPlayedGameId())
    const bests: Partial<Record<GameId, { label: string; value: number }>> = {}
    for (const entry of GAMES) {
      const meta = ARCADE_BEST_SCORE_KEYS[entry.id]
      if (!meta) continue
      const value = getBestScore(meta.storageKey)
      if (value !== null) bests[entry.id] = { label: meta.label, value }
    }
    setPersonalBests(bests)
  }, [])

  useEffect(() => {
    refreshPickerMeta()
  }, [refreshPickerMeta])

  useEffect(() => {
    if (shouldOpenArcadeHelp(searchParams.get('help'))) setHelpOpen(true)
  }, [searchParams])

  useEffect(() => {
    const moodRaw = searchParams.get('mood')
    const nextMood = isGameMood(moodRaw) ? moodRaw : null
    setPickerMood(prev => (prev === nextMood ? prev : nextMood))
    if (moodRaw && !isGameMood(moodRaw)) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('mood')
      const query = params.toString()
      router.replace(query ? `/games?${query}` : '/games', { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    const q = normalizeSearchQueryParam(searchParams.get('q'))
    setPickerSearch(prev => (prev === q ? prev : q))
  }, [searchParams])

  useEffect(() => {
    const raw = searchParams.get('mode')
    const next = isGameId(raw) ? raw : null
    setGameId(prev => (prev === next ? prev : next))
    if (raw && !isGameId(raw)) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('mode')
      const query = params.toString()
      router.replace(query ? `/games?${query}` : '/games', { scroll: false })
    }
  }, [searchParams, router])

  const openGame = useCallback(
    (id: GameId) => {
      setLastPlayedGameId(id)
      setLastPlayedId(id)
      setRecentIds(pushRecentTableId(id))
      setGameId(id)
      router.replace(
        buildGamesPickerPath({ mode: id, mood: pickerMood, q: pickerSearch }),
        { scroll: false },
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [router, pickerMood, pickerSearch],
  )

  const backToGrid = useCallback(() => {
    setGameId(null)
    refreshPickerMeta()
    router.replace(buildGamesPickerPath({ mood: pickerMood, q: pickerSearch }), { scroll: false })
  }, [router, refreshPickerMeta, pickerMood, pickerSearch])

  const filteredGames = useMemo(
    () =>
      filterPickerGames({
        mood: pickerMood,
        search: pickerSearch,
        pinnedOnly,
        pinnedIds,
      }),
    [pickerMood, pickerSearch, pinnedOnly, pinnedIds],
  )

  const game = gameId ? GAMES.find(g => g.id === gameId) : null

  const sectionLabel = useMemo(() => {
    if (game) return `${game.name} — playing`
    if (filteredGames.length !== GAME_COUNT) {
      return `Game picker — ${filteredGames.length} of ${GAME_COUNT} tables visible`
    }
    return 'Game picker — choose a table'
  }, [game, filteredGames.length])

  const pickRandom = useCallback(() => {
    const pool = filteredGames.length ? filteredGames : GAMES
    const pick = pickRandomGame(pool)
    if (pick) openGame(pick.id)
  }, [openGame, filteredGames])

  const resumeLast = useCallback(() => {
    const last = getLastPlayedGameId()
    if (last) openGame(last)
    else pickRandom()
  }, [openGame, pickRandom])

  const setMoodFilter = useCallback(
    (mood: GameMood | null) => {
      setPickerMood(mood)
      router.replace(buildGamesPickerPath({ mood, q: pickerSearch }), { scroll: false })
    },
    [router, pickerSearch],
  )

  const openAtIndex = useCallback(
    (index: number) => {
      const entry = gameAtPickerIndex(index)
      if (entry && filteredGames.some(g => g.id === entry.id)) openGame(entry.id)
    },
    [openGame, filteredGames],
  )

  const closeHelp = useCallback(() => {
    setHelpOpen(false)
    if (searchParams.get('help')) {
      router.replace(buildGamesPickerPath({ mood: pickerMood, q: pickerSearch }), { scroll: false })
    }
  }, [router, searchParams, pickerMood, pickerSearch])

  const openHelp = useCallback(() => {
    setHelpOpen(true)
    router.replace(buildGamesPickerPath({ mood: pickerMood, q: pickerSearch, help: true }), { scroll: false })
  }, [router, pickerMood, pickerSearch])

  const toggleHelp = useCallback(() => {
    if (helpOpen) closeHelp()
    else openHelp()
  }, [helpOpen, closeHelp, openHelp])

  const setPickerSearchWithUrl = useCallback(
    (value: string) => {
      setPickerSearch(value)
      router.replace(buildGamesPickerPath({ mood: pickerMood, q: value }), { scroll: false })
    },
    [router, pickerMood],
  )

  const clearPickerFilters = useCallback(() => {
    setPickerSearchWithUrl('')
    setMoodFilter(null)
  }, [setMoodFilter, setPickerSearchWithUrl])

  const focusPickerSearch = useCallback(() => {
    document.getElementById('games-picker-search')?.focus()
  }, [])

  const shuffleTable = useCallback(() => {
    if (!gameId) return
    const others = GAMES.filter(g => g.id !== gameId)
    const pick = pickRandomGame(others)
    if (pick) openGame(pick.id)
  }, [gameId, openGame])

  const goAdjacentTable = useCallback(
    (direction: 'prev' | 'next') => {
      if (!gameId) return
      openGame(adjacentGameId(gameId, direction))
    },
    [gameId, openGame],
  )

  const pickerTitleSuffix = useMemo(() => {
    if (gameId) return null
    if (pinnedOnly) return 'pinned'
    if (filteredGames.length !== GAME_COUNT) return `${filteredGames.length} shown`
    return null
  }, [gameId, pinnedOnly, filteredGames.length])

  const togglePin = useCallback((id: GameId) => {
    setPinnedIds(togglePinnedTableId(id))
  }, [])

  const openFirstFiltered = useCallback(() => {
    const first = filteredGames[0]
    if (first) openGame(first.id)
  }, [filteredGames, openGame])

  useGamesArcadeDocTitle(gameId, pickerTitleSuffix)
  useGamesArcadeShortcuts({
    gameId,
    onRandom: pickRandom,
    onBackToGrid: backToGrid,
    onOpenAtIndex: openAtIndex,
    onToggleHelp: toggleHelp,
    onFocusSearch: focusPickerSearch,
    onAdjacentTable: goAdjacentTable,
  })

  return (
    <div aria-label={sectionLabel}>
      <GamesLiveRegion message={sectionLabel} />
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
            {GAME_COUNT} quick tables — each one is a round with a clean scoreboard.
          </p>
          <GamesPickerToolbar onRandom={pickRandom} onResumeLast={resumeLast} onOpenHelp={openHelp} />
          <GamesRecentStrip recentIds={recentIds} onOpen={openGame} />
          <GamesPickerFilters
            mood={pickerMood}
            onMoodChange={setMoodFilter}
            search={pickerSearch}
            onSearchChange={setPickerSearchWithUrl}
            resultCount={filteredGames.length}
            onClearAll={clearPickerFilters}
            pinnedOnly={pinnedOnly}
            onPinnedOnlyChange={setPinnedOnly}
            onSearchSubmit={openFirstFiltered}
          />
        </div>
      )}
      <GamesArcadeHelp open={helpOpen} onClose={closeHelp} />
      <AnimatePresence mode="wait">
        {!game ? (
          <motion.div
            key="grid"
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <GamesPickerGrid>
              {filteredGames.length === 0 ? (
                <GamesPickerEmpty onReset={clearPickerFilters} />
              ) : (
                filteredGames.map((g, index) => (
                  <GameCard
                    key={g.id}
                    game={g}
                    index={index}
                    pickerKey={gamePickerIndex(g.id)}
                    isLastPlayed={lastPlayedId === g.id}
                    personalBest={personalBests[g.id]}
                    isPinned={pinnedIds.includes(g.id)}
                    onTogglePin={() => togglePin(g.id)}
                    onPlay={() => openGame(g.id)}
                  />
                ))
              )}
            </GamesPickerGrid>
          </motion.div>
        ) : (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
          >
            <GamePlayHeader
              game={game}
              shareUrl={gameShareUrl(game.id)}
              onBack={backToGrid}
              onShuffle={shuffleTable}
              onAdjacent={goAdjacentTable}
              tablePosition={{ index: gamePickerIndex(game.id), total: GAME_COUNT }}
            />
            <GameStage game={game}>
              <GamesActiveTable gameId={game.id} shareUrl={gameShareUrl(game.id)} />
            </GameStage>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
