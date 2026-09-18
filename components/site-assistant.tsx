'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, ArrowUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'What’s on this site?',
  'Where are the books?',
  'Show me something fun',
]

export function SiteAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content: 'Hey — I’m the Little Internet guide. Ask me where things live, or what to try next.',
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open, messages, busy])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return

    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setBusy(true)

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const message =
          typeof err?.error === 'string'
            ? err.error
            : 'Couldn’t reach the assistant right now.'
        setMessages(m => [...m, { role: 'assistant', content: message }])
        return
      }

      setMessages(m => [...m, { role: 'assistant', content: '' }])
      const reader = res.body?.getReader()
      if (!reader) {
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: 'No response stream.',
          }
          return copy
        })
        return
      }

      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const snapshot = acc
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: snapshot }
          return copy
        })
      }
    } catch {
      setMessages(m => [
        ...m,
        { role: 'assistant', content: 'Network hiccup. Try once more.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      {open && (
        <div
          className={cn(
            'pointer-events-auto w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-black/10 dark:border-white/12',
            'bg-[#f8f8f8]/95 dark:bg-[#2f3437]/95 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl',
            'animate-in fade-in slide-in-from-bottom-3 duration-200',
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-black/8 dark:border-white/10 px-4 py-3">
            <div className="min-w-0">
              <p className="font-pixel text-[10px] tracking-[0.22em] text-black/55 dark:text-white/55">
                LITTLE INTERNET
              </p>
              <p className="text-sm text-black/80 dark:text-white/85">Ask around</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-8 items-center justify-center rounded-xl border border-black/10 dark:border-white/15 text-black/55 dark:text-white/55 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
              aria-label="Close assistant"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="max-h-[min(50vh,22rem)] space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn(
                  'max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed',
                  m.role === 'user'
                    ? 'ml-auto bg-[#37352f] text-[#f8f8f8] dark:bg-white/90 dark:text-[#2f3437]'
                    : 'bg-black/[0.04] text-black/80 dark:bg-white/[0.06] dark:text-white/85',
                )}
              >
                {m.content || (busy && i === messages.length - 1 ? '…' : '')}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => send(s)}
                  className="rounded-full border border-black/10 dark:border-white/12 px-2.5 py-1 text-[11px] text-black/60 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex items-center gap-2 border-t border-black/8 dark:border-white/10 p-3"
            onSubmit={e => {
              e.preventDefault()
              void send(input)
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about the site…"
              disabled={busy}
              className="h-10 flex-1 rounded-xl border border-black/10 dark:border-white/12 bg-transparent px-3 text-sm outline-none placeholder:text-black/35 dark:placeholder:text-white/35 focus:border-black/25 dark:focus:border-white/25"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex size-10 items-center justify-center rounded-xl bg-[#37352f] text-[#f8f8f8] dark:bg-white dark:text-[#2f3437] disabled:opacity-40 cursor-pointer"
              aria-label="Send"
            >
              <ArrowUp className="size-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'pointer-events-auto group relative inline-flex h-12 items-center gap-2 rounded-full border border-black/10 dark:border-white/15',
          'bg-[#f8f8f8] dark:bg-[#2f3437] px-4 text-sm text-black/75 dark:text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.18)]',
          'hover:border-black/20 dark:hover:border-white/25 transition-all cursor-pointer',
        )}
        aria-expanded={open}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/50" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        {open ? (
          <>
            <X className="size-4" />
            <span className="hidden sm:inline">Close</span>
          </>
        ) : (
          <>
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline">Ask</span>
            <Sparkles className="size-3.5 opacity-50" />
          </>
        )}
      </button>
    </div>
  )
}
