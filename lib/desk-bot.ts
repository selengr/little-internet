import type { OhlcBar, TapeRead } from '@/lib/desk-indicators'

export type DeskBotAction = 'buy' | 'sell' | 'wait'

export type DeskBotAdvice = {
  action: DeskBotAction
  /** One short plain line */
  tip: string
  buyFrom: number | null
  buyTo: number | null
  sellFrom: number | null
  sellTo: number | null
}

const MIN_BARS = 8
const DEFAULT_ATR_PCT = 1.5

function finite(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n) && n > 0
}

function normalizeZone(from: number | null, to: number | null): { from: number; to: number } | null {
  if (!finite(from) || !finite(to)) return null
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  if (hi <= 0) return null
  return { from: lo, to: hi }
}

function buildBuyZone(
  support: number | null,
  atrAbs: number | null,
  close: number | null,
): { from: number; to: number } | null {
  if (!finite(support) || !finite(atrAbs)) return null
  let from = support
  let to = support + atrAbs * 0.22
  if (finite(close) && close < to) to = Math.min(to, close)
  const zone = normalizeZone(from, to)
  if (!zone) return null
  if (zone.to - zone.from < zone.from * 1e-6) {
    const mid = (zone.from + zone.to) / 2
    const pad = Math.max(mid * 0.0001, atrAbs * 0.03)
    return { from: mid - pad, to: mid + pad }
  }
  return zone
}

function buildSellZone(
  resistance: number | null,
  atrAbs: number | null,
  close: number | null,
): { from: number; to: number } | null {
  if (!finite(resistance) || !finite(atrAbs)) return null
  let from = resistance - atrAbs * 0.22
  let to = resistance
  if (finite(close) && close > from) from = Math.max(from, close * 0.998)
  const zone = normalizeZone(from, to)
  if (!zone) return null
  if (zone.to - zone.from < zone.to * 1e-6) {
    const mid = (zone.from + zone.to) / 2
    const pad = Math.max(mid * 0.0001, atrAbs * 0.03)
    return { from: mid - pad, to: mid + pad }
  }
  return zone
}

function inZone(close: number, zone: { from: number; to: number } | null): boolean {
  if (!zone) return false
  return close >= zone.from && close <= zone.to
}

/** Educational buy/sell levels — not financial advice. */
export function buildDeskBotAdvice(
  bars: OhlcBar[],
  tape: TapeRead,
  price: number | null,
): DeskBotAdvice {
  const emptyZones = {
    buyFrom: null as number | null,
    buyTo: null as number | null,
    sellFrom: null as number | null,
    sellTo: null as number | null,
  }

  if (!Array.isArray(bars) || bars.length < MIN_BARS) {
    return { action: 'wait', tip: 'Need more chart data. Wait a bit.', ...emptyZones }
  }

  const lastBar = bars[bars.length - 1]
  const close = finite(price) ? price : finite(lastBar?.c) ? lastBar.c : null

  if (!finite(close)) {
    return { action: 'wait', tip: 'Price is loading. Wait.', ...emptyZones }
  }

  const atrPct = finite(tape.atrPct) ? tape.atrPct : DEFAULT_ATR_PCT
  const atrAbs = (close * atrPct) / 100

  const support = finite(tape.support) ? tape.support : null
  const resistance = finite(tape.resistance) ? tape.resistance : null

  const buyZone = buildBuyZone(support, atrAbs, close)
  const sellZone = buildSellZone(resistance, atrAbs, close)

  const buyFrom = buyZone?.from ?? null
  const buyTo = buyZone?.to ?? null
  const sellFrom = sellZone?.from ?? null
  const sellTo = sellZone?.to ?? null

  const bias = tape.bias ?? 'neutral'

  if (bias === 'neutral') {
    return {
      action: 'wait',
      tip: 'Not clear yet. Wait.',
      buyFrom,
      buyTo,
      sellFrom,
      sellTo,
    }
  }

  const nearHigh = resistance != null && close >= resistance * 0.985
  const nearLow = support != null && close <= support * 1.015
  const inBuy = inZone(close, buyZone)
  const inSell = inZone(close, sellZone)

  let action: DeskBotAction = 'wait'
  let tip = 'No clear level. Wait.'

  if (bias === 'constructive') {
    if (!buyZone) {
      tip = 'Going up, but no buy level yet. Wait.'
    } else if (nearHigh || inSell) {
      tip = 'Price is high. Wait to buy lower.'
    } else if (inBuy || nearLow) {
      action = 'buy'
      tip = 'Good spot to buy near the green zone.'
    } else if (support != null && close <= support + atrAbs * 0.75) {
      action = 'buy'
      tip = 'Buy if price dips to the green zone.'
    } else {
      tip = 'Going up — wait for a dip to buy.'
    }
  } else if (bias === 'cautious') {
    if (!sellZone) {
      tip = 'Going down, but no sell level yet. Wait.'
    } else if (nearLow || inBuy) {
      tip = 'Price is low. Wait to sell higher.'
    } else if (inSell || nearHigh) {
      action = 'sell'
      tip = 'Good spot to sell near the red zone.'
    } else if (resistance != null && close >= resistance - atrAbs * 0.75) {
      action = 'sell'
      tip = 'Sell if price rises to the red zone.'
    } else {
      tip = 'Going down — wait for a bounce to sell.'
    }
  }

  if (action === 'buy' && !buyZone) {
    action = 'wait'
    tip = 'No buy zone right now. Wait.'
  }
  if (action === 'sell' && !sellZone) {
    action = 'wait'
    tip = 'No sell zone right now. Wait.'
  }

  return { action, tip, buyFrom, buyTo, sellFrom, sellTo }
}
