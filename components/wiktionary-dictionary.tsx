'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Volume2,
  X,
  ChevronDown,
} from 'lucide-react'
import type { WiktionaryEntry, Pronunciation, WiktionaryTranslation } from '@/types/wiktionary'
import { PronunciationStudioSuggest } from '@/components/pronunciation-studio-suggest'
import { cn } from '@/lib/utils'

const QUICK_WORDS = ['hello', 'love', 'water', 'friend', 'peace', 'world']

const LANG_COUNTRY: Record<string, string> = {
  English: 'gb', German: 'de', French: 'fr', Spanish: 'es', Italian: 'it',
  Portuguese: 'pt', Russian: 'ru', Japanese: 'jp', Chinese: 'cn', Mandarin: 'cn',
  Arabic: 'sa', Persian: 'ir', Hindi: 'in', Korean: 'kr', Turkish: 'tr', Dutch: 'nl',
  Polish: 'pl', Swedish: 'se', Norwegian: 'no', Danish: 'dk', Finnish: 'fi',
  Greek: 'gr', Hebrew: 'il', Ukrainian: 'ua', Vietnamese: 'vn', Indonesian: 'id',
  Thai: 'th', Czech: 'cz', Romanian: 'ro', Hungarian: 'hu',
}

const CODE_OVERRIDES: Record<string, string> = {
  en: 'gb', ja: 'jp', zh: 'cn', fa: 'ir', ko: 'kr', ar: 'sa', hi: 'in',
  el: 'gr', he: 'il', uk: 'ua', vi: 'vn', id: 'id', cs: 'cz',
}

const PRON_FLAG: Record<string, string> = {
  UK: '🇬🇧', US: '🇺🇸', AU: '🇦🇺', CA: '🇨🇦', Audio: '🔊',
}

const serif = { fontFamily: 'var(--font-dictionary-display), Georgia, "Times New Roman", serif' }

function countryCode(language: string, code?: string): string | null {
  if (LANG_COUNTRY[language]) return LANG_COUNTRY[language]
  const base = language.split(/[\s(]/)[0]
  if (LANG_COUNTRY[base]) return LANG_COUNTRY[base]
  if (code) {
    const c = CODE_OVERRIDES[code] ?? code
    if (/^[a-z]{2}(-[a-z]{3,})?$/i.test(c)) return c.toLowerCase()
  }
  return null
}

function flagEmojiFromCc(cc: string): string {
  const upper = cc.toUpperCase().slice(0, 2)
  if (upper.length !== 2) return '🌐'
  return String.fromCodePoint(...[...upper].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)))
}

function langBadge(language: string, code?: string) {
  const cc = countryCode(language, code)
  return {
    flag: cc ? `https://flagcdn.com/w160/${cc}.png` : null,
    emoji: cc ? flagEmojiFromCc(cc) : '🌐',
    short: (code ?? cc ?? language.slice(0, 2)).toUpperCase().slice(0, 3),
  }
}

function useAudioPlayer() {
  const ref = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)

  const play = useCallback((id: string, url: string) => {
    if (!url) return
    try {
      ref.current?.pause()
      const audio = new Audio(url)
      ref.current = audio
      setPlaying(id)
      audio.onended = () => setPlaying(null)
      audio.onerror = () => setPlaying(null)
      void audio.play()
    } catch {
      setPlaying(null)
    }
  }, [])

  return { playing, play }
}

