import type { ForexPeriod } from '@/types/frankfurter'

export const FRANKFURTER_API = 'https://api.frankfurter.dev'

export const POPULAR_PAIRS: { base: string; quote: string; label: string }[] = [
  { base: 'EUR', quote: 'USD', label: 'EUR / USD' },
  { base: 'USD', quote: 'JPY', label: 'USD / JPY' },
  { base: 'GBP', quote: 'USD', label: 'GBP / USD' },
  { base: 'USD', quote: 'CHF', label: 'USD / CHF' },
  { base: 'AUD', quote: 'USD', label: 'AUD / USD' },
  { base: 'USD', quote: 'CAD', label: 'USD / CAD' },
]

/** Major currencies shown on the live board (quoted against USD). */
export const LIVE_QUOTES =
  'EUR,GBP,JPY,CHF,CAD,AUD,CNY,INR,TRY,AED,MXN,BRL,SEK,NOK,PLN,SGD,HKD,NZD,ZAR'

export const REFRESH_MS = 30_000

export const FALLBACK_CURRENCIES = [
  { iso_code: 'USD', name: 'US Dollar', symbol: '$' },
  { iso_code: 'EUR', name: 'Euro', symbol: '€' },
  { iso_code: 'GBP', name: 'British Pound', symbol: '£' },
  { iso_code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { iso_code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { iso_code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { iso_code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { iso_code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { iso_code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { iso_code: 'IRR', name: 'Iranian Rial (free market)', symbol: '﷼' },
  { iso_code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { iso_code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { iso_code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
]

export function periodLabel(days: ForexPeriod): string {
  switch (days) {
    case 'today': return 'Today'
    case '7': return '7 Days'
    case '30': return '30 Days'
    case '90': return '90 Days'
    case '365': return '1 Year'
  }
}

export function dateRangeForPeriod(days: ForexPeriod): { from: string; to: string; group?: 'week' | 'month' } {
  const to = new Date()
  const from = new Date()
  if (days === 'today') {
    // Include previous session so we can show day-over-day change
    from.setDate(from.getDate() - 3)
  } else {
    from.setDate(from.getDate() - Number(days))
  }
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    group: days === '365' ? 'week' : undefined,
  }
}

export function formatRate(rate: number, quote: string): string {
  const decimals = quote === 'JPY' || rate > 100 ? 2 : 4
  return rate.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(decimals, 2),
    maximumFractionDigits: decimals,
  })
}

export function formatConverted(amount: number, quote: string): string {
  const decimals = quote === 'JPY' ? 0 : 2
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function pctChange(first: number, last: number): number {
  if (!first) return 0
  return ((last - first) / first) * 100
}

export function dedupeByDate(points: { date: string; rate: number }[]) {
  const map = new Map<string, number>()
  for (const p of points) map.set(p.date, p.rate)
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rate]) => ({ date, rate }))
}
