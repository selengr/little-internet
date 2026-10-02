export interface PlayingCard {
  code: string
  image: string
  value: string
  suit: string
}

export interface MemoryTile {
  /** Unique per tile — two tiles share the same card but not this id. */
  id: string
  card: PlayingCard
  matched: boolean
}
