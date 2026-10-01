"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, ArrowUpRight, Cat, Dices, Dog, Feather, Laugh, Loader2 } from "lucide-react"
import {
  CAT_EYE_COUNT,
  CatEyeSpinner,
  DIE_CATEGORIES,
  DOG_BALL_COUNT,
  DogBallSpinner,
  JokeDieSpinner,
  PoemInkSpinner,
  SPIN_MS,
} from "@/components/diversion-spinners"
import type { Joke, JokeResponse } from "@/types/jokeapi"
import type { PoetryPoem } from "@/types/poetry"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    num: "01",
    title: "Cat Facts",
    desc: "Curious truths about cats",
    label: "catfact.ninja",
    moreHref: "/cat-facts",
    moreLabel: "More cat facts",
    spinLabel: "Wake the cat",
    busyLabel: "Purring…",
  },
  {
    num: "02",
    title: "Dog Facts",
    desc: "Loyal lore about dogs",
    label: "dog-facts api",
    moreHref: "/dog-facts",
    moreLabel: "More dog facts",
    spinLabel: "Throw the ball",
    busyLabel: "Fetching…",
  },
  {
    num: "03",
    title: "Jokes",
    desc: "Spin for a laugh",
    label: "jokeapi",
    moreHref: "/jokes",
    moreLabel: "More jokes",
    spinLabel: "Roll the die",
    busyLabel: "Rolling…",
  },
  {
    num: "04",
    title: "Poetry",
    desc: "A verse for the moment",
    label: "poetrydb",
    moreHref: "/poetry",
    moreLabel: "More poetry",
    spinLabel: "Drop the ink",
    busyLabel: "Blooming…",
  },
] as const

const PANEL_H = "h-[360px]"

// One light colour family per toy. The big card glows in the active one and fades between them.
const ACCENTS = [
  { a: "#f59e0b", b: "#ef4444", c: "#f97316", rgb: "245,158,11" }, // cat: amber → red
  { a: "#10b981", b: "#22d3ee", c: "#84cc16", rgb: "16,185,129" }, // dog: green → cyan
  { a: "#a855f7", b: "#ec4899", c: "#6366f1", rgb: "168,85,247" }, // jokes: violet → pink
  { a: "#38bdf8", b: "#6366f1", c: "#2dd4bf", rgb: "56,189,248" }, // poetry: sky → indigo
] as const

const TAB_ICONS = [Cat, Dog, Laugh, Feather] as const

const GLOW_CSS = `
  @keyframes devex-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }
  .devex-progress { animation: devex-progress 4020ms linear forwards }
  @keyframes devex-breathe { 0%,100% { opacity: .5 } 50% { opacity: .95 } }
  @keyframes devex-drift { 0% { background-position: 0% 0% } 50% { background-position: 100% 100% } 100% { background-position: 0% 0% } }
  @media (prefers-reduced-motion: reduce) { .devex-glow-layer, .devex-progress { animation: none !important } .devex-progress { transform: scaleX(1) } }
`

function isJoke(data: JokeResponse): data is Joke {
  return !data.error && "id" in data && !("jokes" in data)
}

function jokeText(joke: Joke | null) {
  if (!joke) return ""
  if (joke.type === "twopart") return `${joke.setup}\n\n${joke.delivery}`
  return joke.joke ?? ""
}

