'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = ['Books', 'Crypto', 'Something fun']

const CRYPTO_TOOL_LINKS = [
  { href: '/crypto', label: 'Crypto' },
  { href: '/charts', label: 'Charts' },
  { href: '/convert', label: 'Convert' },
] as const

const CRYPTO_ASK_RE =
  /\b(crypto|bitcoin|btc|eth|ethereum|coin|token|chart|charts|convert|forex|buy|sell)\b/i

function isCryptoAsk(text: string) {
  return CRYPTO_ASK_RE.test(text) || /^crypto$/i.test(text.trim())
}

/** Arabic / Persian script — used for font + RTL on chat bubbles. */
const PERSIAN_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function hasPersian(text: string) {
  return PERSIAN_RE.test(text)
}

const ASSISTANT_FONT_FA =
  'var(--font-vazirmatn), "Vazirmatn", Tahoma, "Segoe UI", system-ui, sans-serif'
/** Latin first; Vazirmatn fills Arabic/Persian glyphs when Geist lacks them. */
const ASSISTANT_FONT =
  'var(--font-sans), Geist, var(--font-vazirmatn), "Vazirmatn", Tahoma, system-ui, sans-serif'

const SITE_PATH_RE =
  /(?<![A-Za-z0-9/])(\/(?:books|crypto|gold|forex|charts|desk|jokes|poetry|animal-facts|cat|location|dictionary|photos|blog|lyrics|music|countries|convert|qr|art|wiktionary|notion|auth|account)(?:\/[\w\-./]*)?)/g

function linkifySitePaths(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let i = 0
  for (const match of text.matchAll(SITE_PATH_RE)) {
    const start = match.index ?? 0
    const path = match[1]
    if (start > last) nodes.push(text.slice(last, start))
    nodes.push(
      <Link
        key={`${path}-${i++}`}
        href={path}
        className="underline underline-offset-2 decoration-current/35 hover:decoration-current transition-colors"
      >
        {path}
      </Link>,
    )
    last = start + path.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes.length ? nodes : [text]
}

function GuideMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <circle cx="5.5" cy="7" r="1.5" fill="currentColor" opacity="0.85" />
      <circle cx="18.5" cy="8" r="1.5" fill="currentColor" opacity="0.85" />
      <circle cx="7" cy="17.5" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="17" cy="16.5" r="1.5" fill="currentColor" opacity="0.7" />
      <path
        d="M6.6 7.8L10.4 10.8M17.6 8.8L13.6 11M8.1 16.4L10.6 13.4M16.2 15.6L13.5 13.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] px-0.5" aria-hidden>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-current opacity-50 animate-bounce"
          style={{ animationDelay: `${i * 140}ms`, animationDuration: '820ms' }}
        />
      ))}
    </span>
  )
}

function AssistantLoading() {
  return (
    <div
      className="flex items-center gap-2.5 py-0.5"
      aria-live="polite"
      aria-label="Guide is thinking"
    >
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-25" />
        <span className="relative inline-flex size-2 rounded-full bg-current/55" />
      </span>
      <span className="inline-flex items-center gap-1 text-[12px] font-medium tracking-tight text-black/45 dark:text-white/50">
        Thinking
        <TypingDots />
      </span>
    </div>
  )
}

