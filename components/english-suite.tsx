'use client'

import Link from 'next/link'
import { Cormorant_Garamond } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { PixelIcon } from '@/components/pixel-icon'
import { RevealText } from '@/components/reveal-text'
import { cn } from '@/lib/utils'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
})

type Tool = {
  n: string
  title: string
  whisper: string
  desc: string
  href: string | null
  live: boolean
  image: string
  imageAlt: string
  imagePosition?: string
  glyph: string
  phonetic: string
  ink: string
  grid: string
  height: string
  tall?: boolean
}

const ENGLISH_TOOLS: Tool[] = [
  {
    n: '01',
    title: 'Classic Dictionary',
    whisper: 'Look up',
    desc: 'Definitions, phonetics, and examples — a quiet reading room for every word.',
    href: '/dictionary',
    live: true,
    // Grand library aisle — warm wood, depth, cinematic
    image:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1800&q=85',
    imageAlt: 'Sunlit aisle in a grand library',
    imagePosition: 'object-[center_40%]',
    glyph: 'Aa',
    phonetic: '/ˈwɜːrd/',
    ink: 'from-[#0c0a08]/40 via-[#0c0a08]/55 to-[#0c0a08]/96',
    grid: 'md:col-span-7 md:row-span-2',
    height: 'min-h-[420px] md:min-h-full',
    tall: true,
  },
  {
    n: '02',
    title: 'Wiktionary',
    whisper: 'Translate',
    desc: 'Etymology, native audio, and meanings across languages.',
    href: '/wiktionary',
    live: true,
    // Earth at night — global languages, luminous cities
    image:
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=85',
    imageAlt: 'Earth from space at night with city lights',
    imagePosition: 'object-center',
    glyph: '文',
    phonetic: 'あ · Ω · ñ',
    ink: 'from-[#060a12]/45 via-[#060a12]/60 to-[#060a12]/96',
    grid: 'md:col-span-5',
    height: 'min-h-[260px]',
  },
  {
    n: '03',
    title: 'Grammar Atelier',
    whisper: 'Soon',
    desc: 'Tense maps and sentence refinement — not available yet.',
    href: null,
    live: false,
    // Desk with pen and notes — craft of writing
    image:
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1600&q=85',
    imageAlt: 'Notebook and pen on a writing desk',
    imagePosition: 'object-[center_35%]',
    glyph: 'S—V',
    phonetic: 'subject · verb',
    ink: 'from-[#0e0c0a]/40 via-[#0e0c0a]/60 to-[#0e0c0a]/96',
    grid: 'md:col-span-5',
    height: 'min-h-[260px]',
  },
  {
    n: '04',
    title: 'Pronunciation Studio',
    whisper: 'Soon',
    desc: 'Accent training with studio-quality voice comparisons — coming next.',
    href: null,
    live: false,
    // Vinyl / music atmosphere — sound and voice
    image:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=85',
    imageAlt: 'Music studio mixing console with warm light',
    imagePosition: 'object-[center_45%]',
    glyph: 'ə',
    phonetic: '/ʃ/ · /θ/ · /æ/',
    ink: 'from-[#08080c]/45 via-[#08080c]/60 to-[#08080c]/96',
    grid: 'md:col-span-12',
    height: 'min-h-[240px] md:min-h-[260px]',
  },
]

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] tracking-[0.28em] uppercase font-sans text-foreground/55 bg-foreground/[0.04] border border-foreground/10">
      {children}
    </span>
  )
}

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true)
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function EnglishCard({ tool, delay }: { tool: Tool; delay: number }) {
  const { ref, inView } = useInView()

  const card = (
    <article
      ref={ref}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 h-full',
        tool.height,
        !tool.live && 'cursor-default select-none',
      )}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`,
      }}
      aria-disabled={!tool.live ? true : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tool.image}
        alt={tool.imageAlt}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-transform duration-[1.1s] ease-out',
          tool.live && 'group-hover:scale-[1.05]',
          tool.imagePosition ?? 'object-center',
        )}
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${tool.ink}`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-black/10" />

      <div
        className={cn(
          'pointer-events-none absolute select-none text-white/[0.1] leading-none transition-all duration-700 ease-out',
          tool.live && 'group-hover:text-white/[0.16] group-hover:-translate-y-2 group-hover:translate-x-1',
          tool.tall
            ? 'right-[-4%] top-[8%] text-[11rem] md:text-[14rem]'
            : 'right-[-2%] top-[4%] text-[7rem] md:text-[8.5rem]',
        )}
        style={{ fontFamily: display.style.fontFamily }}
        aria-hidden
      >
        {tool.glyph}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] tracking-[0.28em] uppercase text-white/45">
              {tool.n}
            </span>
            {tool.live ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-emerald-300/90">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-55" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                {tool.whisper}
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">
                Coming soon
              </span>
            )}
          </div>
          {tool.live ? (
            <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/85 backdrop-blur-md transition-all duration-500 ease-out group-hover:scale-110 group-hover:bg-white group-hover:text-stone-900 group-hover:border-white group-hover:shadow-[0_8px_24px_-8px_rgba(255,255,255,0.55)]">
              <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          ) : null}
        </div>

        <div className={cn('mt-auto', tool.tall && 'max-w-md')}>
          {!tool.live ? (
            <p
              className={cn(
                'mb-3 font-semibold tracking-tight text-white leading-none',
                tool.n === '04'
                  ? 'text-[clamp(2.75rem,6vw,4rem)]'
                  : 'text-[clamp(2.4rem,5vw,3.25rem)]',
              )}
              style={{ fontFamily: display.style.fontFamily }}
            >
              Soon
            </p>
          ) : (
            <p
              className="mb-2.5 text-[13px] italic text-white/55 transition-colors duration-500 group-hover:text-white/80"
              style={{ fontFamily: display.style.fontFamily }}
            >
              {tool.phonetic}
            </p>
          )}
          <h3
            className={cn(
              'font-light tracking-tight text-white leading-[1.05]',
              tool.tall ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl',
              !tool.live && 'text-xl md:text-2xl',
            )}
            style={{ fontFamily: display.style.fontFamily }}
          >
            {tool.title}
          </h3>
          <p
            className={cn(
              'mt-3 text-[13px] sm:text-sm text-white/60 leading-relaxed',
              tool.tall ? 'max-w-sm' : 'line-clamp-2',
            )}
          >
            {tool.desc}
          </p>
          {tool.live ? (
            <p className="mt-5 inline-flex items-center gap-1.5 text-[11px] tracking-[0.2em] uppercase text-white/75 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              Open tool
              <ArrowUpRight className="size-3" />
            </p>
          ) : (
            <p className="mt-4 text-[11px] font-medium tracking-[0.18em] uppercase text-white/45">
              Not clickable yet
            </p>
          )}
        </div>
      </div>
    </article>
  )

  if (tool.href) {
    return (
      <Link
        href={tool.href}
        className={cn(
          'block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl',
          tool.grid,
          tool.height,
        )}
      >
        {card}
      </Link>
    )
  }

  return <div className={cn(tool.grid, tool.height)}>{card}</div>
}