function PronunciationBar({
  pronunciations,
  phonetic,
  playing,
  onPlay,
}: {
  pronunciations: Pronunciation[]
  phonetic?: string
  playing: string | null
  onPlay: (id: string, url: string) => void
}) {
  if (!pronunciations.length && !phonetic) return null

  return (
    <div className="mt-5 space-y-3">
      {phonetic ? (
        <p className="font-mono text-base md:text-lg text-muted-foreground tracking-wide">{phonetic}</p>
      ) : null}
      {pronunciations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {pronunciations.map(p => {
            const id = `main-${p.label}`
            const active = playing === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => p.audio && onPlay(id, p.audio)}
                disabled={!p.audio}
                className={cn(
                  'inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border text-sm transition-colors disabled:opacity-35',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card hover:bg-muted text-foreground',
                )}
              >
                <span className="text-xs opacity-80">{PRON_FLAG[p.label] ?? '🔊'}</span>
                <span className="text-[10px] uppercase tracking-[0.15em]">{p.label}</span>
                {p.ipa ? <span className="font-mono text-xs opacity-70">{p.ipa}</span> : null}
                <Volume2 className="size-3.5 opacity-60" />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

/** Typographic translation rail — not a flag photo card */
function TranslationRail({
  t,
  index,
  playing,
  onPlay,
  active,
  onFocus,
}: {
  t: WiktionaryTranslation
  index: number
  playing: string | null
  onPlay: (id: string, url: string) => void
  active: boolean
  onFocus: () => void
}) {
  const badge = langBadge(t.language, t.code)
  const audioId = `trans-${t.language}`
  const hasAudio = !!t.audio

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.45 }}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      onClick={() => {
        onFocus()
        if (t.audio) onPlay(audioId, t.audio)
      }}
      className={cn(
        'group relative w-full text-left grid grid-cols-[4.5rem_1fr_auto] sm:grid-cols-[5.5rem_1fr_auto] items-center gap-3 sm:gap-5 py-4 sm:py-5 border-b border-border transition-colors',
        active ? 'bg-muted/40' : 'hover:bg-muted/25',
      )}
    >
      <div className="relative size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
        {badge.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.flag}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-2xl" aria-hidden>
            {badge.emoji}
          </span>
        )}
      </div>

      <div className="min-w-0 relative">
        <span
          className="pointer-events-none absolute -left-2 -top-6 text-5xl sm:text-6xl font-light text-foreground/[0.04] dark:text-foreground/[0.06] select-none leading-none"
          style={serif}
          aria-hidden
        >
          {badge.short}
        </span>
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-1">
          <span className="font-mono mr-2 opacity-70">{badge.short}</span>
          {t.language}
        </p>
        <p
          className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground tracking-tight leading-none truncate"
          style={serif}
        >
          {t.terms[0]}
        </p>
        <div
          className={cn(
            'mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground overflow-hidden transition-all duration-300',
            active ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0 sm:group-hover:max-h-16 sm:group-hover:opacity-100',
          )}
        >
          {t.ipa ? <span className="font-mono">{t.ipa}</span> : null}
          {t.terms.length > 1 ? (
            <span className="truncate">{t.terms.slice(1, 3).join(' · ')}</span>
          ) : null}
          {t.gloss ? <span className="italic line-clamp-1">{t.gloss}</span> : null}
        </div>
      </div>

      <div className="pr-1 sm:pr-2">
        {hasAudio ? (
          <span
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full border transition-colors',
              playing === audioId
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground group-hover:text-foreground',
            )}
          >
            {playing === audioId ? (
              <span className="flex gap-0.5 items-end h-3">
                {[1, 2, 3].map(i => (
                  <span
                    key={i}
                    className="w-0.5 bg-current rounded-full animate-pulse"
                    style={{ height: `${5 + i * 2}px`, animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </span>
            ) : (
              <Volume2 className="size-3.5" />
            )}
          </span>
        ) : (
          <span className="size-9" />
        )}
      </div>
    </motion.button>
  )
}

async function fetchEntry(word: string): Promise<WiktionaryEntry> {
  const res = await fetch(`/api/wiktionary?word=${encodeURIComponent(word)}`, { cache: 'no-store' })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Lookup failed')
  return json
}

async function fetchSuggestions(q: string): Promise<string[]> {
  const res = await fetch(`/api/wiktionary?endpoint=suggest&q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
  })
  const json = await res.json()
  return json.suggestions ?? []
}

export function WiktionaryDictionary() {
  const [query, setQuery] = useState('')
  const [entry, setEntry] = useState<WiktionaryEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [booted, setBooted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAllTranslations, setShowAllTranslations] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeLang, setActiveLang] = useState<string | null>(null)
  const { playing, play } = useAudioPlayer()
  const inputRef = useRef<HTMLInputElement>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lookup = useCallback(async (word: string) => {
    if (!word.trim()) return
    setLoading(true)
    setError(null)
    setShowSuggestions(false)
    setShowAllTranslations(false)
    setBooted(true)
    setActiveLang(null)
    try {
      const data = await fetchEntry(word.trim())
      setEntry(data)
      setQuery(data.word)
    } catch (err) {
      setEntry(null)
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }, [])

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
    suggestTimer.current = setTimeout(async () => {
      try {
        const items = await fetchSuggestions(val)
        setSuggestions(items)
        setShowSuggestions(items.length > 0)
      } catch {
        setSuggestions([])
      }
    }, 280)
  }

  const copySummary = async () => {
    if (!entry) return
    const lines = entry.translations
      .slice(0, 16)
      .map(t => `${t.language}: ${t.terms[0] ?? ''}`)
      .join('\n')
    await navigator.clipboard.writeText(`${entry.word}\n\n${lines}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const featured = useMemo(() => {
    if (!entry) return []
    const english: WiktionaryTranslation = { language: 'English', terms: [entry.word], code: 'en' }
    const priority = [
      'German',
      'French',
      'Spanish',
      'Italian',
      'Portuguese',
      'Russian',
      'Japanese',
      'Persian',
      'Arabic',
    ]
    const picked = priority
      .map(lang => entry.translations.find(t => t.language === lang))
      .filter(Boolean) as WiktionaryTranslation[]
    return [english, ...picked.slice(0, 8)]
  }, [entry])

  const moreTranslations = useMemo(() => {
    if (!entry) return []
    const set = new Set(featured.map(t => t.language))
    return entry.translations.filter(t => !set.has(t.language))
  }, [entry, featured])

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-6">
      {/* Search-first */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        ref={wrapperRef}
        className={cn(!booted && 'min-h-[52vh] flex flex-col justify-center')}
      >
        {!booted ? (
          <div className="mb-10 text-center space-y-3">
            <p
              className="text-[clamp(2.5rem,10vw,4.5rem)] leading-none text-foreground/[0.07] dark:text-foreground/[0.09] select-none tracking-tight"
              style={serif}
              aria-hidden
            >
              hello · hola · こんにちは
            </p>
            <h1 className="sr-only">Wiktionary</h1>
            <p className="text-sm text-muted-foreground">
              One word, many languages. Type and press enter.
            </p>
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
              style={serif}
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
                  <li key={s}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setQuery(s)
                        lookup(s)
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm rounded-lg hover:bg-muted transition-colors"
                      style={serif}
                    >
                      {s}
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
        <p className="mt-10 text-center text-sm text-destructive">{error}</p>
      ) : null}

      <AnimatePresence mode="wait">
        {entry && !error ? (
          <motion.article
            key={entry.word}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={cn('mt-14 space-y-14', loading && 'opacity-50 pointer-events-none')}
          >
            {/* Headword */}
            <header className="grid md:grid-cols-[1fr_200px] gap-8 items-start">
              <div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <h2
                    className="text-[clamp(2.75rem,10vw,5rem)] leading-[0.95] tracking-tight text-foreground capitalize"
                    style={serif}
                  >
                    {entry.word}
                  </h2>
                  <button
                    type="button"
                    onClick={copySummary}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Source <ExternalLink className="size-3" />
                  </a>
                </div>

                <PronunciationBar
                  pronunciations={entry.pronunciations}
                  phonetic={entry.phonetic}
                  playing={playing}
                  onPlay={play}
                />

                {entry.translationCount > 0 ? (
                  <p className="mt-5 text-sm text-muted-foreground">
                    Found in{' '}
                    <span className="text-foreground font-medium tabular-nums">
                      {entry.translationCount}
                    </span>{' '}
                    languages
                  </p>
                ) : null}
              </div>

              {entry.image ? (
                <div className="relative aspect-[4/3] md:aspect-auto md:h-full min-h-[160px] overflow-hidden rounded-2xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.image.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
            </header>

            {/* Across languages — ledger, not cards */}
            {featured.length > 1 ? (
              <section>
                <div className="flex items-end justify-between gap-4 mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
                      Translations
                    </p>
                    <h3
                      className="text-2xl md:text-3xl font-light text-foreground"
                      style={serif}
                    >
                      Across languages
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Hover a row · click to hear
                  </p>
                </div>

                <div className="border-t border-border mt-6">
                  {featured.map((t, i) => (
                    <TranslationRail
                      key={t.language}
                      t={t}
                      index={i}
                      playing={playing}
                      onPlay={play}
                      active={activeLang === t.language}
                      onFocus={() => setActiveLang(t.language)}
                    />
                  ))}
                </div>

                {moreTranslations.length > 0 ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllTranslations(v => !v)}
                      className="w-full flex items-center justify-between py-4 text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border"
                    >
                      <span>
                        {showAllTranslations
                          ? 'Show less'
                          : `${moreTranslations.length} more languages`}
                      </span>
                      <ChevronDown
                        className={cn(
                          'size-4 transition-transform duration-300',
                          showAllTranslations && 'rotate-180',
                        )}
                      />
                    </button>
                    <AnimatePresence>
                      {showAllTranslations ? (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="max-h-[480px] overflow-y-auto border-b border-border">
                            {moreTranslations.map((t, i) => (
                              <TranslationRail
                                key={t.language}
                                t={t}
                                index={i}
                                playing={playing}
                                onPlay={play}
                                active={activeLang === t.language}
                                onFocus={() => setActiveLang(t.language)}
                              />
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Related words */}
            {(entry.synonyms.length > 0 || entry.antonyms.length > 0) ? (
              <section className="space-y-6">
                {entry.synonyms.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                      Synonyms
                    </p>
                    <p className="text-base leading-relaxed">
                      {entry.synonyms.map((s, i) => (
                        <span key={s}>
                          <button
                            type="button"
                            onClick={() => lookup(s)}
                            className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                          >
                            {s}
                          </button>
                          {i < entry.synonyms.length - 1 ? (
                            <span className="text-muted-foreground/40 mx-1.5">·</span>
                          ) : null}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : null}
                {entry.antonyms.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                      Antonyms
                    </p>
                    <p className="text-base leading-relaxed">
                      {entry.antonyms.map((a, i) => (
                        <span key={a}>
                          <button
                            type="button"
                            onClick={() => lookup(a)}
                            className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                          >
                            {a}
                          </button>
                          {i < entry.antonyms.length - 1 ? (
                            <span className="text-muted-foreground/40 mx-1.5">·</span>
                          ) : null}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Definitions */}
            {entry.definitions.length > 0 ? (
              <section>
                <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-6">
                  Meanings
                </p>
                <ol className="divide-y divide-border">
                  {entry.definitions.map((def, i) => (
                    <li key={i} className="py-6 first:pt-0 grid grid-cols-[2.5rem_1fr] gap-2">
                      <span
                        className="text-2xl text-muted-foreground/40 leading-none pt-0.5 tabular-nums"
                        style={serif}
                      >
                        {i + 1}
                      </span>
                      <div>
                        {def.partOfSpeech ? (
                          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            {def.partOfSpeech}
                          </span>
                        ) : null}
                        <p className="mt-1.5 text-[1.05rem] leading-relaxed text-foreground">
                          {def.text}
                        </p>
                        {def.example ? (
                          <p className="mt-3 text-[0.95rem] italic text-muted-foreground leading-relaxed" style={serif}>
                            “{def.example}”
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {/* Etymology + wiki as pull quotes, not amber cards */}
            {(entry.etymology || entry.examples.length > 0 || entry.wikiExtract) ? (
              <section className="space-y-10 border-t border-border pt-10">
                {entry.etymology ? (
                  <blockquote>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                      Etymology
                    </p>
                    <p
                      className="text-lg md:text-xl font-light text-foreground/85 leading-relaxed"
                      style={serif}
                    >
                      {entry.etymology}
                    </p>
                  </blockquote>
                ) : null}

                {entry.examples.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
                      In context
                    </p>
                    <ul className="space-y-3">
                      {entry.examples.map((ex, i) => (
                        <li
                          key={i}
                          className="text-base italic text-muted-foreground leading-relaxed"
                          style={serif}
                        >
                          “{ex}”
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {entry.wikiExtract ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
                      Encyclopedia
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {entry.wikiExtract}…
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}
          </motion.article>
        ) : null}
      </AnimatePresence>

      <PronunciationStudioSuggest word={entry?.word ?? (query.trim() || undefined)} />
    </div>
  )
}
