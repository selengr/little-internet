'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { PoemInkSpinner, SPIN_MS } from '@/components/diversion-spinners'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import { MOODS, normalizePoem, pickFallbackPoem, pickRandomFallback } from '@/lib/poetry'
import { cn } from '@/lib/utils'
import type { PoetryMood, PoetryPoem } from '@/types/poetry'

const display = { fontFamily: 'var(--font-py-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-py-mono), ui-monospace, monospace' } as const
const mark = { fontFamily: 'var(--font-py-mark), system-ui, sans-serif' } as const

type Filter = PoetryMood | 'any'
type Card = { no: number; poem: PoetryPoem; daily?: boolean; mood: Filter }

// Each mood has its own ink colours; the light inside the card follows them.
const PALETTE: Record<Filter, { a: string; b: string; emoji: string; label: string }> = {
  any: { a: '#38bdf8', b: '#6366f1', emoji: '✒️', label: 'Any' },
  romantic: { a: '#fda4af', b: '#e11d48', emoji: '🌹', label: 'Romantic' },
  sad: { a: '#93c5fd', b: '#2563eb', emoji: '🌧️', label: 'Sad' },
  inspirational: { a: '#fde68a', b: '#d97706', emoji: '🌅', label: 'Hopeful' },
  nature: { a: '#86efac', b: '#16a34a', emoji: '🌿', label: 'Nature' },
  philosophy: { a: '#c4b5fd', b: '#7c3aed', emoji: '🌀', label: 'Deep' },
}
const FILTERS: Filter[] = ['any', ...MOODS.map(m => m.id)]
const PREVIEW_LINES = 10

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const keyOf = (p: PoetryPoem) => `${p.title}|${p.author}`

async function fetchPoem(action: 'today' | 'next', mood: Filter): Promise<PoetryPoem | null> {
  try {
    const qs = new URLSearchParams({ action })
    if (action === 'next' && mood !== 'any') qs.set('mood', mood)
    const res = await fetch(`/api/poetry?${qs}`, { cache: 'no-store', signal: AbortSignal.timeout(7000) })
    const data = await res.json()
    if (!res.ok || !data?.poem?.lines?.length) return null
    return normalizePoem(data.poem as PoetryPoem)
  } catch {
    return null
  }
}

async function pickPoem(mood: Filter, seen: Set<string>, daily = false): Promise<PoetryPoem> {
  const m = mood === 'any' ? null : mood
  for (let i = 0; i < 3; i++) {
    const p = await fetchPoem(daily ? 'today' : 'next', mood)
    if (!p) break // the source is down or slow: use the built-in poems
    if (daily || !seen.has(keyOf(p))) return p
  }
  for (let i = 0; i < 6; i++) {
    const p = pickRandomFallback(m)
    if (!seen.has(keyOf(p))) return p
  }
  return daily ? pickFallbackPoem(m, 'today') : pickRandomFallback(m)
}

const CSS = `
  @property --py-g1 { syntax: '<color>'; inherits: true; initial-value: #6366f1; }
  @property --py-g2 { syntax: '<color>'; inherits: true; initial-value: #38bdf8; }
  @keyframes py-breathe { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
  @keyframes py-drift { 0% { background-position: 0% 100% } 50% { background-position: 100% 0% } 100% { background-position: 0% 100% } }
  @keyframes py-marquee { from { transform: translateX(-50%) } to { transform: translateX(0) } }

  .py-root {
    --py-bg: #f3f2ee; --py-fg: #13131a; --py-mute: rgba(19,19,26,.56); --py-line: rgba(19,19,26,.14);
    --py-card: #fbfaf6; --py-ink-on: #f3f2ee;
  }
  :is(html.dark, .dark) .py-root {
    --py-bg: #0c0d12; --py-fg: rgba(255,255,255,.93); --py-mute: rgba(255,255,255,.52); --py-line: rgba(255,255,255,.14);
    --py-card: #14161c; --py-ink-on: #0c0d12;
  }
  .py-glow {
    --py-g1: #6366f1; --py-g2: #38bdf8;
    background-image: linear-gradient(225deg, var(--py-g1), var(--py-g2) 50%, var(--py-g1));
    background-size: 200% 200%;
    transition: --py-g1 .9s ease, --py-g2 .9s ease;
    animation: py-breathe 6s ease-in-out infinite, py-drift 24s ease-in-out infinite;
  }
  .py-outline { -webkit-text-stroke: 2px var(--py-fg); color: transparent; }
  @media (prefers-reduced-motion: reduce) {
    .py-glow, .py-marquee-track { animation: none !important }
  }
`

