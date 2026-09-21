export type OhlcBar = {
  t: number
  o: number
  h: number
  l: number
  c: number
  v?: number
}

export type Bias = 'constructive' | 'neutral' | 'cautious'

export type TapeRead = {
  bias: Bias
  score: number
  headline: string
  bullets: string[]
  rsi: number | null
  emaFast: number | null
  emaSlow: number | null
  macdHist: number | null
  atrPct: number | null
  support: number | null
  resistance: number | null
}

function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null)
  if (values.length < period) return out
  const k = 2 / (period + 1)
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period
  out[period - 1] = prev
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

function rsiSeries(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = Array(closes.length).fill(null)
  if (closes.length <= period) return out

  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1]
    if (d >= 0) gain += d
    else loss -= d
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1]
    const g = d > 0 ? d : 0
    const l = d < 0 ? -d : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

function atrSeries(bars: OhlcBar[], period = 14): (number | null)[] {
  const out: (number | null)[] = Array(bars.length).fill(null)
  if (bars.length <= period) return out

  const trs: number[] = bars.map((b, i) => {
    if (i === 0) return b.h - b.l
    const prev = bars[i - 1].c
    return Math.max(b.h - b.l, Math.abs(b.h - prev), Math.abs(b.l - prev))
  })

  let atr = trs.slice(1, period + 1).reduce((a, b) => a + b, 0) / period
  out[period] = atr
  for (let i = period + 1; i < bars.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period
    out[i] = atr
  }
  return out
}

export type DeskIndicators = {
  ema20: (number | null)[]
  ema50: (number | null)[]
  rsi: (number | null)[]
  macd: (number | null)[]
  macdSignal: (number | null)[]
  macdHist: (number | null)[]
  atr: (number | null)[]
}

export function computeIndicators(bars: OhlcBar[]): DeskIndicators {
  const closes = bars.map(b => b.c)
  const ema12 = emaSeries(closes, 12)
  const ema26 = emaSeries(closes, 26)
  const macd = closes.map((_, i) =>
    ema12[i] != null && ema26[i] != null ? (ema12[i] as number) - (ema26[i] as number) : null,
  )
  // Signal only meaningful once MACD has values — approximate with EMA on filled series from first non-null
  const firstMacd = macd.findIndex(v => v != null)
  const signalFull = emaSeries(
    macd.map((v, i) => (i < firstMacd ? 0 : (v ?? 0))),
    9,
  )
  const macdSignal = macd.map((v, i) => (v == null || firstMacd < 0 || i < firstMacd + 8 ? null : signalFull[i]))
  const macdHist = macd.map((v, i) =>
    v != null && macdSignal[i] != null ? v - (macdSignal[i] as number) : null,
  )

  return {
    ema20: emaSeries(closes, 20),
    ema50: emaSeries(closes, 50),
    rsi: rsiSeries(closes, 14),
    macd,
    macdSignal,
    macdHist,
    atr: atrSeries(bars, 14),
  }
}

export function buildTapeRead(bars: OhlcBar[], ind: DeskIndicators): TapeRead {
  const i = bars.length - 1
  const close = bars[i]?.c ?? null
  const emaFast = ind.ema20[i]
  const emaSlow = ind.ema50[i]
  const rsi = ind.rsi[i]
  const macdHist = ind.macdHist[i]
  const atr = ind.atr[i]
  const atrPct = close && atr != null && close > 0 ? (atr / close) * 100 : null

  const bullets: string[] = []
  let score = 0

  if (emaFast != null && emaSlow != null && close != null) {
    if (emaFast > emaSlow && close > emaFast) {
      score += 2
      bullets.push('Price is above the fast and slow averages — trend structure looks constructive.')
    } else if (emaFast < emaSlow && close < emaFast) {
      score -= 2
      bullets.push('Price is below both averages — trend structure looks cautious.')
    } else {
      bullets.push('Averages are mixed — trend is not cleanly one-sided.')
    }
  }

  if (rsi != null) {
    if (rsi >= 70) {
      score -= 1
      bullets.push(`RSI is warm at ${rsi.toFixed(0)} — momentum is stretched; pullbacks are more likely.`)
    } else if (rsi <= 30) {
      score += 1
      bullets.push(`RSI is washed out at ${rsi.toFixed(0)} — selling pressure looks exhausted.`)
    } else if (rsi >= 55) {
      score += 1
      bullets.push(`RSI sits at ${rsi.toFixed(0)} — buyers still have a mild edge.`)
    } else if (rsi <= 45) {
      score -= 1
      bullets.push(`RSI sits at ${rsi.toFixed(0)} — sellers still have a mild edge.`)
    } else {
      bullets.push(`RSI is balanced at ${rsi.toFixed(0)}.`)
    }
  }

  if (macdHist != null) {
    const prev = ind.macdHist[i - 1]
    if (macdHist > 0 && (prev == null || prev <= 0)) {
      score += 1
      bullets.push('MACD histogram just flipped positive — momentum may be turning up.')
    } else if (macdHist < 0 && (prev == null || prev >= 0)) {
      score -= 1
      bullets.push('MACD histogram just flipped negative — momentum may be turning down.')
    } else if (macdHist > 0) {
      score += 1
      bullets.push('MACD histogram is positive — short-term momentum favors the upside.')
    } else {
      score -= 1
      bullets.push('MACD histogram is negative — short-term momentum favors the downside.')
    }
  }

  if (atrPct != null) {
    if (atrPct >= 4) {
      bullets.push(`Volatility is elevated (ATR ≈ ${atrPct.toFixed(1)}%). Consider smaller size.`)
    } else if (atrPct <= 1.5) {
      bullets.push(`Volatility is quiet (ATR ≈ ${atrPct.toFixed(1)}%). Moves may be slower.`)
    } else {
      bullets.push(`Volatility is normal (ATR ≈ ${atrPct.toFixed(1)}%).`)
    }
  }

  let bias: Bias = 'neutral'
  if (score >= 2) bias = 'constructive'
  else if (score <= -2) bias = 'cautious'

  const headline =
    bias === 'constructive'
      ? 'Tape leans constructive — trend and momentum agree more than they fight.'
      : bias === 'cautious'
        ? 'Tape leans cautious — pressure is still on the sellers for now.'
        : 'Tape is mixed — wait for a cleaner hand before sizing up.'

  // Recent swing levels from completed bars (exclude live bar so wicks do not dominate)
  const completed =
    bars.length > 1 ? bars.slice(-Math.min(25, bars.length), -1) : bars.slice(-Math.min(20, bars.length))
  const window = completed.length >= 5 ? completed : bars.slice(-Math.min(20, bars.length))
  const support = window.length ? Math.min(...window.map(b => b.l)) : null
  const resistance = window.length ? Math.max(...window.map(b => b.h)) : null

  return {
    bias,
    score: Math.max(-5, Math.min(5, score)),
    headline,
    bullets: bullets.slice(0, 4),
    rsi,
    emaFast,
    emaSlow,
    macdHist,
    atrPct,
    support,
    resistance,
  }
}