export function DevExSection() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)
  const [autoPlay, setAutoPlay] = useState(true)

  const [catFact, setCatFact] = useState("")
  const [dogFact, setDogFact] = useState("")
  const [joke, setJoke] = useState<Joke | null>(null)
  const [poem, setPoem] = useState<PoetryPoem | null>(null)

  const [catLoading, setCatLoading] = useState(false)
  const [dogLoading, setDogLoading] = useState(false)
  const [jokeLoading, setJokeLoading] = useState(false)
  const [poemLoading, setPoemLoading] = useState(false)

  // Each toy gets its outcome before the spin starts, so it can choreograph itself to arrive there.
  const [jokeSpinning, setJokeSpinning] = useState(false)
  const [jokeCategory, setJokeCategory] = useState<string | null>(null)
  const [catSpinning, setCatSpinning] = useState(false)
  const [catTarget, setCatTarget] = useState<number | null>(null)
  const [dogSpinning, setDogSpinning] = useState(false)
  const [dogTarget, setDogTarget] = useState<number | null>(null)
  const [poemSpinning, setPoemSpinning] = useState(false)
  const [poemSeed, setPoemSeed] = useState<number | null>(null)

  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSwapRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTransitions = useCallback(() => {
    if (transitionRef.current) {
      clearTimeout(transitionRef.current)
      transitionRef.current = null
    }
    if (autoSwapRef.current) {
      clearTimeout(autoSwapRef.current)
      autoSwapRef.current = null
    }
  }, [])

  const stopAuto = useCallback(() => {
    clearTransitions()
    setAutoPlay(false)
    setVisible(true)
  }, [clearTransitions])

  const goToStep = useCallback(
    (i: number) => {
      clearTransitions()
      setVisible(false)
      transitionRef.current = setTimeout(() => {
        setActive(i)
        setVisible(true)
        transitionRef.current = null
      }, 180)
    },
    [clearTransitions],
  )

  const fetchCat = useCallback(async () => {
    setCatLoading(true)
    try {
      const res = await fetch("https://catfact.ninja/fact", { cache: "no-store" })
      if (!res.ok) throw new Error("cat failed")
      const data = await res.json()
      setCatFact(data.fact ?? "")
    } catch {
      setCatFact("Could not fetch a cat fact. Try again.")
    } finally {
      setCatLoading(false)
    }
  }, [])

  const fetchDog = useCallback(async () => {
    setDogLoading(true)
    try {
      const res = await fetch("/api/dog-facts", { cache: "no-store" })
      if (!res.ok) throw new Error("dog failed")
      const data = await res.json()
      if (data?.error) throw new Error(data.error)
      const fact = Array.isArray(data) ? data[0]?.fact : data?.fact
      setDogFact(fact || "No dog fact found.")
    } catch {
      setDogFact("Could not fetch a dog fact. Try again.")
    } finally {
      setDogLoading(false)
    }
  }, [])

  const fetchJoke = useCallback(async (category = "Any") => {
    setJokeLoading(true)
    try {
      const res = await fetch(`/api/jokes?category=${encodeURIComponent(category)}`, {
        cache: "no-store",
      })
      const json: JokeResponse = await res.json()
      if (!res.ok || !isJoke(json)) throw new Error("joke failed")
      setJoke(json)
    } catch {
      setJoke(null)
    } finally {
      setJokeLoading(false)
    }
  }, [])

  const fetchPoem = useCallback(async (next = false) => {
    setPoemLoading(true)
    try {
      const action = next ? "next" : "today"
      const res = await fetch(`/api/poetry?action=${action}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok || !data.poem) throw new Error("poem failed")
      setPoem(data.poem as PoetryPoem)
    } catch {
      setPoem(null)
    } finally {
      setPoemLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCat()
    void fetchDog()
    void fetchJoke()
    void fetchPoem()
  }, [fetchCat, fetchDog, fetchJoke, fetchPoem])

  function selectStep(i: number) {
    clearTransitions()
    setAutoPlay(false)
    if (i === active) {
      setVisible(true)
      return
    }
    goToStep(i)
  }

  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setVisible(false)
      autoSwapRef.current = setTimeout(() => {
        setActive((prev) => (prev + 1) % STEPS.length)
        setVisible(true)
        autoSwapRef.current = null
      }, 180)
    }, 4200)
    return () => {
      clearInterval(interval)
      if (autoSwapRef.current) {
        clearTimeout(autoSwapRef.current)
        autoSwapRef.current = null
      }
    }
  }, [autoPlay])

  useEffect(() => {
    return () => clearTransitions()
  }, [clearTransitions])

  const launch = <T,>(
    spinning: boolean,
    setSpinning: (v: boolean) => void,
    setTarget: (v: T) => void,
    target: T,
    onDone: () => void | Promise<void>,
  ) => {
    if (spinning) return
    stopAuto()
    setTarget(target)
    setSpinning(true)
    setTimeout(async () => {
      setSpinning(false)
      await onDone()
    }, SPIN_MS)
  }

  const spinCat = () =>
    launch(catSpinning, setCatSpinning, setCatTarget, Math.floor(Math.random() * CAT_EYE_COUNT), fetchCat)

  const spinDog = () =>
    launch(dogSpinning, setDogSpinning, setDogTarget, Math.floor(Math.random() * DOG_BALL_COUNT), fetchDog)

  const spinPoem = () =>
    launch(poemSpinning, setPoemSpinning, setPoemSeed, Math.floor(Math.random() * 2 ** 31), () =>
      fetchPoem(true),
    )

  const spinForJoke = () => {
    const category = DIE_CATEGORIES[Math.floor(Math.random() * DIE_CATEGORIES.length)]
    launch(jokeSpinning, setJokeSpinning, setJokeCategory, category, () => fetchJoke(category))
  }

  const step = STEPS[active]
  const spinningNow =
    (active === 0 && catSpinning) ||
    (active === 1 && dogSpinning) ||
    (active === 2 && jokeSpinning) ||
    (active === 3 && poemSpinning)

  const textBusy =
    (active === 2 && (jokeSpinning || jokeLoading)) || (active === 3 && (poemSpinning || poemLoading))

  const contentLoading =
    (active === 0 && catLoading && !catFact) ||
    (active === 1 && dogLoading && !dogFact) ||
    (active === 2 && jokeLoading && !joke) ||
    (active === 3 && poemLoading && !poem)

  return (
    <section id="devex" className="py-32 px-6 md:px-12 lg:px-20 border-t border-border">
      <style>{GLOW_CSS}</style>
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] tracking-widest text-muted-foreground uppercase">
            Diversions
          </div>
          <h2 className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05] text-foreground">
            Facts, jokes &amp; verse.<br />
            <span className="text-muted-foreground">Take a breath.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          <div className={cn("flex flex-col gap-3", PANEL_H)} role="tablist" aria-label="Diversions">
            {STEPS.map((s, i) => {
              const selected = active === i
              const c = ACCENTS[i]
              return (
                <button
                  key={s.num}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectStep(i)}
                  style={
                    selected
                      ? {
                          borderColor: `rgba(${c.rgb},.45)`,
                          background: `linear-gradient(100deg, rgba(${c.rgb},.14), transparent 70%)`,
                          boxShadow: `0 10px 30px -14px rgba(${c.rgb},.55)`,
                        }
                      : undefined
                  }
                  className={cn(
                    "group/tab relative flex-1 min-h-0 overflow-hidden rounded-2xl border p-4 text-left cursor-pointer",
                    "transition-all duration-300 ease-out active:scale-[0.985]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50",
                    selected
                      ? "bg-muted"
                      : "bg-card/70 border-border hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted/50",
                  )}
                >
                  <div className="flex h-full items-center gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all duration-300",
                        selected ? "scale-105 text-white shadow-sm" : "bg-muted text-muted-foreground group-hover/tab:text-foreground",
                      )}
                      style={selected ? { background: `linear-gradient(135deg, ${c.a}, ${c.b})` } : undefined}
                      aria-hidden
                    >
                      {(() => {
                        const Icon = TAB_ICONS[i]
                        return <Icon className="size-5" strokeWidth={1.75} />
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm transition-colors duration-200",
                          selected ? "font-normal text-foreground" : "font-light text-foreground/75",
                        )}
                      >
                        {s.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] tracking-widest text-muted-foreground/60">
                      {s.num}
                    </span>
                    <ArrowRight
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0 transition-all duration-300",
                        selected
                          ? "translate-x-0 text-foreground/70 opacity-100"
                          : "-translate-x-1 opacity-0 group-hover/tab:translate-x-0 group-hover/tab:opacity-60",
                      )}
                    />
                  </div>

                  {/* Shows how long until the auto-tour moves on; gone once the visitor takes over. */}
                  {selected && autoPlay && (
                    <span
                      key={`bar-${active}`}
                      aria-hidden
                      className="devex-progress absolute inset-x-0 bottom-0 h-[2px] origin-left"
                      style={{ background: `linear-gradient(90deg, ${c.a}, ${c.b})` }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div
            onPointerMove={e => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`)
              e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`)
            }}
            className={cn(
              "group/glow relative isolate lg:col-span-2 rounded-2xl border border-border bg-card p-6 md:p-8 flex flex-col overflow-hidden",
              // Taller on phones: the toy and the text sit side by side in a narrow column there.
              "h-[440px] lg:h-[360px]",
            )}
          >
            {/* Light that lives inside the border: a coloured gradient, covered by a blurred plate in the
                card colour, so only a soft band along the edges shines through. It breathes slowly, reaches
                deeper on hover, and each toy has its own colours that fade into one another. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-55 dark:opacity-85">
              {ACCENTS.map((c, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: active === i ? 1 : 0 }}
                >
                  <div
                    className="devex-glow-layer absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${c.a}, ${c.b} 50%, ${c.c})`,
                      backgroundSize: "200% 200%",
                      animation: "devex-breathe 6s ease-in-out infinite, devex-drift 18s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/glow:opacity-100"
                    style={{
                      background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(${c.rgb},.22), transparent 70%)`,
                    }}
                  />
                </div>
              ))}
              <div className="absolute inset-[18px] rounded-[1.25rem] bg-card blur-[20px] transition-[inset] duration-700 ease-out group-hover/glow:inset-[30px]" />
            </div>

            <div className="flex items-center justify-between mb-4 shrink-0">
              <div
                className="text-[10px] tracking-widest uppercase text-muted-foreground transition-all duration-200"
                style={{
                  opacity: visible ? 1 : 0,
                  filter: visible ? "blur(0px)" : "blur(4px)",
                  transition: "opacity 200ms ease, filter 200ms ease",
                }}
              >
                {step.title}
                <span className="opacity-40"> · </span>
                {step.label}
              </div>
              <div className="flex gap-1.5">
                {STEPS.map((_, d) => (
                  <button
                    key={d}
                    type="button"
                    aria-label={`Go to step ${d + 1}`}
                    onClick={() => selectStep(d)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer",
                      d === active ? "bg-foreground/50" : "bg-muted-foreground/25",
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 rounded-xl border border-border/70 bg-background/55 p-5 flex flex-col overflow-hidden backdrop-blur-[2px]">
              <div
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
                style={{
                  opacity: visible ? 1 : 0,
                  filter: visible ? "blur(0px)" : "blur(6px)",
                  transform: visible ? "translateY(0)" : "translateY(6px)",
                  transition:
                    "opacity 220ms cubic-bezier(0.16,1,0.3,1), filter 220ms cubic-bezier(0.16,1,0.3,1), transform 220ms cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                <div className="flex flex-row gap-4 items-center flex-1 min-h-0 overflow-hidden">
                  {active === 0 && (
                    <CatEyeSpinner
                      label={step.spinLabel}
                      spinning={catSpinning}
                      target={catTarget}
                      onSpin={spinCat}
                    />
                  )}
                  {active === 1 && (
                    <DogBallSpinner
                      label={step.spinLabel}
                      spinning={dogSpinning}
                      target={dogTarget}
                      onSpin={spinDog}
                    />
                  )}
                  {active === 2 && (
                    <JokeDieSpinner
                      label={step.spinLabel}
                      spinning={jokeSpinning}
                      category={jokeCategory}
                      onSpin={spinForJoke}
                    />
                  )}
                  {active === 3 && (
                    <PoemInkSpinner
                      label={step.spinLabel}
                      spinning={poemSpinning}
                      target={poemSeed}
                      onSpin={spinPoem}
                    />
                  )}

                  <div className="flex-1 min-w-0 min-h-0 overflow-y-auto self-stretch flex flex-col py-0.5">
                    {/* Jokes and poems are long: while one is being rolled or fetched, nothing of the old text
                        may stay on screen, so it cannot collide with the new one. Only a placeholder shows. */}
                    <AnimatePresence mode="wait" initial={false}>
                      {textBusy ? (
                        <motion.div
                          key="busy"
                          aria-hidden
                          className="my-auto flex flex-col gap-2.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {(active === 3 ? [92, 78, 86, 54, 70] : [96, 64, 30]).map((w, i) => (
                            <span
                              key={i}
                              className="h-2.5 animate-pulse rounded-full bg-foreground/10 motion-reduce:animate-none"
                              style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
                            />
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`text-${active}`}
                          className="my-auto"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          {contentLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : active === 2 ? (
                      <p className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-line font-light">
                        {jokeText(joke) || "Roll the die for a joke."}
                      </p>
                    ) : active === 3 ? (
                      poem ? (
                        <>
                          <p className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground mb-2 shrink-0">
                            {poem.title}
                            <span className="opacity-50"> · </span>
                            {poem.author}
                          </p>
                          <div className="space-y-1">
                            {poem.lines.slice(0, 8).map((line, i) => (
                              <p
                                key={i}
                                className="text-[13px] leading-relaxed text-foreground/80 font-light italic"
                              >
                                {line || "\u00A0"}
                              </p>
                            ))}
                            {poem.lines.length > 8 && (
                              <p className="text-[11px] text-muted-foreground pt-1">…</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Drop the ink for a poem.</p>
                      )
                    ) : (
                      <p className="text-[14px] md:text-[16px] leading-relaxed text-foreground/85 font-light">
                        {active === 0 ? catFact : dogFact}
                      </p>
                    )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (active === 0) spinCat()
                      else if (active === 1) spinDog()
                      else if (active === 2) spinForJoke()
                      else spinPoem()
                    }}
                    disabled={spinningNow}
                    style={{
                      borderColor: `rgba(${ACCENTS[active].rgb},.4)`,
                      background: `linear-gradient(90deg, rgba(${ACCENTS[active].rgb},.2), rgba(${ACCENTS[active].rgb},.06))`,
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[11px] tracking-wide hover:brightness-110 active:scale-[0.97] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Dices className={`size-3.5 ${spinningNow ? "animate-spin" : ""}`} />
                    {spinningNow ? step.busyLabel : step.spinLabel}
                  </button>

                  <Link
                    href={step.moreHref}
                    onClick={stopAuto}
                    className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors tracking-wide"
                  >
                    {step.moreLabel}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
