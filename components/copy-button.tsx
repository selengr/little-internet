'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers / insecure contexts: fall back to a temporary textarea.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Ghost button that copies `text` and confirms with a check mark for a moment. */
export function CopyButton({
  text,
  disabled,
  label = 'Copy',
  lineVar,
  className,
  style,
}: {
  text: string
  disabled?: boolean
  label?: string
  /** CSS colour (usually a page variable) for the outline. */
  lineVar: string
  className?: string
  style?: React.CSSProperties
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  // A new text means a new card: forget the previous confirmation.
  useEffect(() => setState('idle'), [text])

  return (
    <button
      type="button"
      disabled={disabled || !text}
      onClick={async () => {
        const ok = await writeClipboard(text)
        setState(ok ? 'copied' : 'failed')
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setState('idle'), 1800)
      }}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-5 text-[13px] tracking-wide transition-all hover:-translate-y-0.5 hover:bg-black/[0.04] active:scale-[0.98] disabled:opacity-40 sm:w-auto dark:hover:bg-white/[0.06]',
        className,
      )}
      style={{ borderColor: lineVar, ...style }}
    >
      {state === 'copied' ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  )
}
