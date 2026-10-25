export type PlayingCard = {
  code: string
  svg: string
  value: string
  suit: string
}

export type Outcome = 'blackjack' | 'win' | 'lose' | 'push' | 'bust'

const FACES = new Set(['KING', 'QUEEN', 'JACK'])

export function cardPoints(card: PlayingCard) {
  if (card.value === 'ACE') return 11
  if (FACES.has(card.value)) return 10
  return Number(card.value)
}

/** Best total, with aces dropping from 11 to 1 when the hand would bust. */
export function handTotal(cards: PlayingCard[]) {
  let total = 0
  let aces = 0
  for (const card of cards) {
    total += cardPoints(card)
    if (card.value === 'ACE') aces += 1
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces -= 1
  }
  return { total, soft: aces > 0 && total <= 21 }
}

export function isBlackjack(cards: PlayingCard[]) {
  return cards.length === 2 && handTotal(cards).total === 21
}

export function dealerHits(cards: PlayingCard[]) {
  return handTotal(cards).total < 17
}

export function settle(player: PlayingCard[], dealer: PlayingCard[]): Outcome {
  const playerTotal = handTotal(player).total
  const dealerTotal = handTotal(dealer).total
  if (playerTotal > 21) return 'bust'
  if (isBlackjack(player) && isBlackjack(dealer)) return 'push'
  if (isBlackjack(player)) return 'blackjack'
  if (dealerTotal > 21 || playerTotal > dealerTotal) return 'win'
  if (playerTotal < dealerTotal) return 'lose'
  return 'push'
}

/** Chips returned to the bank. The stake was already taken when the hand started. */
export function returnedChips(outcome: Outcome, stake: number) {
  if (outcome === 'blackjack') return Math.round(stake * 2.5)
  if (outcome === 'win') return stake * 2
  if (outcome === 'push') return stake
  return 0
}

export function outcomeLine(outcome: Outcome) {
  if (outcome === 'blackjack') return 'Blackjack. Paid 3 to 2.'
  if (outcome === 'win') return 'You take the hand.'
  if (outcome === 'push') return 'Push. Stake comes back.'
  if (outcome === 'bust') return 'Bust. The table keeps it.'
  return 'Dealer holds.'
}
