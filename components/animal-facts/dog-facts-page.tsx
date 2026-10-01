'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  DOG_BALLS,
  DOG_BALL_COUNT,
  DogBallSpinner,
  SPIN_MS,
} from '@/components/diversion-spinners'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import { CopyButton, CopyIconButton } from '@/components/copy-button'
import { GlowButton } from '@/components/glow-button'
import { cn } from '@/lib/utils'

const display = { fontFamily: 'var(--font-af-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-af-mono), ui-monospace, monospace' } as const
const mark = { fontFamily: 'var(--font-af-mark), system-ui, sans-serif' } as const

// Shown when the live API is down or keeps repeating itself, so the page never goes quiet.
const FALLBACK_FACTS = [
  'A dog’s nose print is unique, much like a human fingerprint.',
  'Dogs can understand about 150 words, and the smartest may learn over 250.',
  'A dog’s sense of smell is at least 10,000 times stronger than ours.',
  'Puppies are born deaf and blind, and open their eyes after about two weeks.',
  'Dogs sweat mainly through their paw pads, and cool down by panting.',
  'Greyhounds can reach speeds of about 45 miles per hour.',
  'A wagging tail to the right usually signals a happier dog than one wagging left.',
  'Dogs dream, and their paws often twitch while they do.',
  'Dalmatian puppies are born completely white; their spots come later.',
  'Dogs have about 300 million smell receptors. Humans have around 6 million.',
  'A dog’s hearing is about four times better than a human’s.',
  'Newfoundlands have webbed feet, which makes them excellent swimmers.',
  'Dogs curl up to sleep to protect their vital organs, a habit from wild ancestors.',
  'The Basenji is known as the barkless dog, though it yodels instead.',
  'Dogs can tell time: they learn your routine and know when you usually come home.',
  'A dog’s whiskers help it sense tiny changes in air currents around it.',
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function fetchLiveFact(): Promise<string | null> {
  try {
    const res = await fetch('/api/dog-facts', { cache: 'no-store', signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.error) return null
    const fact = Array.isArray(data) ? data[0]?.fact : data?.fact
    return typeof fact === 'string' && fact.trim() ? fact.trim() : null
  } catch {
    return null
  }
}

/** Live fact that hasn't been shown yet; falls back to the built-in list. */
async function pickFact(seen: Set<string>): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const fact = await fetchLiveFact()
    if (!fact) break // the source is down or slow: go straight to the built-in list
    if (!seen.has(fact)) return fact
  }
  const unseen = FALLBACK_FACTS.filter(f => !seen.has(f))
  const pool = unseen.length ? unseen : FALLBACK_FACTS
  return pool[Math.floor(Math.random() * pool.length)]
}

type Entry = { no: number; text: string }

const CSS = `
  @property --df-g1 { syntax: '<color>'; inherits: true; initial-value: #9fc316; }
  @property --df-g2 { syntax: '<color>'; inherits: true; initial-value: #eaff72; }
  @keyframes df-breathe { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
  @keyframes df-drift { 0% { background-position: 0% 100% } 50% { background-position: 100% 0% } 100% { background-position: 0% 100% } }
  @keyframes df-marquee { from { transform: translateX(-50%) } to { transform: translateX(0) } }

  .df-root {
    --df-bg: #eef2ea; --df-fg: #11160f; --df-mute: rgba(17,22,15,.56); --df-line: rgba(17,22,15,.14);
    --df-card: #f8faf4; --df-ink-on: #eef2ea;
  }
  :is(html.dark, .dark) .df-root {
    --df-bg: #0b0f0d; --df-fg: rgba(255,255,255,.93); --df-mute: rgba(255,255,255,.52); --df-line: rgba(255,255,255,.14);
    --df-card: #121714; --df-ink-on: #0b0f0d;
  }
  .df-glow {
    --df-g1: #9fc316; --df-g2: #eaff72;
    background-image: linear-gradient(225deg, var(--df-g1), var(--df-g2) 50%, var(--df-g1));
    background-size: 200% 200%;
    transition: --df-g1 .9s ease, --df-g2 .9s ease;
    animation: df-breathe 6s ease-in-out infinite, df-drift 22s ease-in-out infinite;
  }
  .df-outline { -webkit-text-stroke: 2px var(--df-fg); color: transparent; }
  @media (prefers-reduced-motion: reduce) {
    .df-glow, .df-marquee-track { animation: none !important }
  }
`

const RIBBON = ['FETCH', 'WAG', 'ZOOMIES', 'SNIFF', 'GOOD BOY', 'WALKIES', 'TREATS', 'PAWS']