export function EnglishSuiteSection() {
  return (
    <section
      id="english"
      className="relative py-32 px-6 md:px-12 lg:px-20 border-t border-border overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-24 left-0 w-[420px] h-[420px] rounded-full bg-stone-400/10 dark:bg-white/[0.03] blur-[110px]" />
        <div className="absolute bottom-0 right-10 w-[380px] h-[300px] rounded-full bg-sky-900/5 dark:bg-sky-400/[0.04] blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-14 md:mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <PixelIcon type="workflow" size={40} />
            <div className="mt-4">
              <Tag>English Suite</Tag>
            </div>
            <RevealText className="mt-5 text-4xl md:text-5xl lg:text-[3.4rem] font-light tracking-tight leading-[1.08]">
              {'Enjoy English.'}
            </RevealText>
            <p className="mt-5 text-sm md:text-base text-muted-foreground leading-relaxed max-w-md">
              Language tools dressed like posters — dictionary and Wiktionary live now.
            </p>
          </div>
          <p
            className="hidden md:block text-6xl lg:text-7xl italic text-foreground/[0.07] leading-none select-none"
            style={{ fontFamily: display.style.fontFamily }}
            aria-hidden
          >
            lexicon
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 md:auto-rows-[minmax(240px,1fr)]">
          {ENGLISH_TOOLS.map((tool, i) => (
            <EnglishCard key={tool.n} tool={tool} delay={i * 90} />
          ))}
        </div>
      </div>
    </section>
  )
}
