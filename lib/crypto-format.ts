export function formatUsd(n: number | null | undefined, compact = false) {
  if (n == null || Number.isNaN(n)) return '—'
  if (n >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: n >= 100 ? 2 : n >= 1 ? 4 : 6,
    }).format(n)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumSignificantDigits: 4,
  }).format(n)
}

export function formatPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—'
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