export function SiteAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    const t = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => window.clearTimeout(t)
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

    const historyForApi = [...messages, { role: 'user' as const, content }]
    setMessages([...historyForApi, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)

    const setAssistantContent = (text: string) => {
      setMessages(m => {
        const copy = [...m]
        const last = copy.length - 1
        if (last >= 0 && copy[last].role === 'assistant') {
          copy[last] = { role: 'assistant', content: text }
        } else {
          copy.push({ role: 'assistant', content: text })
        }
        return copy
      })
    }

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyForApi.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        const message =
          typeof err?.error === 'string'
            ? err.error
            : 'Couldn’t reach the guide right now.'
        setAssistantContent(message)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setAssistantContent('No response stream.')
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
      setAssistantContent('Network hiccup. Try once more.')
    } finally {
      setBusy(false)
    }
  }

  const showSuggestions = messages.length === 0 && !busy
  const showCryptoTools =
    !busy && messages.some(m => m.role === 'user' && isCryptoAsk(m.content))

  const panelHasPersian =
    hasPersian(input) || messages.some(m => hasPersian(m.content))

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3 sm:bottom-7 sm:right-7">
      <div
        className={cn(
          'pointer-events-auto w-[min(100vw-2.5rem,21rem)] origin-bottom-right overflow-hidden',
          'rounded-[1.35rem] border border-black/[0.08] dark:border-white/[0.1]',
          'bg-[#f4f3f0]/92 dark:bg-[#2a2e31]/92 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
          'transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open
            ? 'translate-y-0 scale-100 opacity-100 blur-0'
            : 'pointer-events-none invisible translate-y-3 scale-[0.92] opacity-0 blur-[2px]',
        )}
        style={{ fontFamily: panelHasPersian ? ASSISTANT_FONT_FA : ASSISTANT_FONT }}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-end px-2.5 pt-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex size-8 items-center justify-center rounded-full text-black/40 dark:text-white/40 transition-colors hover:bg-black/[0.05] hover:text-black/70 dark:hover:bg-white/[0.06] dark:hover:text-white/75 cursor-pointer"
            aria-label="Close"
          >
            <X className="size-3.5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="max-h-[min(52vh,23.125rem)] min-h-[11.5rem] space-y-2.5 overflow-y-auto px-3.5 pb-3 pt-0.5">
          {showSuggestions && (
            <div className="flex flex-wrap gap-1.5 py-6 justify-center">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => send(s)}
                  className="rounded-full border border-black/[0.1] dark:border-white/[0.12] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-[12px] text-black/55 dark:text-white/55 transition-colors hover:border-black/20 hover:text-black/80 dark:hover:border-white/25 dark:hover:text-white/80 cursor-pointer disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m, i) => {
            const awaitingReply =
              busy &&
              m.role === 'assistant' &&
              i === messages.length - 1 &&
              !m.content.trim()
            const persian = hasPersian(m.content)
            return (
              <div
                key={`${m.role}-${i}`}
                dir={persian ? 'rtl' : 'auto'}
                lang={persian ? 'fa' : undefined}
                className={cn(
                  'max-w-[90%] rounded-2xl px-3 py-2 text-[13px] whitespace-pre-wrap',
                  persian ? 'leading-[1.85] tracking-normal' : 'leading-relaxed',
                  m.role === 'user'
                    ? 'ml-auto bg-[#37352f] text-[#f7f6f3] dark:bg-[#e8e6e1] dark:text-[#2f3437]'
                    : 'bg-black/[0.045] text-black/75 dark:bg-white/[0.06] dark:text-white/80',
                  awaitingReply &&
                    'relative overflow-hidden border border-black/[0.06] dark:border-white/[0.08]',
                )}
              >
                {awaitingReply ? (
                  <>
                    <span
                      className="pointer-events-none absolute inset-0 -translate-x-full animate-[assistant-shimmer_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-black/[0.04] to-transparent dark:via-white/[0.06]"
                      aria-hidden
                    />
                    <AssistantLoading />
                  </>
                ) : m.role === 'assistant' ? (
                  linkifySitePaths(m.content)
                ) : (
                  m.content
                )}
              </div>
            )
          })}
          {showCryptoTools && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CRYPTO_TOOL_LINKS.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-full border border-black/[0.1] dark:border-white/[0.12] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-[12px] text-black/55 dark:text-white/55 transition-colors hover:border-black/20 hover:text-black/80 dark:hover:border-white/25 dark:hover:text-white/80"
                >
                  {tool.label}
                </Link>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-center gap-2 border-t border-black/[0.06] dark:border-white/[0.08] p-2.5"
          onSubmit={e => {
            e.preventDefault()
            void send(input)
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={panelHasPersian ? 'بپرس…' : 'Ask…'}
            disabled={busy}
            dir={hasPersian(input) ? 'rtl' : 'auto'}
            lang={hasPersian(input) ? 'fa' : undefined}
            className="h-10 flex-1 rounded-xl bg-transparent px-3 text-sm outline-none placeholder:text-black/30 dark:placeholder:text-white/30"
            style={{
              fontFamily: hasPersian(input) ? ASSISTANT_FONT_FA : ASSISTANT_FONT,
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full transition-all cursor-pointer',
              'bg-[#37352f] text-[#f7f6f3] dark:bg-[#e8e6e1] dark:text-[#2f3437]',
              'disabled:opacity-30 hover:scale-105 active:scale-95',
            )}
            aria-label="Send"
          >
            <ArrowUp className="size-4" strokeWidth={2.25} />
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'pointer-events-auto relative inline-flex size-14 items-center justify-center rounded-full',
          'border border-black/[0.08] dark:border-white/[0.12]',
          'bg-[#f4f3f0] dark:bg-[#2a2e31] text-black/75 dark:text-white/85',
          'shadow-[0_12px_36px_-8px_rgba(0,0,0,0.35)]',
          'transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'hover:scale-105 hover:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.4)] active:scale-95 cursor-pointer',
          open && 'rotate-0 bg-[#37352f] text-[#f7f6f3] dark:bg-[#e8e6e1] dark:text-[#2f3437]',
        )}
        aria-expanded={open}
        aria-label={open ? 'Close guide' : 'Open guide'}
      >
        {!open && (
          <span className="pointer-events-none absolute inset-0 rounded-full">
            <span className="absolute inset-0 animate-[assistant-ring_2.8s_ease-out_infinite] rounded-full border border-black/15 dark:border-white/20" />
          </span>
        )}
        <span
          className={cn(
            'absolute transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
          )}
        >
          <GuideMark className="size-6" />
        </span>
        <span
          className={cn(
            'absolute transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
          )}
        >
          <X className="size-5" strokeWidth={2.25} />
        </span>
      </button>
    </div>
  )
}