export function DogFactsPage() {
  const [fact, setFact] = useState<Entry | null>(null)
  const [history, setHistory] = useState<Entry[]>([])
  const [busy, setBusy] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [target, setTarget] = useState<number | null>(null)
  const [ball, setBall] = useState(0)
  const [size, setSize] = useState(232)
  const seen = useRef(new Set<string>())
  const counter = useRef(0)
  const busyRef = useRef(true)

  useEffect(() => {
    const update = () => setSize(window.innerWidth < 640 ? 176 : 232)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const reveal = useCallback((text: string) => {
    seen.current.add(text)
    counter.current += 1
    const entry = { no: counter.current, text }
    setFact(entry)
    setHistory(h => [entry, ...h].slice(0, 12))
  }, [])

  // First fact on arrival.
  useEffect(() => {
    let alive = true
    void (async () => {
      const text = await pickFact(seen.current)
      if (!alive) return
      reveal(text)
      setBusy(false)
      busyRef.current = false
    })()
    return () => {
      alive = false
    }
  }, [reveal])

  const next = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    const t = Math.floor(Math.random() * DOG_BALL_COUNT)
    setTarget(t)
    setBusy(true)
    setSpinning(true)
    const started = Date.now()
    setTimeout(() => setBall(t), SPIN_MS * 0.9)
    setTimeout(() => setSpinning(false), SPIN_MS)
    const text = await pickFact(seen.current)
    await sleep(Math.max(0, SPIN_MS - (Date.now() - started)))
    reveal(text)
    setBusy(false)
    busyRef.current = false
  }, [reveal])

  // Space / Enter / → also throw the ball.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        void next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next])

  const palette = DOG_BALLS[ball]
  const glowVars = { '--df-g1': palette.b, '--df-g2': palette.a } as React.CSSProperties
  const words = fact?.text.split(' ') ?? []
  const past = history.filter(h => h.no !== fact?.no)
  const len = fact?.text.length ?? 0

  return (
    <main className="df-root relative min-h-screen overflow-x-clip bg-[var(--df-bg)] text-[var(--df-fg)]">
      <style>{CSS}</style>

      {/* Nav */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel hidden text-[10px] tracking-[0.2em] text-black/50 sm:inline dark:text-white/50">
            DOG FACTS
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
        {/* Masthead: mirrored against the cat page, so the outline sits on the first word. */}
        <header className="relative lg:text-right">
          <div
            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--df-mute)] lg:justify-end"
            style={mono}
          >
            <Link
              href="/cat-facts"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--df-line)] px-2.5 py-1 transition-colors hover:bg-[var(--df-fg)] hover:text-[var(--df-ink-on)]"
            >
              <ArrowLeft className="size-3" />
              Cats
            </Link>
            <span>№ 02 · Canis familiaris</span>
          </div>
          <h1
            className="mt-5 text-[clamp(3.2rem,15vw,8.6rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em]"
            style={mark}
          >
            <span className="df-outline">Dog</span>
            <br />
            <span className="whitespace-nowrap">
              Facts
              <span
                aria-hidden
                className="ml-[0.05em] inline-block size-[0.15em] rounded-full"
                style={{ background: palette.b, transition: 'background .9s' }}
              />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--df-mute)] lg:ml-auto">
            Throw the ball, fetch a fact. Every throw brings back something new about our best friends.
          </p>
        </header>

        {/* Tilted ribbon, running the other way */}
        <div
          aria-hidden
          className="relative -mx-5 mt-10 rotate-[1.6deg] overflow-hidden border-y border-[var(--df-line)] bg-[var(--df-fg)] py-2.5 text-[var(--df-ink-on)] md:-mx-8"
        >
          <div
            className="df-marquee-track flex w-max gap-8 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ ...mono, animation: 'df-marquee 38s linear infinite' }}
          >
            {[...RIBBON, ...RIBBON, ...RIBBON, ...RIBBON].map((w, i) => (
              <span key={i} className="flex items-center gap-8">
                {w}
                <span className="opacity-40">●</span>
              </span>
            ))}
          </div>
        </div>

        {/* Stage */}
        <section
          aria-label="Dog fact"
          className="group/stage relative isolate mt-12 overflow-hidden rounded-[2rem] border border-[var(--df-line)] bg-[var(--df-card)]"
          onPointerMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
            e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
          }}
        >
          {/* Light inside the border. Its colours are those of the ball that was just thrown. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-90">
            <div className="df-glow absolute inset-0" style={glowVars} />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/stage:opacity-100"
              style={{
                background: `radial-gradient(340px circle at var(--mx,50%) var(--my,50%), ${palette.b}38, transparent 70%)`,
              }}
            />
            <div className="absolute inset-[22px] rounded-[1.6rem] bg-[var(--df-card)] blur-[26px] transition-[inset] duration-700 ease-out group-hover/stage:inset-[38px]" />
          </div>

          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-14 lg:p-14">
            {/* Toy first in the DOM on mobile, but on the right from lg up. */}
            <div className="flex flex-col items-center gap-4 lg:order-2">
              <DogBallSpinner
                label="Throw the ball for another fact"
                spinning={spinning}
                target={target}
                onSpin={() => void next()}
                size={size}
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--df-mute)]" style={mono}>
                {busy ? 'Fetching…' : 'Throw the ball'}
              </p>
            </div>

            <div className="flex min-h-[260px] min-w-0 flex-col lg:order-1">
              <div
                className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[var(--df-mute)]"
                style={mono}
              >
                <span>Fact №{String(fact?.no ?? 0).padStart(2, '0')}</span>
                <span className="hidden items-center gap-2 sm:flex">
                  <kbd className="rounded border border-[var(--df-line)] px-1.5 py-0.5">space</kbd>
                  <span>to throw</span>
                </span>
              </div>

              <div className="my-auto py-8" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  {busy ? (
                    <motion.div
                      key="busy"
                      aria-hidden
                      className="flex flex-col gap-3.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {[96, 88, 62].map((w, i) => (
                        <span
                          key={i}
                          className="h-5 animate-pulse rounded-full bg-[var(--df-fg)]/10 motion-reduce:animate-none"
                          style={{ width: `${w}%`, animationDelay: `${i * 140}ms` }}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.p
                      key={fact?.no}
                      className={cn(
                        'leading-[1.14] tracking-tight',
                        // Long facts get a smaller size so they never swamp the card.
                        len > 180
                          ? 'text-[clamp(1.2rem,2.6vw,1.9rem)] leading-[1.25]'
                          : len > 110
                            ? 'text-[clamp(1.45rem,3.2vw,2.4rem)]'
                            : 'text-[clamp(1.7rem,4.2vw,3.1rem)]',
                      )}
                      style={display}
                    >
                      {words.map((w, i) => (
                        <Fragment key={i}>
                          <motion.span
                            className="inline-block"
                            initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{
                              duration: 0.5,
                              delay: Math.min(i * 0.035, 1.1),
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            {w}
                          </motion.span>{' '}
                        </Fragment>
                      ))}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center gap-3">
              <GlowButton
                from={palette.a}
                to={palette.b}
                ink={'#10140a'}
                busy={busy}
                onClick={() => void next()}
                style={mono}
              >
                {busy ? 'Fetching…' : 'Another fact'}
              </GlowButton>
                <CopyButton text={fact?.text ?? ''} disabled={busy} lineVar="var(--df-line)" style={mono} />
              </div>
            </div>
          </div>
        </section>

        {/* Earlier facts */}
        {past.length > 0 && (
          <section className="mt-10" aria-label="Earlier facts">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--df-mute)]" style={mono}>
              Earlier this visit
            </p>
            <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
              {past.map(h => (
                <li key={h.no} className="relative snap-start">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setFact(h)}
                    className="flex h-full w-64 flex-col gap-2 rounded-2xl pr-12 border border-[var(--df-line)] bg-[var(--df-card)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--df-fg)]/30 disabled:opacity-50"
                  >
                    <span className="text-[10px] tracking-[0.25em] text-[var(--df-mute)]" style={mono}>
                      №{String(h.no).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-3 text-[17px] leading-snug" style={display}>
                      {h.text}
                    </span>
                  </button>
                  <CopyIconButton text={h.text} lineVar="var(--df-line)" className="absolute right-2.5 top-2.5" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Next page */}
        <Link
          href="/jokes"
          className="group/next relative isolate mx-auto mt-[13rem] block w-full max-w-[18rem] overflow-hidden rounded-[1.4rem] border border-[var(--df-line)] bg-[var(--df-card)] px-5 py-3 transition-transform duration-300 hover:-translate-y-0.5 md:px-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 transition-opacity duration-500 group-hover/next:opacity-90 dark:opacity-60 dark:group-hover/next:opacity-100"
          >
            <div
              className="df-glow absolute inset-0"
              style={{ '--df-g1': '#a855f7', '--df-g2': '#f472b6' } as React.CSSProperties}
            />
            <div className="absolute inset-[9px] rounded-[1rem] bg-[var(--df-card)] blur-[14px] transition-[inset] duration-700 group-hover/next:inset-[16px]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--df-mute)]" style={mono}>
            Next page · № 03
          </p>
          <div className="mt-0.5 flex items-center justify-between gap-4">
            <div>
              <p
                className="text-[clamp(1rem,3vw,1.3rem)] font-bold uppercase leading-[0.9] tracking-[-0.03em]"
                style={mark}
              >
                Jokes
              </p>
            </div>
            <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--df-line)] bg-[var(--df-bg)] transition-all duration-300 group-hover/next:scale-110 group-hover/next:bg-[var(--df-fg)] group-hover/next:text-[var(--df-ink-on)] md:size-9">
              <ArrowUpRight className="size-4 md:size-4" />
            </span>
          </div>
        </Link>
      </div>
    </main>
  )
}
