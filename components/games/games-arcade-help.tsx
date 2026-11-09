'use client'

import { useEffect, useMemo, useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { pickArcadeTip } from '@/lib/games/arcade-tips'
import { featuredArcadeTips } from '@/lib/games/featured-tips'
import { GAME_COUNT } from '@/lib/games-catalog'

const FEATURED = featuredArcadeTips()

export function GamesArcadeHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tipIndex, setTipIndex] = useState(0)
  const tip = useMemo(() => pickArcadeTip(tipIndex) ?? FEATURED[0] ?? null, [tipIndex])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="games-arcade-help-title"
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close help" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="games-arcade-help-title" className="flex items-center gap-2 text-lg font-bold text-foreground">
              <HelpCircle className="size-5 text-indigo-500" aria-hidden />
              Arcade cheatsheet
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {GAME_COUNT} tables · keys <kbd className="rounded border px-1 font-mono text-[10px]">1</kbd>–
              <kbd className="rounded border px-1 font-mono text-[10px]">7</kbd>,{' '}
              <kbd className="rounded border px-1 font-mono text-[10px]">R</kbd> random,{' '}
              <kbd className="rounded border px-1 font-mono text-[10px]">/</kbd> search,{' '}
              <kbd className="rounded border px-1 font-mono text-[10px]">?</kbd> help,{' '}
              <kbd className="rounded border px-1 font-mono text-[10px]">Esc</kbd> back
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {tip && (
          <p className="mt-4 rounded-2xl bg-muted/50 px-3 py-2.5 text-[13px] leading-snug text-foreground">{tip.text}</p>
        )}
        {FEATURED.length > 1 && (
          <button
            type="button"
            onClick={() => setTipIndex(i => i + 1)}
            className="mt-3 text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Another tip
          </button>
        )}
        <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
          {FEATURED.map(t => (
            <li key={t.id}>· {t.text}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
