'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function GamesPickerToolbar({
  onRandom,
  onResumeLast,
  onOpenHelp,
}: {
  onRandom: () => void
  onResumeLast: () => void
  onOpenHelp?: () => void
}) {
  return (
    <>
      <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRandom}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:border-foreground/25 hover:bg-muted/60"
        >
          <Sparkles className="size-3.5 text-amber-500" aria-hidden />
          Surprise me
        </button>
        <button
          type="button"
          onClick={onResumeLast}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          Last table
        </button>
        <Link
          href="/games-v2"
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-transparent px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
        >
          Pricier duel
        </Link>
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            Help
          </button>
        )}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground/80">
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">1</kbd>–
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">7</kbd> open ·{' '}
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">R</kbd> random ·{' '}
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">/</kbd> search ·{' '}
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">?</kbd> help ·{' '}
        <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[9px]">Esc</kbd> back
      </p>
    </>
  )
}
