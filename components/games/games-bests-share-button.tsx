'use client'

import { useCallback, useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { formatArcadeBestsShareText } from '@/lib/games/arcade-bests-share'

export function GamesBestsShareButton() {
  const [copied, setCopied] = useState(false)

  const share = useCallback(async () => {
    const text = formatArcadeBestsShareText()
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Little Internet arcade', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        setCopied(false)
      }
    }
  }, [])

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5" />}
      {copied ? 'Copied' : 'Share my bests'}
    </button>
  )
}