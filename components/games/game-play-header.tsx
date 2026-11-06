'use client'

import type { CSSProperties } from 'react'
import { useCallback, useState } from 'react'
import { ArrowLeft, Check, Link2 } from 'lucide-react'
import type { GameEntry } from '@/lib/games-catalog'

export function GamePlayHeader({
  game,
  shareUrl,
  onBack,
}: {
  game: GameEntry
  /** Deep link to this table (?mode=) — copied on tap. */
  shareUrl: string
  onBack: () => void
}) {
  const Icon = game.icon
  const [copied, setCopied] = useState(false)

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [shareUrl])

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        style={{ '--hover-tint': `${game.to}1a` } as CSSProperties}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-black/10 text-foreground/70 transition-colors hover:border-transparent hover:bg-(--hover-tint) active:scale-95 dark:border-white/15"
        aria-label="Back to all games"
      >
        <ArrowLeft className="size-4" />
      </button>
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ backgroundImage: `linear-gradient(145deg, ${game.from}, ${game.to})` }}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-extrabold text-foreground sm:text-[19px]">{game.name}</h2>
        <p className="truncate text-[11px] text-muted-foreground sm:text-[12px]">
          {game.tag}
          <span className="opacity-50"> · </span>
          {game.duration}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-emerald-600" /> : <Link2 className="size-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  )
}
