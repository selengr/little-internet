'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { formatPct, formatUsd } from '@/lib/crypto-format'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import type { GoldPayload } from '@/lib/goldprice'

const REFRESH_MS = 30_000

const KARAT_KEYS = [
  ['price_gram_24k', '24K'],
  ['price_gram_22k', '22K'],
  ['price_gram_21k', '21K'],
  ['price_gram_20k', '20K'],
  ['price_gram_18k', '18K'],
  ['price_gram_16k', '16K'],
  ['price_gram_14k', '14K'],
  ['price_gram_10k', '10K'],
] as const

export function GoldMarket() {
  const [data, setData] = useState<GoldPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/gold', { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to load')
        if (!cancelled) {
          setData(json as GoldPayload)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      }
    }
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const gold = data?.gold
  const silver = data?.silver
  const carat = data?.carat

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-clip">
      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            GOLD
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition-all tracking-wide"
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pt-28 pb-24">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
          Precious metals
        </p>
        <h1 className="text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
          Live gold & silver
        </h1>
        <p className="mt-4 text-sm text-muted-foreground max-w-md leading-relaxed">
          Spot prices per troy ounce, plus purity-adjusted per-gram karat values. Metal value only —
          not jewellery retail quotes.
        </p>

        {error ? (
          <p className="mt-10 text-sm text-rose-500">{error}</p>
        ) : (
          <div className="mt-12 space-y-10">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border bg-card/40 p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Gold · XAU
                </p>
                <p className="mt-3 text-3xl font-light tabular-nums tracking-tight">
                  {gold?.price != null ? formatUsd(gold.price) : '—'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  per troy oz
                  {gold?.changePct != null ? (
                    <span className="ml-2">{formatPct(gold.changePct)}</span>
                  ) : null}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card/40 p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Silver · XAG
                </p>
                <p className="mt-3 text-3xl font-light tabular-nums tracking-tight">
                  {silver?.price != null ? formatUsd(silver.price) : '—'}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">per troy oz</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-light tracking-tight mb-4">Per gram by karat</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {KARAT_KEYS.map(([key, label]) => {
                  const raw = carat?.[key]
                  const n = raw != null ? Number(raw) : null
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-border/80 px-3 py-3 bg-muted/20"
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-sm tabular-nums font-medium">
                        {n != null && Number.isFinite(n)
                          ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                          : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Data via Goldprice.dev · refreshes about every 30s
              {data?.updatedAt ? ` · ${new Date(data.updatedAt).toLocaleTimeString()}` : ''}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
