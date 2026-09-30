'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  CAT_EYE_COUNT,
  CAT_IRISES,
  CatEyeSpinner,
  SPIN_MS,
} from '@/components/diversion-spinners'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import { cn } from '@/lib/utils'

const display = { fontFamily: 'var(--font-af-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-af-mono), ui-monospace, monospace' } as const
const mark = { fontFamily: 'var(--font-af-mark), system-ui, sans-serif' } as const

// Shown when the live API is down or keeps repeating itself, so the page never goes quiet.
const FALLBACK_FACTS = [
  'A group of cats is called a clowder.',
  'Cats sleep for about two thirds of their lives.',
  'A cat’s nose print is as unique as a human fingerprint.',
  'Cats can rotate their ears 180 degrees.',
  'A house cat can run about 30 miles per hour in a short sprint.',
  'Cats have a third eyelid, called the haw, that protects their eyes.',
  'A cat’s purr vibrates at a frequency that may help bones and tissue heal.',
  'Cats walk like camels and giraffes: both right legs first, then both left.',
  'Adult cats rarely meow at each other. They save it for humans.',
  'A cat can jump up to six times its own length in a single leap.',
  'Cats have about 32 muscles in each ear.',
  'Most cats are lactose intolerant, so milk can upset their stomachs.',
  'A cat’s whiskers are roughly as wide as its body, helping it judge tight spaces.',
  'Cats spend around a third of their waking hours grooming themselves.',
  'The first cat in space was a French cat named Félicette, in 1963.',
  'Cats can’t taste sweetness.',
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function fetchLiveFact(): Promise<string | null> {
  try {
    const res = await fetch('https://catfact.ninja/fact', {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { fact?: string }
    return data.fact?.trim() || null
  } catch {
    return null
  }
}

/** Live fact that hasn't been shown yet; falls back to the built-in list. */
async function pickFact(seen: Set<string>): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const fact = await fetchLiveFact()
    if (fact && !seen.has(fact)) return fact
  }
  const unseen = FALLBACK_FACTS.filter(f => !seen.has(f))
  const pool = unseen.length ? unseen : FALLBACK_FACTS
  return pool[Math.floor(Math.random() * pool.length)]
}

type Entry = { no: number; text: string }

const CSS = `
  @property --cf-g1 { syntax: '<color>'; inherits: true; initial-value: #d97706; }
  @property --cf-g2 { syntax: '<color>'; inherits: true; initial-value: #fde68a; }
  @keyframes cf-breathe { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
  @keyframes cf-drift { 0% { background-position: 0% 0% } 50% { background-position: 100% 100% } 100% { background-position: 0% 0% } }
  @keyframes cf-marquee { to { transform: translateX(-50%) } }

  .cf-root {
    --cf-bg: #f3efe7; --cf-fg: #17150f; --cf-mute: rgba(23,21,15,.55); --cf-line: rgba(23,21,15,.14);
    --cf-card: #fbf8f2; --cf-card-2: #efe9dd; --cf-ink-on: #f3efe7;
  }
  :is(html.dark, .dark) .cf-root {
    --cf-bg: #0e0f11; --cf-fg: rgba(255,255,255,.93); --cf-mute: rgba(255,255,255,.52); --cf-line: rgba(255,255,255,.14);
    --cf-card: #15171a; --cf-card-2: #1c1f23; --cf-ink-on: #0e0f11;
  }
  .cf-glow {
    --cf-g1: #d97706; --cf-g2: #fde68a;
    background-image: linear-gradient(135deg, var(--cf-g1), var(--cf-g2) 50%, var(--cf-g1));
    background-size: 200% 200%;
    transition: --cf-g1 .9s ease, --cf-g2 .9s ease;
    animation: cf-breathe 6s ease-in-out infinite, cf-drift 20s ease-in-out infinite;
  }
  .cf-outline { -webkit-text-stroke: 2px var(--cf-fg); color: transparent; }
  @media (prefers-reduced-motion: reduce) {
    .cf-glow, .cf-marquee-track { animation: none !important }
  }
`

const RIBBON = ['PURR', 'POUNCE', 'NAP', 'ZOOMIES', 'WHISKERS', 'KNEAD', 'STARE', 'LOAF']

export function CatFactsPage() {
  const [fact, setFact] = useState<Entry | null>(null)
  const [history, setHistory] = useState<Entry[]>([])
  const [busy, setBusy] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [target, setTarget] = useState<number | null>(null)
  const [iris, setIris] = useState(0)
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

  // First fact on arrival (no spin needed: the eye is just waking up).
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
    const t = Math.floor(Math.random() * CAT_EYE_COUNT)
    setTarget(t)
    setBusy(true)
    setSpinning(true)
    const started = Date.now()
    setTimeout(() => setIris(t), SPIN_MS * 0.85)
    setTimeout(() => setSpinning(false), SPIN_MS)
    const text = await pickFact(seen.current)
    await sleep(Math.max(0, SPIN_MS - (Date.now() - started)))
    reveal(text)
    setBusy(false)
    busyRef.current = false
  }, [reveal])

  // Space / Enter / → also pull the next fact.
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

  const palette = CAT_IRISES[iris]
  const glowVars = { '--cf-g1': palette.b, '--cf-g2': palette.a } as React.CSSProperties
  const words = fact?.text.split(' ') ?? []
  const past = history.filter(h => h.no !== fact?.no)

  return (
    <main className="cf-root relative min-h-screen overflow-x-clip bg-[var(--cf-bg)] text-[var(--cf-fg)]">
      <style>{CSS}</style>

      {/* Nav */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel hidden text-[10px] tracking-[0.2em] text-black/50 sm:inline dark:text-white/50">
            CAT FACTS
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
        {/* Masthead */}
        <header className="relative">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--cf-mute)]" style={mono}>
            <span className="rounded-full border border-[var(--cf-line)] px-2.5 py-1">№ 01</span>
            <span>Felis catus · live facts</span>
          </div>
          <h1
            className="mt-5 text-[clamp(3.2rem,15vw,8.6rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em]"
            style={mark}
          >
            Cat
            <br />
            <span className="whitespace-nowrap">
              <span className="cf-outline">Facts</span>
              <span aria-hidden className="ml-[0.05em] inline-block size-[0.15em] rounded-full" style={{ background: palette.b, transition: 'background .9s' }} />
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--cf-mute)]">
            Wake the eye, meet a fact. Every tap fetches a fresh curiosity from the feline world.
          </p>
        </header>

        {/* Tilted ribbon */}
        <div
          aria-hidden
          className="relative -mx-5 mt-10 -rotate-[1.6deg] overflow-hidden border-y border-[var(--cf-line)] bg-[var(--cf-fg)] py-2.5 text-[var(--cf-ink-on)] md:-mx-8"
        >
          <div className="cf-marquee-track flex w-max gap-8 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ ...mono, animation: 'cf-marquee 38s linear infinite' }}>
            {[...RIBBON, ...RIBBON, ...RIBBON, ...RIBBON].map((w, i) => (
              <span key={i} className="flex items-center gap-8">
                {w}
                <span className="opacity-40">✦</span>
              </span>
            ))}
          </div>
        </div>

        {/* Stage */}
        <section
          aria-label="Cat fact"
          className="group/stage relative isolate mt-12 overflow-hidden rounded-[2rem] border border-[var(--cf-line)] bg-[var(--cf-card)]"
          onPointerMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
            e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
          }}
        >
          {/* Light inside the border: coloured gradient under a blurred plate in the card colour. The
              colours follow the iris of the eye, so every spin repaints the room. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-90">
            <div className="cf-glow absolute inset-0" style={glowVars} />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/stage:opacity-100"
              style={{ background: `radial-gradient(340px circle at var(--mx,50%) var(--my,50%), ${palette.b}38, transparent 70%)` }}
            />
            <div className="absolute inset-[22px] rounded-[1.6rem] bg-[var(--cf-card)] blur-[26px] transition-[inset] duration-700 ease-out group-hover/stage:inset-[38px]" />
          </div>

          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-14 lg:p-14">
            <div className="flex flex-col items-center gap-4">
              <CatEyeSpinner
                label="Wake the cat for another fact"
                spinning={spinning}
                target={target}
                onSpin={() => void next()}
                size={size}
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--cf-mute)]" style={mono}>
                {busy ? 'Purring…' : 'Tap the eye'}
              </p>
            </div>

            <div className="flex min-h-[260px] min-w-0 flex-col">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-[var(--cf-mute)]" style={mono}>
                <span>Fact №{String(fact?.no ?? 0).padStart(2, '0')}</span>
                <span className="hidden items-center gap-2 sm:flex">
                  <kbd className="rounded border border-[var(--cf-line)] px-1.5 py-0.5">space</kbd>
                  <span>for next</span>
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
                          className="h-5 animate-pulse rounded-full bg-[var(--cf-fg)]/10 motion-reduce:animate-none"
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
                        (fact?.text.length ?? 0) > 180
                          ? 'text-[clamp(1.2rem,2.6vw,1.9rem)] leading-[1.25]'
                          : (fact?.text.length ?? 0) > 110
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
                          transition={{ duration: 0.5, delay: Math.min(i * 0.035, 1.1), ease: [0.22, 1, 0.36, 1] }}
                        >
                          {w}
                        </motion.span>{' '}
                        </Fragment>
                      ))}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => void next()}
                disabled={busy}
                className="group/btn inline-flex h-12 w-full items-center justify-center gap-2 self-start rounded-full px-6 text-[13px] font-medium tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                style={{ ...mono, background: `linear-gradient(90deg, ${palette.b}, ${palette.rim})`, transition: 'background .9s, filter .2s, transform .2s' }}
              >
                {busy ? 'Purring…' : 'Another fact'}
                <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Earlier facts */}
        {past.length > 0 && (
          <section className="mt-10" aria-label="Earlier facts">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--cf-mute)]" style={mono}>
              Earlier this visit
            </p>
            <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
              {past.map(h => (
                <li key={h.no} className="snap-start">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setFact(h)}
                    className="flex h-full w-64 flex-col gap-2 rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-card)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--cf-fg)]/30 disabled:opacity-50"
                  >
                    <span className="text-[10px] tracking-[0.25em] text-[var(--cf-mute)]" style={mono}>
                      №{String(h.no).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-3 text-[17px] leading-snug" style={display}>
                      {h.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Next page */}
        <Link
          href="/dog-facts"
          className="group/next relative isolate mt-14 block overflow-hidden rounded-[2rem] border border-[var(--cf-line)] bg-[var(--cf-card)] p-8 transition-transform duration-300 hover:-translate-y-0.5 md:p-12"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40 transition-opacity duration-500 group-hover/next:opacity-90 dark:opacity-60 dark:group-hover/next:opacity-100">
            <div
              className="cf-glow absolute inset-0"
              style={{ '--cf-g1': '#10b981', '--cf-g2': '#67e8f9' } as React.CSSProperties}
            />
            <div className="absolute inset-[20px] rounded-[1.6rem] bg-[var(--cf-card)] blur-[24px] transition-[inset] duration-700 group-hover/next:inset-[34px]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--cf-mute)]" style={mono}>
            Next page · № 02
          </p>
          <div className="mt-4 flex items-end justify-between gap-6">
            <div>
              <p className="text-[clamp(2.4rem,8vw,5.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]" style={mark}>
                Dog facts
              </p>
              <p className="mt-3 max-w-sm text-[15px] text-[var(--cf-mute)]">
                Loyal, goofy and full of surprising science. Fetch the next one.
              </p>
            </div>
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--cf-line)] bg-[var(--cf-bg)] transition-all duration-300 group-hover/next:scale-110 group-hover/next:bg-[var(--cf-fg)] group-hover/next:text-[var(--cf-ink-on)] md:size-20">
              <ArrowUpRight className={cn('size-6 md:size-8')} />
            </span>
          </div>
        </Link>
      </div>
    </main>
  )
}
