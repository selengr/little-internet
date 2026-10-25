'use client'

import { useState } from 'react'
import {
  dealerHits,
  handTotal,
  isBlackjack,
  outcomeLine,
  returnedChips,
  settle,
  type Outcome,
  type PlayingCard,
} from '@/lib/blackjack'
import { cn } from '@/lib/utils'

const BETS = [10, 25, 50] as const
const STARTING_BANK = 200

type Phase = 'bet' | 'player' | 'done'

async function shuffleDeck() {
  const res = await fetch('/api/cards?action=shuffle')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'shuffle')
  return json as { deckId: string; remaining: number }
}

async function drawCards(deckId: string, count: number) {
  const res = await fetch(`/api/cards?action=draw&deck=${deckId}&count=${count}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'draw')
  return json as { cards: PlayingCard[]; remaining: number }
}

function CardFace({ card, hidden }: { card?: PlayingCard; hidden?: boolean }) {
  if (hidden || !card) {
    return (
      <div
        className="relative h-[148px] w-[104px] shrink-0 overflow-hidden border-2 border-[#1a1612] bg-[#1a1612] shadow-[6px_6px_0_0_#e23d28] dark:border-[#f3efe6] dark:shadow-[6px_6px_0_0_#e23d28] sm:h-[176px] sm:w-[124px]"
        aria-hidden
      >
        <div className="absolute inset-2 border border-[#f3efe6]/30" />
        <div className="absolute inset-0 opacity-80 [background-image:repeating-linear-gradient(135deg,#e23d28_0_8px,transparent_8px_16px)]" />
        <span className="absolute inset-0 flex items-center justify-center font-pixel text-[11px] tracking-[0.28em] text-[#f3efe6]">
          LI
        </span>
      </div>
    )
  }

  return (
    <img
      src={card.svg}
      alt={`${card.value} of ${card.suit}`}
      className="h-[148px] w-[104px] shrink-0 border-2 border-[#1a1612] bg-white object-cover shadow-[6px_6px_0_0_#1a1612] dark:border-[#f3efe6] dark:shadow-[6px_6px_0_0_#c8b8a4] sm:h-[176px] sm:w-[124px]"
    />
  )
}

function Hand({
  label,
  cards,
  hideHole,
}: {
  label: string
  cards: PlayingCard[]
  hideHole?: boolean
}) {
  const visible = hideHole ? cards.slice(0, 1) : cards
  const total = visible.length ? handTotal(visible) : null
  const slots: Array<PlayingCard | 'hole'> = hideHole && cards.length > 1 ? [cards[0], 'hole'] : cards

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="font-pixel text-[10px] tracking-[0.32em] uppercase">{label}</p>
        <p className="font-pixel text-[12px] tabular-nums">
          {total ? (total.soft && total.total !== 21 ? `${total.total} soft` : total.total) : '—'}
        </p>
      </div>
      <div className="flex min-h-[148px] items-end sm:min-h-[176px]">
        {slots.length === 0 && (
          <div className="h-[148px] w-[104px] border-2 border-dashed border-[#1a1612]/25 dark:border-[#f3efe6]/20 sm:h-[176px] sm:w-[124px]" />
        )}
        {slots.map((slot, i) => (
          <div key={slot === 'hole' ? 'hole' : `${slot.code}-${i}`} className={cn(i > 0 && '-ml-8 sm:-ml-10')}>
            {slot === 'hole' ? <CardFace hidden /> : <CardFace card={slot} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export function BlackjackTable() {
  const [bank, setBank] = useState(STARTING_BANK)
  const [bet, setBet] = useState<(typeof BETS)[number]>(25)
  const [stake, setStake] = useState(0)
  const [deckId, setDeckId] = useState<string | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [player, setPlayer] = useState<PlayingCard[]>([])
  const [dealer, setDealer] = useState<PlayingCard[]>([])
  const [phase, setPhase] = useState<Phase>('bet')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [doubled, setDoubled] = useState(false)

  async function ensureDeck(currentId: string | null, left: number) {
    if (currentId && left >= 12) return { deckId: currentId, remaining: left }
    const fresh = await shuffleDeck()
    setDeckId(fresh.deckId)
    setRemaining(fresh.remaining)
    return fresh
  }

  function finish(nextPlayer: PlayingCard[], nextDealer: PlayingCard[], handStake: number) {
    const result = settle(nextPlayer, nextDealer)
    const back = returnedChips(result, handStake)
    setOutcome(result)
    setPhase('done')
    setBank(b => b + back)
  }

  async function playDealer(deck: string, left: number, shown: PlayingCard[], nextPlayer: PlayingCard[], handStake: number) {
    let cards = shown
    let deckLeft = left
    while (dealerHits(cards)) {
      const drawn = await drawCards(deck, 1)
      cards = [...cards, ...drawn.cards]
      deckLeft = drawn.remaining
      setDealer(cards)
      setRemaining(deckLeft)
    }
    finish(nextPlayer, cards, handStake)
  }

  async function deal() {
    if (busy || bank < bet) return
    setBusy(true)
    setError(null)
    setOutcome(null)
    setDoubled(false)
    try {
      const deck = await ensureDeck(deckId, remaining)
      const drawn = await drawCards(deck.deckId, 4)
      const nextPlayer = [drawn.cards[0], drawn.cards[2]]
      const nextDealer = [drawn.cards[1], drawn.cards[3]]
      setPlayer(nextPlayer)
      setDealer(nextDealer)
      setRemaining(drawn.remaining)
      setStake(bet)
      setBank(b => b - bet)
      setPhase('player')

      if (isBlackjack(nextPlayer)) {
        finish(nextPlayer, nextDealer, bet)
      }
    } catch {
      setError('Could not deal. Try once more.')
      setPhase('bet')
    } finally {
      setBusy(false)
    }
  }

  async function hit() {
    if (busy || phase !== 'player' || !deckId) return
    setBusy(true)
    setError(null)
    try {
      const drawn = await drawCards(deckId, 1)
      const next = [...player, ...drawn.cards]
      setPlayer(next)
      setRemaining(drawn.remaining)
      if (handTotal(next).total > 21) {
        finish(next, dealer, stake)
      } else if (handTotal(next).total === 21) {
        setBusy(false)
        await stand(next, stake)
        return
      }
    } catch {
      setError('The deck missed that card.')
    } finally {
      setBusy(false)
    }
  }

  async function stand(nextPlayer = player, handStake = stake) {
    if (busy || !deckId) return
    setBusy(true)
    setError(null)
    setPhase('done')
    try {
      await playDealer(deckId, remaining, dealer, nextPlayer, handStake)
    } catch {
      setError('Dealer could not finish the hand.')
      setPhase('player')
    } finally {
      setBusy(false)
    }
  }

  async function doubleDown() {
    if (busy || phase !== 'player' || player.length !== 2 || bank < stake || !deckId) return
    setBusy(true)
    setError(null)
    setDoubled(true)
    const handStake = stake * 2
    setBank(b => b - stake)
    setStake(handStake)
    try {
      const drawn = await drawCards(deckId, 1)
      const next = [...player, ...drawn.cards]
      setPlayer(next)
      setRemaining(drawn.remaining)
      if (handTotal(next).total > 21) {
        finish(next, dealer, handStake)
        setBusy(false)
        return
      }
      setBusy(false)
      await stand(next, handStake)
    } catch {
      setError('Double down failed.')
      setBusy(false)
    }
  }

  function resetBank() {
    setBank(STARTING_BANK)
    setPhase('bet')
    setPlayer([])
    setDealer([])
    setOutcome(null)
    setStake(0)
    setError(null)
  }

  const playerTotal = player.length ? handTotal(player).total : 0
  const canAct = phase === 'player' && !busy && !isBlackjack(player)
  const broke = bank < Math.min(...BETS) && phase === 'bet'

  return (
    <section className="relative border-2 border-[#1a1612] bg-[#f7f1e6] text-[#1a1612] dark:border-[#f3efe6] dark:bg-[#171512] dark:text-[#f3efe6]">
      <div className="pointer-events-none absolute -left-px top-8 h-16 w-3 bg-[#e23d28]" aria-hidden />
      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-10">
        <div className="min-w-0 space-y-10">
          <Hand label="Dealer" cards={dealer} hideHole={phase === 'player'} />
          <Hand label="You" cards={player} />
        </div>

        <aside className="flex flex-col justify-between gap-6 border-t-2 border-[#1a1612] pt-6 dark:border-[#f3efe6] lg:border-l-2 lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <p className="font-pixel text-[10px] tracking-[0.32em] uppercase">Bank</p>
            <p className="mt-1 text-5xl font-semibold leading-none tabular-nums tracking-tight">{bank}</p>
            <p className="mt-4 font-pixel text-[10px] tracking-[0.32em] uppercase">Stake</p>
            <p className="mt-1 text-2xl tabular-nums">{phase === 'bet' ? bet : stake || '—'}</p>
            {doubled && phase !== 'bet' && (
              <p className="mt-1 font-pixel text-[10px] tracking-[0.22em] text-[#e23d28]">DOUBLED</p>
            )}
          </div>

          {phase === 'bet' && (
            <div>
              <p className="font-pixel text-[10px] tracking-[0.32em] uppercase">Bet</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {BETS.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    disabled={bank < amount || busy}
                    onClick={() => setBet(amount)}
                    className={cn(
                      'border-2 px-2 py-2 font-pixel text-[12px] tracking-[0.14em] disabled:opacity-30',
                      bet === amount
                        ? 'border-[#1a1612] bg-[#1a1612] text-[#f3efe6] dark:border-[#f3efe6] dark:bg-[#f3efe6] dark:text-[#1a1612]'
                        : 'border-[#1a1612]/30 hover:border-[#1a1612] dark:border-[#f3efe6]/30 dark:hover:border-[#f3efe6]',
                    )}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {phase === 'bet' ? (
              <button
                type="button"
                onClick={broke ? resetBank : deal}
                disabled={busy || (!broke && bank < bet)}
                className="w-full border-2 border-[#e23d28] bg-[#e23d28] px-4 py-3 text-left text-sm font-semibold tracking-wide text-white disabled:opacity-40"
              >
                {broke ? 'Reset bank' : busy ? 'Dealing…' : 'Deal'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={hit}
                  disabled={!canAct || playerTotal >= 21}
                  className="w-full border-2 border-[#1a1612] bg-[#1a1612] px-4 py-3 text-left text-sm font-semibold tracking-wide text-[#f3efe6] disabled:opacity-30 dark:border-[#f3efe6] dark:bg-[#f3efe6] dark:text-[#1a1612]"
                >
                  Hit
                </button>
                <button
                  type="button"
                  onClick={() => stand()}
                  disabled={!canAct}
                  className="w-full border-2 border-[#1a1612] px-4 py-3 text-left text-sm font-semibold tracking-wide disabled:opacity-30 dark:border-[#f3efe6]"
                >
                  Stand
                </button>
                <button
                  type="button"
                  onClick={doubleDown}
                  disabled={!canAct || player.length !== 2 || bank < stake}
                  className="w-full border-2 border-[#1a1612]/30 px-4 py-3 text-left font-pixel text-[11px] tracking-[0.2em] disabled:opacity-30 dark:border-[#f3efe6]/30"
                >
                  Double
                </button>
              </>
            )}
            {phase === 'done' && (
              <button
                type="button"
                onClick={() => {
                  setPhase('bet')
                  setPlayer([])
                  setDealer([])
                  setOutcome(null)
                  setStake(0)
                  setDoubled(false)
                }}
                className="w-full border-2 border-[#e23d28] bg-[#e23d28] px-4 py-3 text-left text-sm font-semibold tracking-wide text-white"
              >
                Next hand
              </button>
            )}
          </div>
        </aside>
      </div>

      <div className="flex min-h-12 items-center justify-between gap-4 border-t-2 border-[#1a1612] px-5 py-3 dark:border-[#f3efe6] sm:px-8">
        <p className="text-sm">
          {error
            ? error
            : outcome
              ? outcomeLine(outcome)
              : phase === 'player'
                ? 'Hit, stand, or double.'
                : 'Dealer stands on 17. Blackjack pays 3 to 2.'}
        </p>
        <p className="hidden font-pixel text-[10px] tracking-[0.22em] sm:block">
          {remaining ? `${remaining} LEFT` : 'FRESH DECK'}
        </p>
      </div>
    </section>
  )
}
