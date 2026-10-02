'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Check, Maximize2, Minimize2, Minus, Plus, Share2, Volume2, X } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { GlowFrame } from '@/components/glow-frame'
import { formatDuration, toStanzas } from '@/lib/lyrics'
import { cn } from '@/lib/utils'
import type { LyricsResult, LyricsSearch } from '@/types/lyrics'

const display = { fontFamily: 'var(--font-ly-display), Georgia, serif' } as const
const mono = { fontFamily: 'var(--font-ly-mono), ui-monospace, monospace' } as const

export type SongTheme = { a: string; b: string; hue: number }

/** A colour family derived from the song, used for the glow and the accents. */
export function themeOf(artist: string, title: string): SongTheme {
  let h = 0
  for (const c of `${artist}${title}`) h = (h * 31 + c.charCodeAt(0)) % 360
  return { hue: h, a: `hsl(${h} 90% 72%)`, b: `hsl(${h} 78% 50%)` }
}

const SCALES = [0.85, 1, 1.2, 1.45]

type Entry = { word: string; phonetic?: string; audio?: string; meanings: { pos: string; def: string }[] }

type DictResponse = {
  word?: string
  phonetic?: string
  phonetics?: { text?: string; audio?: string }[]
  meanings?: { partOfSpeech?: string; definitions?: { definition?: string }[] }[]
}[]

const POS: Record<string, string> = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: '' }

async function fromDictionary(word: string): Promise<Entry | null> {
  try {
    const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const json = (await res.json()) as DictResponse
    const e = json?.[0]
    if (!e) return null
    return {
      word: e.word ?? word,
      phonetic: e.phonetic || e.phonetics?.find(p => p.text)?.text,
      audio: e.phonetics?.find(p => p.audio)?.audio,
      meanings: (e.meanings ?? [])
        .slice(0, 3)
        .flatMap(m => (m.definitions?.[0]?.definition ? [{ pos: m.partOfSpeech ?? '', def: m.definitions[0].definition }] : [])),
    }
  } catch {
    return null
  }
}

/** Backup source: the main dictionary service is sometimes slow or down. */
async function fromDatamuse(word: string): Promise<Entry | null> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const [hit] = (await res.json()) as { word?: string; defs?: string[] }[]
    if (!hit?.defs?.length) return null
    return {
      word: hit.word ?? word,
      meanings: hit.defs.slice(0, 3).map(d => {
        const [pos, ...rest] = d.split('\t')
        return { pos: POS[pos] ?? pos, def: rest.join(' ').trim() }
      }),
    }
  } catch {
    return null
  }
}

async function lookup(word: string): Promise<Entry | null> {
  // Ask both at once; the main dictionary has phonetics and audio, so give it a short head start.
  const backup = fromDatamuse(word)
  const main = await Promise.race([
    fromDictionary(word),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 1800)),
  ])
  return main ?? (await backup)
}

const EQ_CSS = `
  @keyframes ly-eq { 0%,100% { transform: scaleY(.25) } 50% { transform: scaleY(1) } }
  @media (prefers-reduced-motion: reduce) { .ly-eq-bar { animation: none !important; transform: scaleY(.6) } }
`

function Finding({ theme }: { theme: SongTheme }) {
  return (
    <div role="status" className="flex min-h-[320px] flex-col items-center justify-center gap-6">
      <style>{EQ_CSS}</style>
      <div className="flex h-14 items-end gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
          <span
            key={i}
            className="ly-eq-bar block h-full w-1.5 origin-bottom rounded-full"
            style={{
              background: `linear-gradient(to top, ${theme.b}, ${theme.a})`,
              animation: `ly-eq ${0.9 + (i % 3) * 0.25}s ease-in-out ${i * 0.11}s infinite`,
            }}
          />
        ))}
      </div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--ly-mute)]" style={mono}>
        Finding the words…
      </p>
    </div>
  )
}

