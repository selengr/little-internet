import type { MemoryTile, PlayingCard } from '@/types/memory-cards'

export const CARD_BACK = 'https://deckofcardsapi.com/static/img/back.png'

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Draws `pairCount` unique cards from a fresh shuffled deck and doubles each into a matching pair. */
export async function dealMemoryBoard(pairCount: number): Promise<MemoryTile[]> {
  const newDeck = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1', {
    signal: AbortSignal.timeout(8000),
  }).then(r => r.json())

  if (!newDeck?.success || !newDeck.deck_id) {
    throw new Error('Could not shuffle a deck.')
  }

  const draw = await fetch(
    `https://deckofcardsapi.com/api/deck/${newDeck.deck_id}/draw/?count=${pairCount}`,
    { signal: AbortSignal.timeout(8000) },
  ).then(r => r.json())

  if (!draw?.success || !Array.isArray(draw.cards) || draw.cards.length < pairCount) {
    throw new Error('Could not draw cards.')
  }

  const cards: PlayingCard[] = draw.cards.map((c: PlayingCard) => ({
    code: c.code,
    image: c.image,
    value: c.value,
    suit: c.suit,
  }))

  const tiles: MemoryTile[] = cards.flatMap(card => [
    { id: `${card.code}-a`, card, matched: false },
    { id: `${card.code}-b`, card, matched: false },
  ])

  return shuffle(tiles)
}
