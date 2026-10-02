'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  Volume2,
  X,
  ImageIcon,
} from 'lucide-react'
import type { DictionaryEntry } from '@/types/dictionary'
import { cn } from '@/lib/utils'
import { PronunciationStudioSuggest } from '@/components/pronunciation-studio-suggest'

const QUICK_WORDS = [
  'serendipity',
  'ephemeral',
  'eloquent',
  'resilience',
  'curious',
  'luminous',
]

interface Suggestion {
  word: string
  score: number
}

function labelFromAudio(url: string): string {
  const l = url.toLowerCase()
  if (l.includes('-uk.') || l.includes('_uk.')) return 'UK'
  if (l.includes('-us.') || l.includes('_us.')) return 'US'
  if (l.includes('-au.') || l.includes('_au.')) return 'AU'
  if (l.includes('-ca.')) return 'CA'
  return 'Recording'
}

/**
 * Plays a recording, and when there is none, or it will not load or play, speaks the word with the
 * browser's own voice instead, so the Hear button always does something.
 */
function useVoice() {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [canSpeak, setCanSpeak] = useState(false)

  useEffect(() => {
    setCanSpeak(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  const stop = useCallback(() => {
    ref.current?.pause()
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setPlaying(null)
  }, [])

  const speak = useCallback(
    (id: string, text: string, lang = 'en-US') => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setNote('This browser cannot read words aloud.')
        return
      }
      stop()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      u.rate = 0.9
      const voices = window.speechSynthesis.getVoices()
      const voice = voices.find(v => v.lang === lang) ?? voices.find(v => v.lang.startsWith(lang.slice(0, 2)))
      if (voice) u.voice = voice
      u.onend = () => setPlaying(null)
      u.onerror = () => setPlaying(null)
      setPlaying(id)
      window.speechSynthesis.speak(u)
    },
    [stop],
  )

  const play = useCallback(
    async (id: string, url: string, word: string, lang = 'en-US') => {
      setNote(null)
      stop()
      let failed = false
      const fallback = () => {
        if (failed) return
        failed = true
        setNote("That recording wouldn't play, so a computer voice was used.")
        speak(id, word, lang)
      }
      try {
        const audio = new Audio(url)
        ref.current = audio
        audio.preload = 'auto'
        audio.onended = () => setPlaying(null)
        audio.onerror = fallback
        setPlaying(id)
        await audio.play()
      } catch {
        fallback()
      }
    },
    [speak, stop],
  )

  return { playing, note, canSpeak, play, speak, setNote }
}

function WordPhoto({ word }: { word: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!word.trim()) return
    const ctrl = new AbortController()
    fetch(`/api/photos?word=${encodeURIComponent(word)}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setSrc(d.image ?? null))
      .catch(() => setSrc(null))
    return () => ctrl.abort()
  }, [word])

  if (!src) return null

  return (
    <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[180px] overflow-hidden rounded-2xl border border-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-foreground/70">
        <ImageIcon className="size-3" />
        {word}
      </span>
    </div>
  )
}

export function ClassicDictionary() {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<DictionaryEntry[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [booted, setBooted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { playing, note, canSpeak, play, speak, setNote } = useVoice()
  const [didYouMean, setDidYouMean] = useState<string[]>([])
  const reqId = useRef(0)
  const suggestSeq = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = useCallback(async (word: string) => {
    const w = word.trim()
    if (!w) return
    const id = ++reqId.current // a newer lookup makes an older, slower one irrelevant
    // Autocomplete still waiting or in flight for what was just typed must not reopen the list.
    suggestSeq.current++
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    setLoading(true)
    setError(null)
    setDidYouMean([])
    setNote(null)
    setShowSuggestions(false)
    setSuggestions([]) // otherwise the old list pops back open when the box regains focus
    setBooted(true)
    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(w)}`, { cache: 'no-store' })
      const json = await res.json()
      if (id !== reqId.current) return
      if (!res.ok) {
        const err = new Error(json.error ?? 'Word not found') as Error & { suggestions?: string[] }
        err.suggestions = json.suggestions ?? []
        throw err
      }
      setData(json as DictionaryEntry[])
      setQuery((json as DictionaryEntry[])[0]?.word ?? w)
    } catch (err) {
      if (id !== reqId.current) return
      setData(null)
      setError(err instanceof Error ? err.message : 'Lookup failed')
      setDidYouMean((err as { suggestions?: string[] }).suggestions ?? [])
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }, [setNote])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const onInputChange = (val: string) => {
    setQuery(val)
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (!val.trim() || val.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    const seq = ++suggestSeq.current
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dictionary?endpoint=suggest&q=${encodeURIComponent(val)}`)
        const json = await res.json()
        if (seq !== suggestSeq.current) return // a lookup or newer keystroke replaced this one
        setSuggestions(json.suggestions ?? [])
        setShowSuggestions((json.suggestions ?? []).length > 0)
      } catch {
        // Autocomplete is a nicety: if it fails, the search box simply keeps working.
        setSuggestions([])
      }
    }, 200)
  }

  const entry = data?.[0]
  const phoneticText = entry?.phonetic ?? entry?.phonetics?.find(p => p.text)?.text ?? ''
  const pronunciations = useMemo(() => {
    if (!entry) return []
    const seen = new Set<string>()
    const out: { label: string; ipa?: string; audio: string }[] = []
    for (const p of entry.phonetics) {
      if (!p.audio) continue
      const label = p.label ?? labelFromAudio(p.audio)
      const key = `${label}-${p.audio}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ label, ipa: p.text, audio: p.audio.split('?')[0] })
    }
    return out
  }, [entry])

  const allMeanings = entry?.meanings ?? []
  const allDefs = allMeanings.flatMap(m =>
    m.definitions.map(d => ({ ...d, partOfSpeech: m.partOfSpeech })),
  )
  const synonyms = useMemo(() => {
    const set = new Set<string>()
    allMeanings.forEach(m => {
      m.synonyms.forEach(s => set.add(s))
      m.definitions.forEach(d => d.synonyms.forEach(s => set.add(s)))
    })
    return [...set].slice(0, 16)
  }, [allMeanings])

  const antonyms = useMemo(() => {
    const set = new Set<string>()
    allMeanings.forEach(m => {
      m.antonyms.forEach(a => set.add(a))
      m.definitions.forEach(d => d.antonyms.forEach(a => set.add(a)))
    })
    return [...set].slice(0, 10)
  }, [allMeanings])

  const copyWord = async () => {
    if (!entry) return
    await navigator.clipboard.writeText(entry.word)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-6">
      {/* Search — the whole point */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        ref={wrapperRef}
        className={cn(!booted && 'min-h-[52vh] flex flex-col justify-center')}
      >
        {!booted ? (
          <div className="mb-10 text-center">
            <p
              className="text-[clamp(4rem,18vw,8rem)] leading-none text-foreground/[0.06] dark:text-foreground/[0.08] select-none"
              style={{ fontFamily: 'var(--font-dict-display), Georgia, serif' }}
              aria-hidden
            >
              Aa
            </p>
            <h1 className="sr-only">Dictionary</h1>
            <p className="mt-2 text-sm text-muted-foreground">Type a word. Press enter.</p>
          </div>
        ) : null}

        <form
          onSubmit={e => {
            e.preventDefault()
            lookup(query)
          }}
          className="relative"
        >
          <div className="group relative flex items-center gap-3 border-b-2 border-foreground/15 focus-within:border-foreground transition-colors duration-300 pb-3">
            <Search className="size-5 text-muted-foreground shrink-0 group-focus-within:text-foreground transition-colors" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => onInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search a word"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-2xl md:text-3xl font-light tracking-tight text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
              style={{ fontFamily: 'var(--font-dict-display), Georgia, serif' }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSuggestions([])
                  setShowSuggestions(false)
                  inputRef.current?.focus()
                }}
                className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Clear"
              >
                <X className="size-4" />
              </button>
            ) : null}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="shrink-0 size-10 md:size-11 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-30 hover:opacity-90 transition-opacity"
              aria-label="Look up"
            >
              {loading ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 ? (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] max-h-64 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg p-1.5"
              >
                {suggestions.map(s => (
                  <li key={s.word}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setQuery(s.word)
                        lookup(s.word)
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                      {s.word}
                    </button>
                  </li>
                ))}
              </motion.ul>
            ) : null}
          </AnimatePresence>
        </form>

        {!booted || (!entry && !error) ? (
          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {QUICK_WORDS.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => lookup(w)}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                {w}
              </button>
            ))}
          </div>
        ) : null}
      </motion.div>

      {error ? (
        <div className="mt-10 text-center">
          <p className="text-base text-foreground">{error}</p>
          {didYouMean.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Did you mean</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {didYouMean.map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setQuery(w)
                      void lookup(w)
                    }}
                    className="rounded-full border border-border bg-card px-4 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Check the spelling, or try a simpler form of the word.</p>
          )}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {entry && !error ? (
          <motion.article
            key={entry.word}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={cn('mt-14 space-y-12', loading && 'opacity-50 pointer-events-none')}
          >
            {/* Word headword */}
            <header className="grid md:grid-cols-[1fr_200px] gap-8 items-start">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h2
                    className="text-[clamp(2.75rem,10vw,5rem)] leading-[0.95] tracking-tight text-foreground capitalize"
                    style={{ fontFamily: 'var(--font-dict-display), Georgia, serif' }}
                  >
                    {entry.word}
                  </h2>
                  <button
                    type="button"
                    onClick={copyWord}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {phoneticText ? (
                  <p className="mt-3 font-mono text-base md:text-lg text-muted-foreground tracking-wide">
                    {phoneticText}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {pronunciations.map(p => {
                    const id = `pron-${p.label}`
                    const active = playing === id
                    const lang = p.label === 'UK' ? 'en-GB' : p.label === 'AU' ? 'en-AU' : 'en-US'
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => (active ? undefined : void play(id, p.audio, entry.word, lang))}
                        aria-label={`Hear ${entry.word}, ${p.label} recording`}
                        className={cn(
                          'inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border text-sm transition-colors',
                          active
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-card hover:bg-muted text-foreground',
                        )}
                      >
                        <Volume2 className={cn('size-3.5', active && 'animate-pulse')} />
                        <span className="text-[10px] uppercase tracking-[0.15em]">{p.label}</span>
                      </button>
                    )
                  })}
                  {canSpeak ? (
                    <button
                      type="button"
                      onClick={() => speak('speak', entry.word, 'en-US')}
                      aria-label={`Hear ${entry.word} read by a computer voice`}
                      className={cn(
                        'inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border text-sm transition-colors',
                        playing === 'speak'
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-dashed border-border hover:bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Volume2 className={cn('size-3.5', playing === 'speak' && 'animate-pulse')} />
                      <span className="text-[10px] uppercase tracking-[0.15em]">
                        {pronunciations.length ? 'Computer voice' : 'Hear it'}
                      </span>
                    </button>
                  ) : null}
                </div>
                {pronunciations.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No recording exists for this word yet{canSpeak ? ', but a computer voice can say it.' : '.'}
                  </p>
                ) : null}
                {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
              </div>

              <WordPhoto word={entry.word} />
            </header>

            {synonyms.length > 0 ? (
              <section>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                  Related
                </p>
                <p className="text-base leading-relaxed text-foreground/80">
                  {synonyms.map((s, i) => (
                    <span key={s}>
                      <button
                        type="button"
                        onClick={() => lookup(s)}
                        className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                      >
                        {s}
                      </button>
                      {i < synonyms.length - 1 ? (
                        <span className="text-muted-foreground/40 mx-1.5">·</span>
                      ) : null}
                    </span>
                  ))}
                </p>
              </section>
            ) : null}

            {antonyms.length > 0 ? (
              <section>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Opposites</p>
                <p className="text-base leading-relaxed text-foreground/80">
                  {antonyms.map((a, i) => (
                    <span key={a}>
                      <button
                        type="button"
                        onClick={() => lookup(a)}
                        className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                      >
                        {a}
                      </button>
                      {i < antonyms.length - 1 ? <span className="text-muted-foreground/40 mx-1.5">·</span> : null}
                    </span>
                  ))}
                </p>
              </section>
            ) : null}

            {/* Definitions — clean numbered list */}
            <section>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-6">
                Meanings
              </p>
              <ol className="space-y-0 divide-y divide-border">
                {allDefs.map((def, i) => (
                  <li key={i} className="py-6 first:pt-0 grid grid-cols-[2.5rem_1fr] gap-2">
                    <span
                      className="text-2xl text-muted-foreground/40 leading-none pt-0.5 tabular-nums"
                      style={{ fontFamily: 'var(--font-dict-display), Georgia, serif' }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {def.partOfSpeech}
                      </span>
                      <p className="mt-1.5 text-[1.05rem] leading-relaxed text-foreground">
                        {def.definition}
                      </p>
                      {def.example ? (
                        <p
                          className="mt-3 text-[0.95rem] italic text-muted-foreground leading-relaxed"
                          style={{ fontFamily: 'var(--font-dict-display), Georgia, serif' }}
                        >
                          “{def.example}”
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {entry.sourceUrls?.[0] ? (
              <footer className="pt-2 border-t border-border">
                <a
                  href={entry.sourceUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Source →
                </a>
              </footer>
            ) : null}
          </motion.article>
        ) : null}
      </AnimatePresence>

      <PronunciationStudioSuggest word={entry?.word ?? (query.trim() || undefined)} />
    </div>
  )
}