export function LyricsReader({
  song,
  result,
  loading,
  error,
  theme,
}: {
  song: LyricsSearch | null
  result: LyricsResult | null
  loading: boolean
  error: string | null
  theme: SongTheme
}) {
  const [scale, setScale] = useState(1)
  const [study, setStudy] = useState(false)
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [shared, setShared] = useState(false)
  const [entry, setEntry] = useState<Entry | 'loading' | 'none' | null>(null)
  const [picked, setPicked] = useState('')
  const cache = useRef(new Map<string, Entry | 'none'>())
  const shellRef = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem('lyrics-scale'))
      if (SCALES.includes(saved)) setScale(saved)
    } catch {}
  }, [])
  const changeScale = (dir: 1 | -1) => {
    const i = SCALES.indexOf(scale)
    const next = SCALES[Math.min(SCALES.length - 1, Math.max(0, i + dir))]
    setScale(next)
    try {
      localStorage.setItem('lyrics-scale', String(next))
    } catch {}
  }

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await shellRef.current?.requestFullscreen()
    } catch {}
  }

  // A new song resets what was selected.
  const songKey = result ? `${result.artist}|${result.title}` : ''
  useEffect(() => {
    setEntry(null)
    setPicked('')
    setActiveLine(null)
  }, [songKey])

  const pickWord = useCallback(async (raw: string) => {
    const word = raw.toLowerCase().replace(/^['’]+|['’]+$/g, '')
    if (!word) return
    setPicked(word)
    const hit = cache.current.get(word)
    if (hit) {
      setEntry(hit)
      return
    }
    setEntry('loading')
    const found = await lookup(word)
    cache.current.set(word, found ?? 'none')
    setEntry(found ?? 'none')
  }, [])

  const share = async () => {
    if (!result) return
    const text = `${result.title} — ${result.artist}\n\n${result.lyrics.slice(0, 500)}${result.lyrics.length > 500 ? '…' : ''}`
    try {
      if (navigator.share) await navigator.share({ title: `${result.title} — ${result.artist}`, text })
      else await navigator.clipboard.writeText(text)
      setShared(true)
      setTimeout(() => setShared(false), 1800)
    } catch {}
  }

  const stanzas = result ? toStanzas(result.lines) : []
  const ghost =
    'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--ly-line)] px-4 text-[12px] tracking-wide transition-all hover:-translate-y-0.5 hover:bg-black/[0.04] active:scale-[0.97] disabled:opacity-40 dark:hover:bg-white/[0.06]'

  return (
    <section
      ref={shellRef}
      aria-label="Lyrics"
      onPointerMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
        e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
      }}
      className={cn(
        'relative isolate overflow-hidden rounded-[2rem] border border-[var(--ly-line)] bg-[var(--ly-card)]',
        fullscreen && 'overflow-y-auto rounded-none',
      )}
    >
      <GlowFrame a={theme.a} b={theme.b} plate="bg-[var(--ly-card)]" radius="1.7rem" />

      <div className="p-6 sm:p-10 lg:p-12">
        {/* Song header */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <div
              className="relative size-24 shrink-0 overflow-hidden rounded-2xl shadow-xl sm:size-28"
              style={{ background: `linear-gradient(145deg, ${theme.b}, hsl(${theme.hue} 60% 20%))` }}
            >
              {song?.coverBig || song?.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={song.coverBig || song.cover}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--ly-mute)]" style={mono}>
                {loading ? 'Looking up' : 'Now reading'}
                {song?.duration ? ` · ${formatDuration(song.duration)}` : ''}
              </p>
              <h2
                className="mt-1.5 text-[clamp(1.9rem,5vw,3.4rem)] leading-[1.02] tracking-tight"
                style={display}
              >
                {song?.title ?? '—'}
              </h2>
              <p className="mt-1.5 text-[1.15rem] italic" style={{ ...display, color: theme.b }}>
                {song?.artist ?? ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2" style={mono}>
            <div className="inline-flex items-center rounded-full border border-[var(--ly-line)]" role="group" aria-label="Text size">
              <button
                type="button"
                onClick={() => changeScale(-1)}
                disabled={scale === SCALES[0]}
                aria-label="Smaller text"
                className="grid size-10 place-items-center rounded-l-full transition-colors hover:bg-black/[0.05] disabled:opacity-30 dark:hover:bg-white/[0.08]"
              >
                <Minus className="size-4" />
              </button>
              <span className="px-1 text-[11px] tabular-nums text-[var(--ly-mute)]">Aa</span>
              <button
                type="button"
                onClick={() => changeScale(1)}
                disabled={scale === SCALES[SCALES.length - 1]}
                aria-label="Bigger text"
                className="grid size-10 place-items-center rounded-r-full transition-colors hover:bg-black/[0.05] disabled:opacity-30 dark:hover:bg-white/[0.08]"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStudy(s => !s)}
              aria-pressed={study}
              disabled={!result}
              className={cn(ghost, study && 'border-transparent text-white')}
              style={study ? { background: `linear-gradient(135deg, ${theme.b}, ${theme.a})` } : undefined}
            >
              <BookOpen className="size-4" />
              Word help
            </button>
            <CopyButton
              text={result ? `${result.title} — ${result.artist}\n\n${result.lyrics}` : ''}
              disabled={!result}
              lineVar="var(--ly-line)"
              className="!h-10 !w-auto px-4 text-[12px]"
            />
            <button type="button" onClick={() => void share()} disabled={!result} className={ghost} aria-label="Share">
              {shared ? <Check className="size-4" /> : <Share2 className="size-4" />}
              <span className="hidden sm:inline">{shared ? 'Done' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className={ghost}
              aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
          </div>
        </header>

        <hr className="my-8 border-[var(--ly-line)]" />

        {/* Body */}
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <Finding theme={theme} />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto flex min-h-[260px] max-w-md flex-col items-center justify-center text-center"
            >
              <p className="text-[1.7rem] leading-tight" style={display}>
                We couldn&apos;t find those words.
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--ly-mute)]">
                {error} Try picking the song from the suggestions in the search box, or check the spelling of the artist.
              </p>
            </motion.div>
          ) : result ? (
            <motion.div key={songKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="gap-14 md:columns-2" style={{ fontSize: `${1.3 * scale}rem` }}>
                {stanzas.map((stanza, si) => (
                  <div key={si} className="mb-8 break-inside-avoid">
                    {stanza.map((line, li) => {
                      const id = `${si}-${li}`
                      const on = activeLine === id
                      return (
                        <motion.p
                          key={li}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: Math.min((si * 4 + li) * 0.025, 0.9) }}
                          onClick={() => !study && setActiveLine(on ? null : id)}
                          className={cn(
                            'rounded-md px-2 py-[3px] -mx-2 leading-[1.55] transition-colors duration-200',
                            !study && 'cursor-pointer hover:text-[var(--ly-fg)]',
                            on ? 'font-medium text-[var(--ly-fg)]' : 'text-[var(--ly-fg)]/70',
                          )}
                          style={{
                            ...display,
                            ...(on ? { background: `color-mix(in srgb, ${theme.b} 12%, transparent)`, boxShadow: `inset 3px 0 0 ${theme.b}` } : {}),
                          }}
                        >
                          {study
                            ? line.split(/(\s+)/).map((tok, ti) =>
                                /[A-Za-z]/.test(tok) ? (
                                  <button
                                    key={ti}
                                    type="button"
                                    onClick={() => void pickWord(tok.replace(/[^A-Za-z'’]/g, ''))}
                                    className="rounded-sm underline decoration-dotted decoration-[color-mix(in_srgb,currentColor_35%,transparent)] underline-offset-4 transition-colors hover:bg-[color-mix(in_srgb,var(--ly-fg)_10%,transparent)] focus-visible:outline-2"
                                  >
                                    {tok}
                                  </button>
                                ) : (
                                  <Fragment key={ti}>{tok}</Fragment>
                                ),
                              )
                            : line}
                        </motion.p>
                      )
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-[var(--ly-mute)]" style={mono}>
                {study ? 'Tap any word to see what it means.' : 'Tap a line to highlight it. Turn on Word help to look up words.'}
              </p>
            </motion.div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center text-[var(--ly-mute)]">Search for a song above.</div>
          )}
        </AnimatePresence>
      </div>

      {/* Word card */}
      {/* Pinned to the window (not the card, which clips its contents) so it is always in view. */}
      <AnimatePresence>
        {study && entry && (
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <motion.aside
            key="word"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[var(--ly-line)] bg-[var(--ly-card)]/95 p-5 shadow-2xl backdrop-blur-xl"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-2xl leading-none" style={display}>
                  {entry === 'loading' || entry === 'none' ? picked : entry.word}
                </p>
                {typeof entry === 'object' && entry.phonetic ? (
                  <p className="mt-1.5 text-[12px] text-[var(--ly-mute)]" style={mono}>
                    {entry.phonetic}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                {typeof entry === 'object' && entry.audio ? (
                  <button
                    type="button"
                    onClick={() => void new Audio(entry.audio).play().catch(() => {})}
                    aria-label="Hear it"
                    className="grid size-9 place-items-center rounded-full border border-[var(--ly-line)] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                  >
                    <Volume2 className="size-4" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEntry(null)}
                  aria-label="Close"
                  className="grid size-9 place-items-center rounded-full transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            {entry === 'loading' ? (
              <p className="mt-3 text-[13px] text-[var(--ly-mute)]">Looking it up…</p>
            ) : entry === 'none' ? (
              <p className="mt-3 text-[13px] text-[var(--ly-mute)]">No definition found for this word. Names and slang are often missing.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-[14px] leading-snug">
                {entry.meanings.map((m, i) => (
                  <li key={i}>
                    <span className="mr-2 text-[10px] uppercase tracking-[0.2em]" style={{ ...mono, color: theme.b }}>
                      {m.pos}
                    </span>
                    {m.def}
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
