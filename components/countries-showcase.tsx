'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { PixelIcon } from '@/components/pixel-icon'
import { RevealText } from '@/components/reveal-text'
import type { Country } from '@/types/restcountries'
import { cn } from '@/lib/utils'

type Featured = {
  code: string
  image: string
  imageAlt: string
}

/** Top countries by population — local scenic anchors + live API data */
const FEATURED: Featured[] = [
  {
    code: 'CN',
    image: '/images/cards/country-cn.jpg',
    imageAlt: 'Great Wall of China',
  },
  {
    code: 'IN',
    image: '/images/cards/country-in.jpg',
    imageAlt: 'Taj Mahal, India',
  },
  {
    code: 'US',
    image: '/images/cards/country-us.jpg',
    imageAlt: 'New York City skyline',
  },
  {
    code: 'ID',
    image: '/images/cards/country-id.jpg',
    imageAlt: 'Bali temple, Indonesia',
  },
]

function formatPopulation(n?: number) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] tracking-widest text-muted-foreground uppercase">
      {children}
    </span>
  )
}

function CountryPanel({
  featured,
  country,
  className,
}: {
  featured: Featured
  country: Country | null
  className?: string
}) {
  const name = country?.names?.common ?? featured.code
  const languages =
    country?.languages
      ?.map(l => l.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || '—'
  const timezones =
    country?.timezones?.slice(0, 2).join(' · ') ||
    (country?.timezones?.length ? country.timezones[0] : '—')
  const demonym =
    country?.demonyms?.eng?.m ||
    country?.demonyms?.eng?.f ||
    null

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border min-h-[380px] md:min-h-[440px]',
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={featured.image}
        alt={featured.imageAlt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = `https://flagcdn.com/w1280/${featured.code.toLowerCase()}.png`
        }}
      />

      {/* Fade image → text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 mb-2">
              {country?.codes?.alpha_2 ?? featured.code}
              {country?.region ? ` · ${country.region}` : ''}
            </p>
            <h3 className="text-3xl md:text-4xl font-light tracking-tight text-white leading-none">
              {name}
            </h3>
          </div>
          <span className="text-3xl drop-shadow-sm shrink-0" aria-hidden>
            {country?.flag?.emoji}
          </span>
        </div>

        <dl className="space-y-2.5 border-t border-white/15 pt-4">
          <div className="flex justify-between gap-4 text-[12px]">
            <dt className="text-white/45 tracking-wide">Population</dt>
            <dd className="text-white/90 font-light tabular-nums">
              {formatPopulation(country?.population)}
            </dd>
          </div>
          <div className="flex justify-between gap-4 text-[12px]">
            <dt className="text-white/45 tracking-wide">Languages</dt>
            <dd className="text-white/90 font-light text-right">{languages}</dd>
          </div>
          <div className="flex justify-between gap-4 text-[12px]">
            <dt className="text-white/45 tracking-wide">Timezones</dt>
            <dd className="text-white/90 font-light text-right font-mono text-[11px]">
              {timezones}
            </dd>
          </div>
          {demonym && (
            <p className="pt-1 text-[12px] text-white/70 font-light leading-relaxed">
              People here are called{' '}
              <span className="text-white">{demonym}</span>
            </p>
          )}
        </dl>
      </div>
    </article>
  )
}

export function CountriesShowcase() {
  const [countries, setCountries] = useState<Record<string, Country | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const entries = await Promise.all(
          FEATURED.map(async f => {
            try {
              const res = await fetch(
                `/api/countries?path=code&q=${encodeURIComponent(f.code)}&limit=1`,
                { cache: 'no-store' },
              )
              const json = await res.json()
              const country: Country | null = json.data?.objects?.[0] ?? null
              return [f.code, country] as const
            } catch {
              return [f.code, null] as const
            }
          }),
        )
        if (!cancelled) {
          setCountries(Object.fromEntries(entries))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      id="countries"
      className="py-32 px-6 md:px-12 lg:px-20 border-t border-border"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <PixelIcon type="platform" size={40} />
            <div className="mt-4">
              <Tag>WORLD</Tag>
            </div>
            <RevealText className="mt-5 text-4xl md:text-5xl font-light tracking-tight leading-[1.05]">
              {"Four corners.\nOne atlas."}
            </RevealText>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs md:text-right">
            A quick look at the world&apos;s most populous places — then open the
            full atlas for every country.
          </p>
        </div>

        {loading && Object.keys(countries).length === 0 ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURED.map((f, i) => (
              <CountryPanel
                key={f.code}
                featured={f}
                country={countries[f.code] ?? null}
                className={i === 0 ? 'md:min-h-[480px]' : undefined}
              />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/countries"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors tracking-wide"
          >
            Explore all countries
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
