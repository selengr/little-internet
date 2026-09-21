'use client'

import { formatUsd } from '@/lib/crypto-format'
import { cn } from '@/lib/utils'
import type { DeskBotAction, DeskBotAdvice } from '@/lib/desk-bot'
import { Bot } from 'lucide-react'

const LABELS = {
  buy: { word: 'Buy', pill: 'bg-emerald-500/90', ring: 'ring-emerald-500/30' },
  sell: { word: 'Sell', pill: 'bg-rose-500/90', ring: 'ring-rose-500/30' },
  wait: { word: 'Wait', pill: 'bg-amber-500/85', ring: 'ring-amber-400/25' },
} as const

function formatZone(from: number | null, to: number | null): string {
  if (from == null || to == null || !Number.isFinite(from) || !Number.isFinite(to)) return '—'
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  const mid = (lo + hi) / 2
  if (mid <= 0) return '—'
  const relSpan = (hi - lo) / mid
  if (relSpan < 0.00025) return formatUsd(mid)
  return `${formatUsd(lo)} – ${formatUsd(hi)}`
}

function ZoneRow({
  label,
  value,
  tone,
  emphasis,
}: {
  label: string
  value: string
  tone: 'buy' | 'sell'
  emphasis: boolean
}) {
  const color = tone === 'buy' ? 'text-emerald-400' : 'text-rose-400'
  return (
    <div
      className={cn(
        'rounded-md border px-2.5 py-1.5 transition-opacity',
        emphasis
          ? tone === 'buy'
            ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
            : 'border-rose-500/25 bg-rose-500/[0.07]'
          : 'border-white/[0.05] bg-white/[0.02] opacity-45',
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-white/35 mb-0.5">{label}</p>
      <p className={cn('text-[12px] tabular-nums font-mono leading-tight', color)}>{value}</p>
    </div>
  )
}

function zoneEmphasis(action: DeskBotAction, tone: 'buy' | 'sell'): boolean {
  if (action === 'buy') return tone === 'buy'
  if (action === 'sell') return tone === 'sell'
  return true
}

export function DeskBotPanel({
  advice,
  loading,
}: {
  advice: DeskBotAdvice | null
  symbol?: string
  loading?: boolean
}) {
  if (!advice) {
    return (
      <div className="border-t border-white/[0.06] px-3 py-3 bg-[#0a0e13] shrink-0">
        <p className="text-[11px] text-white/40 flex items-center gap-2">
          <Bot className="size-3.5 shrink-0" aria-hidden />
          {loading ? 'Updating pilot…' : 'Loading pilot…'}
        </p>
      </div>
    )
  }

  const label = LABELS[advice.action]
  const buyText = formatZone(advice.buyFrom, advice.buyTo)
  const sellText = formatZone(advice.sellFrom, advice.sellTo)

  return (
    <div className="border-t border-white/[0.06] px-3 py-3 space-y-2.5 shrink-0 bg-[#0a0e13]">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-2">
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold text-white ring-1 ring-inset',
            label.pill,
            label.ring,
          )}
        >
          <Bot className="size-3.5 shrink-0" aria-hidden />
          {label.word}
        </span>
        <p className="text-[12px] text-white/70 leading-snug min-w-0 flex-1">{advice.tip}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ZoneRow
          label="Buy around"
          value={buyText}
          tone="buy"
          emphasis={zoneEmphasis(advice.action, 'buy')}
        />
        <ZoneRow
          label="Sell around"
          value={sellText}
          tone="sell"
          emphasis={zoneEmphasis(advice.action, 'sell')}
        />
      </div>
    </div>
  )
}
