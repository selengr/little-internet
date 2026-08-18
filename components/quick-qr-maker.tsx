'use client'

import { useEffect, useRef, useState } from 'react'
import { Download } from 'lucide-react'
import { generateQrPng, downloadDataUrl } from '@/lib/qr-barcode'
import { cn } from '@/lib/utils'

export function QuickQrMaker() {
  const [text, setText] = useState('')
  const [png, setPng] = useState<string | null>(null)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const genIdRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const value = text.trim()
    if (!value) {
      setPng(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const id = ++genIdRef.current
      try {
        const dataUrl = await generateQrPng(value, 360)
        if (id === genIdRef.current) setPng(dataUrl)
      } catch {
        if (id === genIdRef.current) setPng(null)
      }
    }, 280)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [text])

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="relative flex-1 flex items-center justify-center min-h-[160px] rounded-2xl border border-border/60 bg-background/60 dark:bg-background/40">
        <div className="pointer-events-none absolute top-3 left-3 size-3 border-l border-t border-foreground/25" />
        <div className="pointer-events-none absolute top-3 right-3 size-3 border-r border-t border-foreground/25" />
        <div className="pointer-events-none absolute bottom-3 left-3 size-3 border-l border-b border-foreground/25" />
        <div className="pointer-events-none absolute bottom-3 right-3 size-3 border-r border-b border-foreground/25" />

        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={png}
            alt="QR preview"
            className="size-[120px] md:size-[140px] rounded-md bg-white shadow-sm"
          />
        ) : (
          <p className="text-sm text-muted-foreground/50 font-mono tracking-wide">awaiting ink…</p>
        )}
      </div>

      <div
        className="relative cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {!text && !focused && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-0 h-[1.05em] w-[2px] rounded-full bg-foreground/80 animate-[qrCaretBlink_1s_step-end_infinite]"
          />
        )}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="paste a link or message"
          className={cn(
            'w-full bg-transparent border-b pb-2 text-base font-light tracking-tight text-foreground outline-none transition-colors',
            'caret-foreground placeholder:text-muted-foreground/55',
            focused ? 'border-foreground/70' : 'border-foreground/30 hover:border-foreground/45',
          )}
          aria-label="QR content"
        />
        <style>{`
          @keyframes qrCaretBlink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }
        `}</style>
      </div>

      <button
        type="button"
        onClick={() => {
          if (png) downloadDataUrl(png, 'qr-code.png')
        }}
        disabled={!png}
        className="inline-flex items-center justify-center gap-2 h-11 rounded-full bg-foreground text-background text-[11px] uppercase tracking-[0.18em] font-medium hover:opacity-90 disabled:opacity-35 disabled:pointer-events-none transition-opacity cursor-pointer"
      >
        <Download className="size-3.5" />
        Download PNG
      </button>
    </div>
  )
}
