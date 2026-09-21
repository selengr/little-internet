import type { OhlcBar, TapeRead } from '@/lib/desk-indicators'

export type DeskBotAction = 'buy' | 'sell' | 'wait'

export type DeskBotAdvice = {
  action: DeskBotAction
  /** One short plain line, e.g. "Buy on a dip near support" */
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

/** Ensures from ≤ to; returns null if invalid. */
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
  let to = support + atrAbs * 0.55
  if (finite(close) && close < to) to = Math.min(to, close)
  const zone = normalizeZone(from, to)
  if (!zone) return null
  if (zone.to - zone.from < zone.from * 1e-6) {
    const mid = (zone.from + zone.to) / 2
    const pad = Math.max(mid * 0.0001, atrAbs * 0.05)
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
  let from = resistance - atrAbs * 0.55
  let to = resistance
  if (finite(close) && close > from) from = Math.max(from, close * 0.998)
  const zone = normalizeZone(from, to)
  if (!zone) return null
  if (zone.to - zone.from < zone.to * 1e-6) {
    const mid = (zone.from + zone.to) / 2
    const pad = Math.max(mid * 0.0001, atrAbs * 0.05)
    return { from: mid - pad, to: mid + pad }
  }
  return zone
}

function inZone(close: number, zone: { from: number; to: number } | null): boolean {
  if (!zone) return false
  return close >= zone.from && close <= zone.to
}

/** Educational buy/sell levels from tape — not financial advice. */
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
    return {
      action: 'wait',
      tip: 'Not enough chart history yet — wait for more bars before acting.',
      ...emptyZones,
    }
  }

  const lastBar = bars[bars.length - 1]
  const close = finite(price) ? price : finite(lastBar?.c) ? lastBar.c : null

  if (!finite(close)) {
    return {
      action: 'wait',
      tip: 'Live price is unavailable — wait for a quote.',
      ...emptyZones,
    }
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
      tip: 'Signals are mixed — wait for trend and momentum to align.',
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
  let tip = 'No clear edge — wait for price to reach a marked zone.'

  if (bias === 'constructive') {
    if (!buyZone) {
      action = 'wait'
      tip = 'Uptrend, but support is unclear — wait for a defined dip level.'
    } else if (nearHigh || inSell) {
      action = 'wait'
      tip = 'Uptrend, but price is high — wait for a dip into the buy zone.'
    } else if (inBuy || nearLow) {
      action = 'buy'
      tip = 'Uptrend — price is near support; the green zone is a reasonable buy area.'
    } else if (support != null && close <= support + atrAbs * 0.75) {
      action = 'buy'
      tip = 'Uptrend — buy on a pullback into the green zone.'
    } else {
      action = 'wait'
      tip = 'Uptrend, but price is above the buy zone — wait for a pullback.'
    }
  } else if (bias === 'cautious') {
    if (!sellZone) {
      action = 'wait'
      tip = 'Downtrend, but resistance is unclear — wait for a clearer rally level.'
    } else if (nearLow || inBuy) {
      action = 'wait'
      tip = 'Downtrend, but price is low — wait for a bounce into the sell zone.'
    } else if (inSell || nearHigh) {
      action = 'sell'
      tip = 'Downtrend — price is near resistance; the red zone is a reasonable sell area.'
    } else if (resistance != null && close >= resistance - atrAbs * 0.75) {
      action = 'sell'
      tip = 'Downtrend — sell on a bounce into the red zone.'
    } else {
      action = 'wait'
      tip = 'Downtrend, but price is below the sell zone — wait for a bounce.'
    }
  }

  if (action === 'buy' && !buyZone) {
    action = 'wait'
    tip = 'Buy signal faded — no valid buy zone on this chart.'
  }
  if (action === 'sell' && !sellZone) {
    action = 'wait'
    tip = 'Sell signal faded — no valid sell zone on this chart.'
  }

  return { action, tip, buyFrom, buyTo, sellFrom, sellTo }
}
