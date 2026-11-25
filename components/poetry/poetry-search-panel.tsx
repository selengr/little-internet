'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FEATURED_POETS } from '@/lib/poetry'
import { isPoetrySearchQueryValid, normalizePoetrySearchQuery, type PoetrySearchField } from '@/lib/poetry-search'
import type { PoetryPoem } from '@/types/poetry'

const mono = { fontFamily: 'var(--font-py-mono), ui-monospace, monospace' } as const

type SearchResponse = {
  poems?: PoetryPoem[]
  field?: PoetrySearchField
  query?: string
  error?: string
  source?: string
}

export function PoetrySearchPanel({
  disabled,
  onPickPoem,
}: {
  disabled?: boolean
  onPickPoem: (poem: PoetryPoem) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [field, setField] = useState<PoetrySearchField>('author')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PoetryPoem[]>([])

  const runSearch = useCallback(
    async (q: string, f: PoetrySearchField) => {
      const norm = normalizePoetrySearchQuery(q)
      if (!isPoetrySearchQueryValid(norm)) {
        setError('Type at least two characters.')
        setResults([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ action: 'search', q: norm, field: f })
        const res = await fetch(`/api/poetry?${params}`, { cache: 'no-store', signal: AbortSignal.timeout(9000) })
        const data = (await res.json()) as SearchResponse
        if (!res.ok || data.error) throw new Error(data.error ?? 'Search failed')
        const poems = data.poems ?? []
        setResults(poems)
        if (poems.length === 0) setError('No poems found — try another spelling.')
      } catch (e) {
        setResults([])
        setError(e instanceof Error ? e.message : 'Search unavailable')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void runSearch(query, field)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      if (e.key === '/') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section className="mt-10" aria-label="Search PoetryDB">
      <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--py-mute)]" style={mono}>
        Search by author or title
      </p>
      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <PoetrySearchFieldToggle field={field} setField={setField} disabled={disabled || loading} />
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--py-mute)]" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={disabled || loading}
            placeholder={field === 'author' ? 'e.g. Dickinson' : 'e.g. Sonnet XVIII'}
            className="w-full rounded-xl border border-[var(--py-line)] bg-[var(--py-card)] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[var(--py-fg)]/40"
            style={mono}
          />
        </label>
        <button
          type="submit"
          disabled={disabled || loading}
          className="shrink-0 rounded-xl border border-[var(--py-line)] bg-[var(--py-fg)] px-4 py-2.5 text-sm text-[var(--py-ink-on)] disabled:opacity-50"
          style={mono}
        >
          {loading ? <Loader2 className="mx-auto size-4 animate-spin" /> : 'Search'}
        </button>
      </form>
      <p className="mt-2 text-[10px] text-[var(--py-mute)]" style={mono}>
        <kbd className="rounded border border-[var(--py-line)] px-1 py-0.5">/</kbd> focus search · PoetryDB.org
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FEATURED_POETS.map(name => (
          <button
            key={name}
            type="button"
            disabled={disabled || loading}
            onClick={() => {
              setField('author')
              setQuery(name)
              void runSearch(name, 'author')
            }}
            className="rounded-full border border-[var(--py-line)] bg-[var(--py-card)] px-3 py-1 text-[11px] transition-colors hover:border-[var(--py-fg)]/30"
            style={mono}
          >
            {name.split(' ').pop()}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{error}</p> : null}

      {results.length > 0 ? (
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-[var(--py-line)] bg-[var(--py-card)] p-3">
          {results.map(poem => (
            <li key={`${poem.title}-${poem.author}`}>
              <button
                type="button"
                onClick={() => onPickPoem(poem)}
                className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[var(--py-fg)]/5"
              >
                <span className="block text-sm font-medium">{poem.title}</span>
                <span className="text-xs text-[var(--py-mute)]">{poem.author}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function PoetrySearchFieldToggle({
  field,
  setField,
  disabled,
}: {
  field: PoetrySearchField
  setField: (f: PoetrySearchField) => void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Search field"
      className="inline-flex shrink-0 rounded-xl border border-[var(--py-line)] p-0.5"
    >
      {(['author', 'title'] as const).map(f => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={field === f}
          disabled={disabled}
          onClick={() => setField(f)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-[11px] capitalize',
            field === f ? 'bg-[var(--py-fg)] text-[var(--py-ink-on)]' : 'text-[var(--py-mute)]',
          )}
          style={mono}
        >
          {f}
        </button>
      ))}
    </div>
  )
}