const RIBBON = ['VERSE', 'STANZA', 'RHYME', 'INK', 'METRE', 'SONNET', 'MUSE', 'LINE BREAK']

export function PoetryPage() {
  const [card, setCard] = useState<Card | null>(null)
  const [history, setHistory] = useState<Card[]>([])
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [seed, setSeed] = useState<number | null>(null)
  const [filter, setFilter] = useState<Filter>('any')
  const [size, setSize] = useState(216)
  const seen = useRef(new Set<string>())
  const counter = useRef(0)
  const busyRef = useRef(true)

  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 168 : 216)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const show = useCallback((poem: PoetryPoem, mood: Filter, daily = false) => {
    seen.current.add(keyOf(poem))
    counter.current += 1
    const entry = { no: counter.current, poem, mood, daily }
    setCard(entry)
    setExpanded(false)
    setHistory(h => [entry, ...h].slice(0, 12))
  }, [])

  // Poem of the day on arrival.
  useEffect(() => {
    let alive = true
    void (async () => {
      const p = await pickPoem('any', seen.current, true)
      if (!alive) return
      show(p, 'any', true)
      setBusy(false)
      busyRef.current = false
    })()
    return () => {
      alive = false
    }
  }, [show])

  const roll = useCallback(
    async (mood: Filter = filter) => {
      if (busyRef.current) return
      busyRef.current = true
      setSeed(Math.floor(Math.random() * 2 ** 31))
      setBusy(true)
      setSpinning(true)
      const started = Date.now()
      setTimeout(() => setSpinning(false), SPIN_MS)
      const p = await pickPoem(mood, seen.current)
      await sleep(Math.max(0, SPIN_MS - (Date.now() - started)))
      show(p, mood)
      setBusy(false)
      busyRef.current = false
    },
    [filter, show],
  )

  // Space / Enter / → drop more ink.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        void roll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [roll])

  const palette = PALETTE[card?.mood ?? filter]
  const glowVars = { '--py-g1': palette.b, '--py-g2': palette.a } as React.CSSProperties
  const past = history.filter(h => h.no !== card?.no)
  const lines = card?.poem.lines ?? []
  const long = lines.length > PREVIEW_LINES
  const shown = expanded || !long ? lines : lines.slice(0, PREVIEW_LINES)
  const realLines = lines.filter(l => l.trim()).length
  const minutes = Math.max(1, Math.round(lines.join(' ').split(/\s+/).length / 200))

  return (
    <main className="py-root relative min-h-screen overflow-x-clip bg-[var(--py-bg)] text-[var(--py-fg)]">
      <style>{CSS}</style>

      {/* Nav */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel hidden text-[10px] tracking-[0.2em] text-black/50 sm:inline dark:text-white/50">
            POETRY
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-[11px] tracking-wide text-black/70 transition-all duration-200 hover:border-black/20 hover:bg-black/[0.03] hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-28 md:px-8 md:pt-32">
        {/* Masthead: left-aligned, the outline on the first syllable. */}
        <header className="relative">
          <div
            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]"
            style={mono}
          >
            <Link
              href="/jokes"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--py-line)] px-2.5 py-1 transition-colors hover:bg-[var(--py-fg)] hover:text-[var(--py-ink-on)]"
            >
              <ArrowLeft className="size-3" />
              Jokes
            </Link>
            <span>№ 04 · Verses from poetrydb</span>
          </div>
          <h1
            className="mt-5 text-[clamp(3rem,16.5vw,10.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em]"
            style={mark}
          >
            <span className="whitespace-nowrap">
              <span className="py-outline">Poe</span>try
              <span
                aria-hidden
                className="ml-[0.05em] inline-block size-[0.14em] rounded-full"
                style={{ background: palette.b, transition: 'background .9s' }}
              />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--py-mute)]">
            Drop a little ink and see what blooms. Pick a mood, or let the page choose.
          </p>
        </header>

        {/* Tilted ribbon */}
        <div
          aria-hidden
          className="relative -mx-5 mt-10 rotate-[1.2deg] overflow-hidden border-y border-[var(--py-line)] bg-[var(--py-fg)] py-2.5 text-[var(--py-ink-on)] md:-mx-8"
        >
          <div
            className="py-marquee-track flex w-max gap-8 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ ...mono, animation: 'py-marquee 40s linear infinite' }}
          >
            {[...RIBBON, ...RIBBON, ...RIBBON, ...RIBBON].map((w, i) => (
              <span key={i} className="flex items-center gap-8">
                {w}
                <span className="opacity-40">❦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Mood picker */}
        <div
          role="radiogroup"
          aria-label="Poem mood"
          className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
        >
          {FILTERS.map(f => {
            const on = filter === f
            const c = PALETTE[f]
            return (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={() => {
                  setFilter(f)
                  void roll(f)
                }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[12px] tracking-wide transition-all active:scale-[0.97] disabled:opacity-60',
                  on
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-[var(--py-line)] bg-[var(--py-card)] text-[var(--py-fg)]/80 hover:-translate-y-0.5 hover:border-[var(--py-fg)]/30',
                )}
                style={{ ...mono, ...(on ? { background: `linear-gradient(135deg, ${c.b}, ${c.a})` } : {}) }}
              >
                <span aria-hidden>{c.emoji}</span>
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Stage */}
        <section
          aria-label="Poem"
          className="group/stage relative isolate mt-6 overflow-hidden rounded-[2rem] border border-[var(--py-line)] bg-[var(--py-card)]"
          onPointerMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
            e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
          }}
        >
          {/* Light inside the border, in the colours of the mood. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-90">
            <div className="py-glow absolute inset-0" style={glowVars} />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/stage:opacity-100"
              style={{
                background: `radial-gradient(340px circle at var(--mx,50%) var(--my,50%), ${palette.b}38, transparent 70%)`,
              }}
            />
            <div className="absolute inset-[22px] rounded-[1.6rem] bg-[var(--py-card)] blur-[26px] transition-[inset] duration-700 ease-out group-hover/stage:inset-[38px]" />
          </div>

          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-14 lg:p-14">
            <div className="flex flex-col items-center gap-4 lg:sticky lg:top-28 lg:self-start">
              <PoemInkSpinner
                label="Drop the ink for another poem"
                spinning={spinning}
                target={seed}
                onSpin={() => void roll()}
                size={size}
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]" style={mono}>
                {busy ? 'Blooming…' : 'Tap the ink'}
              </p>
            </div>

            <div className="flex min-h-[300px] min-w-0 flex-col">
              <div
                className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]"
                style={mono}
              >
                <span className="flex items-center gap-2">
                  Poem №{String(card?.no ?? 0).padStart(2, '0')}
                  {card && !busy && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] tracking-[0.2em] text-white"
                      style={{ background: `linear-gradient(135deg, ${palette.b}, ${palette.a})` }}
                    >
                      {card.daily ? 'Poem of the day' : palette.label}
                    </span>
                  )}
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <kbd className="rounded border border-[var(--py-line)] px-1.5 py-0.5">space</kbd>
                  <span>for another</span>
                </span>
              </div>

              <div className="my-auto py-8" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  {busy || !card ? (
                    <motion.div
                      key="busy"
                      aria-hidden
                      className="flex flex-col gap-3.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="h-7 w-1/2 animate-pulse rounded-full bg-[var(--py-fg)]/10 motion-reduce:animate-none" />
                      {[90, 76, 84, 58, 72].map((w, i) => (
                        <span
                          key={i}
                          className="h-4 animate-pulse rounded-full bg-[var(--py-fg)]/10 motion-reduce:animate-none"
                          style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.article key={card.no} className="max-w-[36rem]">
                      <h2
                        className="text-[clamp(1.9rem,4.4vw,3.2rem)] leading-[1.05] tracking-tight"
                        style={display}
                      >
                        {card.poem.title}
                      </h2>
                      <p className="mt-2 text-[1.15rem] italic" style={{ ...display, color: palette.b }}>
                        {card.poem.author}
                      </p>
                      <p
                        className="mt-2 text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]"
                        style={mono}
                      >
                        {realLines} lines · ~{minutes} min
                      </p>

                      <div
                        className={cn('relative mt-7', long && !expanded && 'pb-2')}
                        style={
                          long && !expanded
                            ? { WebkitMaskImage: 'linear-gradient(#000 55%, transparent 98%)', maskImage: 'linear-gradient(#000 55%, transparent 98%)' }
                            : undefined
                        }
                      >
                        {shown.map((line, i) =>
                          line.trim() ? (
                            <motion.p
                              key={i}
                              className="text-[clamp(1.1rem,2.1vw,1.45rem)] leading-[1.5]"
                              style={display}
                              initial={{ opacity: 0, x: -10, filter: 'blur(6px)' }}
                              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                              transition={{
                                duration: 0.5,
                                delay: Math.min(i * 0.06, 1.2),
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            >
                              {line}
                            </motion.p>
                          ) : (
                            <div key={i} className="h-4" aria-hidden />
                          ),
                        )}
                      </div>
                    </motion.article>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void roll()}
                  disabled={busy}
                  className="group/btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[13px] font-medium tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                  style={{
                    ...mono,
                    background: `linear-gradient(90deg, ${palette.b}, ${palette.a})`,
                    transition: 'background .9s, filter .2s, transform .2s',
                  }}
                >
                  {busy ? 'Blooming…' : 'Another poem'}
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
                {long && !busy && (
                  <button
                    type="button"
                    onClick={() => setExpanded(e => !e)}
                    className="text-[12px] tracking-wide text-[var(--py-mute)] underline-offset-4 transition-colors hover:text-[var(--py-fg)] hover:underline"
                    style={mono}
                  >
                    {expanded ? 'Show less' : `Read all ${realLines} lines`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Earlier poems */}
        {past.length > 0 && (
          <section className="mt-10" aria-label="Earlier poems">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]" style={mono}>
              Earlier this visit
            </p>
            <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
              {past.map(h => (
                <li key={h.no} className="snap-start">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setCard(h)
                      setExpanded(false)
                    }}
                    className="flex h-full w-64 flex-col gap-2 rounded-2xl border border-[var(--py-line)] bg-[var(--py-card)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--py-fg)]/30 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[var(--py-mute)]" style={mono}>
                      №{String(h.no).padStart(2, '0')}
                      <span aria-hidden>{PALETTE[h.mood].emoji}</span>
                    </span>
                    <span className="line-clamp-2 text-[19px] leading-snug" style={display}>
                      {h.poem.title}
                    </span>
                    <span className="text-[14px] italic text-[var(--py-mute)]" style={display}>
                      {h.poem.author}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* The tour loops back to the start */}
        <Link
          href="/cat-facts"
          className="group/next relative isolate mt-14 block overflow-hidden rounded-[2rem] border border-[var(--py-line)] bg-[var(--py-card)] p-8 transition-transform duration-300 hover:-translate-y-0.5 md:p-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 transition-opacity duration-500 group-hover/next:opacity-90 dark:opacity-60 dark:group-hover/next:opacity-100"
          >
            <div
              className="py-glow absolute inset-0"
              style={{ '--py-g1': '#d97706', '--py-g2': '#fde68a' } as React.CSSProperties}
            />
            <div className="absolute inset-[20px] rounded-[1.6rem] bg-[var(--py-card)] blur-[24px] transition-[inset] duration-700 group-hover/next:inset-[34px]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]" style={mono}>
            Next page · back to № 01
          </p>
          <div className="mt-4 flex items-end justify-between gap-6">
            <div>
              <p
                className="text-[clamp(2.4rem,8vw,5.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]"
                style={mark}
              >
                Cat facts
              </p>
              <p className="mt-3 max-w-sm text-[15px] text-[var(--py-mute)]">
                Wake the eye and start the tour again, from the felines.
              </p>
            </div>
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--py-line)] bg-[var(--py-bg)] transition-all duration-300 group-hover/next:scale-110 group-hover/next:bg-[var(--py-fg)] group-hover/next:text-[var(--py-ink-on)] md:size-20">
              <ArrowUpRight className="size-6 md:size-8" />
            </span>
          </div>
        </Link>
      </div>
    </main>
  )
}
