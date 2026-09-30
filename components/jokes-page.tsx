'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { DIE_CATEGORIES, DIE_FACES, JokeDieSpinner, SPIN_MS } from '@/components/diversion-spinners'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import { CopyButton } from '@/components/copy-button'
import { cn } from '@/lib/utils'
import type { Joke, JokeResponse } from '@/types/jokeapi'

const display = { fontFamily: 'var(--font-jk-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-jk-mono), ui-monospace, monospace' } as const
const mark = { fontFamily: 'var(--font-jk-mark), system-ui, sans-serif' } as const

type Card = { no: number; category: string; setup: string; punchline?: string }

// Shown when the live API is down or keeps repeating itself, so the page never goes quiet.
const FALLBACK: { category: string; setup: string; punchline?: string }[] = [
  { category: 'Programming', setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs.' },
  { category: 'Programming', setup: 'What do you call a developer who doesn’t comment code?', punchline: 'A developer.' },
  { category: 'Pun', setup: 'I used to hate facial hair.', punchline: 'But then it grew on me.' },
  { category: 'Pun', setup: 'Why don’t eggs tell jokes?', punchline: 'They’d crack each other up.' },
  { category: 'Misc', setup: 'What did the ocean say to the beach?', punchline: 'Nothing, it just waved.' },
  { category: 'Misc', setup: 'Why did the scarecrow win an award?', punchline: 'He was outstanding in his field.' },
  { category: 'Dark', setup: 'My wallet is like an onion.', punchline: 'Opening it makes me cry.' },
  { category: 'Spooky', setup: 'Why don’t ghosts like rain?', punchline: 'It dampens their spirits.' },
  { category: 'Christmas', setup: 'What do you call a snowman in July?', punchline: 'A puddle.' },
  { category: 'Christmas', setup: 'Why was the snowman looking through the carrots?', punchline: 'He was picking his nose.' },
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const faceOf = (cat: string) => DIE_FACES.find(f => f.cat === cat) ?? DIE_FACES[0]

function isJoke(data: JokeResponse): data is Joke {
  return !data.error && 'id' in data && !('jokes' in data)
}

async function fetchLive(category: string): Promise<(Omit<Card, 'no'> & { key: string }) | null> {
  try {
    const res = await fetch(`/api/jokes?category=${encodeURIComponent(category)}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    const json: JokeResponse = await res.json()
    if (!res.ok || !isJoke(json)) return null
    const setup = json.type === 'twopart' ? json.setup : json.joke
    if (!setup) return null
    return {
      key: String(json.id),
      category: json.category && DIE_CATEGORIES.includes(json.category) ? json.category : category,
      setup,
      punchline: json.type === 'twopart' ? json.delivery : undefined,
    }
  } catch {
    return null
  }
}

async function pickJoke(category: string, seen: Set<string>): Promise<Omit<Card, 'no'>> {
  for (let i = 0; i < 3; i++) {
    const j = await fetchLive(category)
    if (!j) break // the source is down or slow: go straight to the built-in list
    if (!seen.has(j.key)) {
      seen.add(j.key)
      return j
    }
  }
  const mine = FALLBACK.filter(f => f.category === category && !seen.has(f.setup))
  const any = FALLBACK.filter(f => !seen.has(f.setup))
  const pool = mine.length ? mine : any.length ? any : FALLBACK
  const pick = pool[Math.floor(Math.random() * pool.length)]
  seen.add(pick.setup)
  return pick
}

const CSS = `
  @property --jk-g1 { syntax: '<color>'; inherits: true; initial-value: #a855f7; }
  @property --jk-g2 { syntax: '<color>'; inherits: true; initial-value: #f472b6; }
  @keyframes jk-breathe { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
  @keyframes jk-drift { 0% { background-position: 0% 0% } 50% { background-position: 100% 100% } 100% { background-position: 0% 0% } }
  @keyframes jk-marquee { to { transform: translateX(-50%) } }

  .jk-root {
    --jk-bg: #f4f0f7; --jk-fg: #150f1c; --jk-mute: rgba(21,15,28,.56); --jk-line: rgba(21,15,28,.14);
    --jk-card: #fbf9fd; --jk-ink-on: #f4f0f7;
  }
  :is(html.dark, .dark) .jk-root {
    --jk-bg: #0f0c14; --jk-fg: rgba(255,255,255,.93); --jk-mute: rgba(255,255,255,.52); --jk-line: rgba(255,255,255,.14);
    --jk-card: #171320; --jk-ink-on: #0f0c14;
  }
  .jk-glow {
    --jk-g1: #a855f7; --jk-g2: #f472b6;
    background-image: linear-gradient(135deg, var(--jk-g1), var(--jk-g2) 50%, var(--jk-g1));
    background-size: 200% 200%;
    transition: --jk-g1 .9s ease, --jk-g2 .9s ease;
    animation: jk-breathe 6s ease-in-out infinite, jk-drift 20s ease-in-out infinite;
  }
  .jk-outline { -webkit-text-stroke: 2px var(--jk-fg); color: transparent; }
  @media (prefers-reduced-motion: reduce) {
    .jk-glow, .jk-marquee-track { animation: none !important }
  }
`

const RIBBON = ['PUNS', 'SETUP', 'PUNCHLINE', 'GROAN', 'LOL', 'DRUMROLL', 'OOF', 'HA']

export function JokesPage() {
  const [card, setCard] = useState<Card | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [history, setHistory] = useState<Card[]>([])
  const [busy, setBusy] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [dieCat, setDieCat] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('Any')
  const [face, setFace] = useState(DIE_FACES[0].cat as string)
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

  const show = useCallback((joke: Omit<Card, 'no'>) => {
    counter.current += 1
    const entry = { ...joke, no: counter.current }
    setCard(entry)
    setRevealed(!joke.punchline)
    setFace(joke.category)
    setHistory(h => [entry, ...h].slice(0, 12))
  }, [])

  // First joke on arrival; the die just shows its face.
  useEffect(() => {
    let alive = true
    void (async () => {
      const cat = DIE_CATEGORIES[Math.floor(Math.random() * DIE_CATEGORIES.length)]
      const j = await pickJoke(cat, seen.current)
      if (!alive) return
      show(j)
      setBusy(false)
      busyRef.current = false
    })()
    return () => {
      alive = false
    }
  }, [show])

  const roll = useCallback(
    async (category = filter) => {
      if (busyRef.current) return
      busyRef.current = true
      // The die always lands on a real face: with "Any", one of the six is picked for the roll.
      const cat = category === 'Any' ? DIE_CATEGORIES[Math.floor(Math.random() * DIE_CATEGORIES.length)] : category
      setDieCat(cat)
      setBusy(true)
      setSpinning(true)
      const started = Date.now()
      setTimeout(() => setSpinning(false), SPIN_MS)
      const j = await pickJoke(cat, seen.current)
      await sleep(Math.max(0, SPIN_MS - (Date.now() - started)))
      show(j)
      setBusy(false)
      busyRef.current = false
    },
    [filter, show],
  )

  const primary = useCallback(() => {
    if (busyRef.current) return
    if (card && !revealed) setRevealed(true)
    else void roll()
  }, [card, revealed, roll])

  // Space / Enter / → reveal the punchline first, then roll again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        primary()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [primary])

  const palette = faceOf(face)
  const glowVars = { '--jk-g1': palette.to, '--jk-g2': palette.from } as React.CSSProperties
  const past = history.filter(h => h.no !== card?.no)
  const len = (card?.setup.length ?? 0) + (revealed ? (card?.punchline?.length ?? 0) : 0)
  const pending = !!card && !revealed

  return (
    <main className="jk-root relative min-h-screen overflow-x-clip bg-[var(--jk-bg)] text-[var(--jk-fg)]">
      <style>{CSS}</style>

      {/* Nav */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel hidden text-[10px] tracking-[0.2em] text-black/50 sm:inline dark:text-white/50">
            JOKES
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
        {/* Masthead: centred this time, with the outline on the tail of the word. */}
        <header className="relative text-center">
          <div
            className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--jk-mute)]"
            style={mono}
          >
            <Link
              href="/dog-facts"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--jk-line)] px-2.5 py-1 transition-colors hover:bg-[var(--jk-fg)] hover:text-[var(--jk-ink-on)]"
            >
              <ArrowLeft className="size-3" />
              Dogs
            </Link>
            <span>№ 03 · Six flavours of funny</span>
          </div>
          <h1
            className="mt-5 text-[clamp(3rem,16.5vw,10.5rem)] font-extrabold uppercase leading-[0.82] tracking-[-0.04em]"
            style={mark}
          >
            <span className="whitespace-nowrap">
              Jo
              <span className="jk-outline">kes</span>
              <span
                aria-hidden
                className="ml-[0.05em] inline-block size-[0.14em] rounded-full"
                style={{ background: palette.to, transition: 'background .9s' }}
              />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[var(--jk-mute)]">
            Roll the die, read the setup, then decide whether you’re ready for the punchline.
          </p>
        </header>

        {/* Tilted ribbon */}
        <div
          aria-hidden
          className="relative -mx-5 mt-10 -rotate-[1.2deg] overflow-hidden border-y border-[var(--jk-line)] bg-[var(--jk-fg)] py-2.5 text-[var(--jk-ink-on)] md:-mx-8"
        >
          <div
            className="jk-marquee-track flex w-max gap-8 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ ...mono, animation: 'jk-marquee 34s linear infinite' }}
          >
            {[...RIBBON, ...RIBBON, ...RIBBON, ...RIBBON].map((w, i) => (
              <span key={i} className="flex items-center gap-8">
                {w}
                <span className="opacity-40">✺</span>
              </span>
            ))}
          </div>
        </div>

        {/* Flavour picker: the die lands on the flavour you choose */}
        <div
          role="radiogroup"
          aria-label="Joke flavour"
          className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0"
        >
          {['Any', ...DIE_CATEGORIES].map(c => {
            const on = filter === c
            const f = c === 'Any' ? null : faceOf(c)
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={busy}
                onClick={() => {
                  setFilter(c)
                  void roll(c)
                }}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[12px] tracking-wide transition-all active:scale-[0.97] disabled:opacity-60',
                  on
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-[var(--jk-line)] bg-[var(--jk-card)] text-[var(--jk-fg)]/80 hover:-translate-y-0.5 hover:border-[var(--jk-fg)]/30',
                )}
                style={{
                  ...mono,
                  ...(on
                    ? { background: `linear-gradient(135deg, ${f?.to ?? '#a855f7'}, ${f?.from ?? '#f472b6'})` }
                    : {}),
                }}
              >
                <span aria-hidden>{f ? f.emoji : '🎲'}</span>
                {f ? f.label : 'Any'}
              </button>
            )
          })}
        </div>

        {/* Stage */}
        <section
          aria-label="Joke"
          className="group/stage relative isolate mt-6 overflow-hidden rounded-[2rem] border border-[var(--jk-line)] bg-[var(--jk-card)]"
          onPointerMove={e => {
            const r = e.currentTarget.getBoundingClientRect()
            e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
            e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
          }}
        >
          {/* Light inside the border, in the colours of the face the die landed on. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-90">
            <div className="jk-glow absolute inset-0" style={glowVars} />
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/stage:opacity-100"
              style={{
                background: `radial-gradient(340px circle at var(--mx,50%) var(--my,50%), ${palette.to}38, transparent 70%)`,
              }}
            />
            <div className="absolute inset-[22px] rounded-[1.6rem] bg-[var(--jk-card)] blur-[26px] transition-[inset] duration-700 ease-out group-hover/stage:inset-[38px]" />
          </div>

          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[auto_1fr] lg:gap-14 lg:p-14">
            <div className="flex flex-col items-center gap-4">
              <JokeDieSpinner
                label="Roll the die for another joke"
                spinning={spinning}
                category={dieCat}
                onSpin={() => void roll()}
                size={size}
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--jk-mute)]" style={mono}>
                {busy ? 'Rolling…' : 'Tap the die'}
              </p>
            </div>

            <div className="flex min-h-[280px] min-w-0 flex-col">
              <div
                className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--jk-mute)]"
                style={mono}
              >
                <span className="flex items-center gap-2">
                  Joke №{String(card?.no ?? 0).padStart(2, '0')}
                  {card && !busy && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] tracking-[0.2em] text-white"
                      style={{ background: `linear-gradient(135deg, ${palette.to}, ${palette.from})` }}
                    >
                      {palette.label}
                    </span>
                  )}
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <kbd className="rounded border border-[var(--jk-line)] px-1.5 py-0.5">space</kbd>
                  <span>{pending ? 'for the punchline' : 'to roll'}</span>
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
                      {[92, 70, 40].map((w, i) => (
                        <span
                          key={i}
                          className="h-5 animate-pulse rounded-full bg-[var(--jk-fg)]/10 motion-reduce:animate-none"
                          style={{ width: `${w}%`, animationDelay: `${i * 140}ms` }}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={card.no}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p
                        className={cn(
                          'whitespace-pre-line tracking-tight',
                          len > 200
                            ? 'text-[clamp(1.25rem,2.8vw,2rem)] leading-[1.25]'
                            : len > 110
                              ? 'text-[clamp(1.5rem,3.4vw,2.5rem)] leading-[1.18]'
                              : 'text-[clamp(1.8rem,4.4vw,3.2rem)] leading-[1.12]',
                        )}
                        style={display}
                      >
                        {card.setup}
                      </p>

                      {card.punchline && (
                        <div className="mt-6 min-h-[3.2rem]">
                          <AnimatePresence initial={false}>
                            {revealed ? (
                              <motion.p
                                key="punch"
                                className="text-[clamp(1.5rem,3.6vw,2.6rem)] italic leading-[1.15] tracking-tight"
                                style={{ ...display, color: palette.to }}
                              >
                                {card.punchline.split(' ').map((w, i) => (
                                  <Fragment key={i}>
                                    <motion.span
                                      className="inline-block"
                                      initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
                                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                      transition={{ duration: 0.5, delay: Math.min(i * 0.05, 1), ease: [0.22, 1, 0.36, 1] }}
                                    >
                                      {w}
                                    </motion.span>{' '}
                                  </Fragment>
                                ))}
                              </motion.p>
                            ) : (
                              <motion.p
                                key="hidden"
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[var(--jk-mute)]"
                                style={mono}
                              >
                                <span className="inline-flex gap-1" aria-hidden>
                                  {[0, 1, 2].map(i => (
                                    <span
                                      key={i}
                                      className="size-1.5 animate-bounce rounded-full bg-[var(--jk-mute)] motion-reduce:animate-none"
                                      style={{ animationDelay: `${i * 140}ms` }}
                                    />
                                  ))}
                                </span>
                                The punchline is waiting
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={primary}
                  disabled={busy}
                  className="group/btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[13px] font-medium tracking-wide text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 sm:w-auto"
                  style={{
                    ...mono,
                    background: `linear-gradient(90deg, ${palette.to}, ${palette.from})`,
                    transition: 'background .9s, filter .2s, transform .2s',
                  }}
                >
                  {busy ? 'Rolling…' : pending ? 'Reveal the punchline' : 'Roll again'}
                  <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
                </button>
                <CopyButton
                  text={card ? [card.setup, card.punchline].filter(Boolean).join('\n') : ''}
                  disabled={busy}
                  lineVar="var(--jk-line)"
                  style={mono}
                />
                {pending && !busy && (
                  <button
                    type="button"
                    onClick={() => void roll()}
                    className="text-[12px] tracking-wide text-[var(--jk-mute)] underline-offset-4 transition-colors hover:text-[var(--jk-fg)] hover:underline"
                    style={mono}
                  >
                    Skip this one
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Earlier jokes */}
        {past.length > 0 && (
          <section className="mt-10" aria-label="Earlier jokes">
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-[var(--jk-mute)]" style={mono}>
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
                      setRevealed(true)
                      setFace(h.category)
                    }}
                    className="flex h-full w-64 flex-col gap-2 rounded-2xl border border-[var(--jk-line)] bg-[var(--jk-card)] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--jk-fg)]/30 disabled:opacity-50"
                  >
                    <span className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-[var(--jk-mute)]" style={mono}>
                      №{String(h.no).padStart(2, '0')}
                      <span aria-hidden>{faceOf(h.category).emoji}</span>
                    </span>
                    <span className="line-clamp-3 text-[17px] leading-snug" style={display}>
                      {h.setup}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Next page */}
        <Link
          href="/poetry"
          className="group/next relative isolate mt-28 block overflow-hidden rounded-[2rem] border border-[var(--jk-line)] bg-[var(--jk-card)] p-6 transition-transform duration-300 hover:-translate-y-0.5 md:px-10 md:py-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 transition-opacity duration-500 group-hover/next:opacity-90 dark:opacity-60 dark:group-hover/next:opacity-100"
          >
            <div
              className="jk-glow absolute inset-0"
              style={{ '--jk-g1': '#6366f1', '--jk-g2': '#38bdf8' } as React.CSSProperties}
            />
            <div className="absolute inset-[20px] rounded-[1.6rem] bg-[var(--jk-card)] blur-[24px] transition-[inset] duration-700 group-hover/next:inset-[34px]" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--jk-mute)]" style={mono}>
            Next page · № 04
          </p>
          <div className="mt-2 flex items-center justify-between gap-6">
            <div>
              <p
                className="text-[clamp(1.5rem,5vw,3.5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.03em]"
                style={mark}
              >
                Poetry
              </p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--jk-line)] bg-[var(--jk-bg)] transition-all duration-300 group-hover/next:scale-110 group-hover/next:bg-[var(--jk-fg)] group-hover/next:text-[var(--jk-ink-on)] md:size-14">
              <ArrowUpRight className="size-5 md:size-6" />
            </span>
          </div>
        </Link>
      </div>
    </main>
  )
}
