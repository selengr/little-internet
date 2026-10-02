'use client'

import Link from 'next/link'
import {
  ArrowRightLeft,
  ArrowUpRight,
  Bitcoin,
  BookA,
  Camera,
  Cat,
  ChartCandlestick,
  Dog,
  Feather,
  FileOutput,
  Globe,
  GraduationCap,
  Headphones,
  Laugh,
  Library,
  MapPin,
  MicVocal,
  Palette,
  QrCode,
  ScanBarcode,
  type LucideIcon,
} from 'lucide-react'

type Item = { label: string; sub: string; href: string; icon: LucideIcon; badge?: 'new' | 'live' }

// Every name used to be plain text; now each one is a shortcut to its page.
const ROW_ONE: Item[] = [
  { label: 'QR Codes', sub: 'Make and scan', href: '/qr', icon: QrCode },
  { label: 'Currency Convert', sub: 'Live exchange rates', href: '/convert', icon: ArrowRightLeft, badge: 'live' },
  { label: 'File Convert', sub: 'Any format to any', href: '/files', icon: FileOutput },
  { label: 'Cat Facts', sub: 'Wake the eye', href: '/cat-facts', icon: Cat, badge: 'new' },
  { label: 'Dog Facts', sub: 'Throw the ball', href: '/dog-facts', icon: Dog, badge: 'new' },
  { label: 'Daily Poetry', sub: 'A verse by mood', href: '/poetry', icon: Feather, badge: 'new' },
  { label: 'Joke Spinner', sub: 'Roll the die', href: '/jokes', icon: Laugh, badge: 'new' },
  { label: 'Live Markets', sub: 'Charts and candles', href: '/charts', icon: ChartCandlestick, badge: 'live' },
  { label: 'Crypto Prices', sub: 'The top coins', href: '/crypto', icon: Bitcoin, badge: 'live' },
  { label: 'Photo Discovery', sub: 'Fresh from Unsplash', href: '/photos', icon: Camera },
]

const ROW_TWO: Item[] = [
  { label: 'English Suite', sub: 'Study and practise', href: '/studio', icon: GraduationCap },
  { label: 'Dictionary', sub: 'Words and audio', href: '/dictionary', icon: BookA },
  { label: 'Book Explorer', sub: 'Your next read', href: '/books', icon: Library },
  { label: 'Art Gallery', sub: "The Met's collection", href: '/art', icon: Palette },
  { label: 'Lyrics Finder', sub: 'Read and learn words', href: '/lyrics', icon: MicVocal, badge: 'new' },
  { label: 'Music Browse', sub: 'Artists and albums', href: '/music', icon: Headphones },
  { label: 'Country Explorer', sub: 'An atlas of the world', href: '/countries', icon: Globe },
  { label: 'Where Am I', sub: 'Your IP and a map', href: '/location', icon: MapPin, badge: 'live' },
  { label: 'Barcode Maker', sub: 'Codes in seconds', href: '/qr', icon: ScanBarcode },
]

const HUES = ['#f59e0b', '#10b981', '#a855f7', '#38bdf8', '#ec4899', '#6366f1', '#f97316', '#14b8a6']

const CSS = `
  @keyframes tm-left { from { transform: translateX(0) } to { transform: translateX(-33.3333%) } }
  @keyframes tm-right { from { transform: translateX(-33.3333%) } to { transform: translateX(0) } }

  .tm-fade {
    -webkit-mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
    mask-image: linear-gradient(to right, transparent, #000 7%, #000 93%, transparent);
  }
  .tm-row { display: flex; width: max-content; }
  /* No space above the first row or below the last one; just enough for the hover lift. */
  .tm-first .tm-chip { margin-top: .2rem; }
  .tm-last .tm-chip { margin-bottom: .2rem; }
  .tm-row-left { animation: tm-left 46s linear infinite; }
  .tm-row-right { animation: tm-right 40s linear infinite; }
  /* Hovering or tabbing into a row stops it, so a chip can be read and clicked. */
  .tm-row:hover, .tm-row:focus-within { animation-play-state: paused; }

  .tm-chip {
    --tm: #6366f1;
    --px: 50%; --py: 50%;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: .8rem;
    margin: .25rem .35rem;
    padding: .5rem 1.15rem .5rem .5rem;
    border-radius: 1.1rem;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--card) 70%, transparent);
    white-space: nowrap;
    overflow: hidden;
    isolation: isolate;
    transition: transform .25s ease, border-color .25s ease, box-shadow .35s ease, background-color .25s ease;
  }
  /* A light that follows the pointer across the chip. */
  .tm-chip::before {
    content: '';
    position: absolute; inset: 0; z-index: -1;
    background: radial-gradient(130px circle at var(--px) var(--py), color-mix(in srgb, var(--tm) 26%, transparent), transparent 70%);
    opacity: 0; transition: opacity .3s ease;
  }
  .tm-chip:hover, .tm-chip:focus-visible {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--tm) 55%, transparent);
    box-shadow:
      0 12px 26px -16px color-mix(in srgb, var(--tm) 80%, transparent),
      inset 0 0 18px -8px color-mix(in srgb, var(--tm) 55%, transparent);
    outline: none;
  }
  .tm-chip:hover::before, .tm-chip:focus-visible::before { opacity: 1; }
  .tm-icon {
    display: grid; place-items: center;
    width: 2.5rem; height: 2.5rem; border-radius: .85rem;
    color: var(--tm);
    background: color-mix(in srgb, var(--tm) 14%, transparent);
    transition: background-color .25s ease, color .25s ease, transform .35s ease;
  }
  .tm-chip:hover .tm-icon, .tm-chip:focus-visible .tm-icon {
    background: var(--tm); color: #fff; transform: rotate(-8deg) scale(1.08);
  }
  .tm-text { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
  .tm-title { display: flex; align-items: center; gap: .45rem; font-size: .875rem; font-weight: 500; letter-spacing: .01em; }
  .tm-sub { margin-top: .2rem; font-size: .6875rem; color: var(--muted-foreground); }
  .tm-arrow { margin-left: .15rem; width: 0; opacity: 0; transition: width .25s ease, opacity .25s ease; }
  .tm-chip:hover .tm-arrow, .tm-chip:focus-visible .tm-arrow { width: .9rem; opacity: .7; }

  .tm-badge {
    display: inline-flex; align-items: center; gap: .25rem;
    padding: .08rem .38rem; border-radius: 9999px;
    font-size: .5625rem; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  }
  .tm-badge-new { background: var(--tm); color: #fff; }
  .tm-badge-live { color: #e11d48; background: color-mix(in srgb, #e11d48 12%, transparent); }
  .tm-badge-live::before {
    content: ''; width: .32rem; height: .32rem; border-radius: 9999px; background: currentColor;
    animation: tm-pulse 1.6s ease-in-out infinite;
  }
  @keyframes tm-pulse { 0%,100% { opacity: .35; transform: scale(.8) } 50% { opacity: 1; transform: scale(1.15) } }

  @media (prefers-reduced-motion: reduce) {
    .tm-row-left, .tm-row-right, .tm-badge-live::before { animation: none; }
    .tm-fade { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
    .tm-dup { display: none; }
  }
`

function Row({ items, dir, offset, edge }: { items: Item[]; dir: 'left' | 'right'; offset: number; edge: 'first' | 'last' }) {
  return (
    <div
      className={`tm-fade overflow-hidden ${edge === 'first' ? 'tm-first' : 'tm-last'}`}
      onPointerMove={e => {
        const chip = (e.target as HTMLElement).closest<HTMLElement>('.tm-chip')
        if (!chip) return
        const r = chip.getBoundingClientRect()
        chip.style.setProperty('--px', `${e.clientX - r.left}px`)
        chip.style.setProperty('--py', `${e.clientY - r.top}px`)
      }}
    >
      <div className={`tm-row ${dir === 'left' ? 'tm-row-left' : 'tm-row-right'}`}>
        {[0, 1, 2].map(rep => (
          // Only the first copy is for keyboards and screen readers; the others just fill the loop.
          <div key={rep} className={rep === 0 ? 'flex shrink-0' : 'tm-dup flex shrink-0'} aria-hidden={rep === 0 ? undefined : true}>
            {items.map((it, i) => {
              const Icon = it.icon
              return (
                <Link
                  key={it.label}
                  href={it.href}
                  tabIndex={rep === 0 ? undefined : -1}
                  className="tm-chip text-foreground/85 hover:text-foreground"
                  style={{ ['--tm' as string]: HUES[(i + offset) % HUES.length] }}
                >
                  <span className="tm-icon" aria-hidden>
                    <Icon className="size-[1.15rem]" strokeWidth={1.8} />
                  </span>
                  <span className="tm-text">
                    <span className="tm-title">
                      {it.label}
                      {it.badge ? (
                        <span className={`tm-badge ${it.badge === 'new' ? 'tm-badge-new' : 'tm-badge-live'}`}>{it.badge}</span>
                      ) : null}
                    </span>
                    <span className="tm-sub">{it.sub}</span>
                  </span>
                  <ArrowUpRight className="tm-arrow size-3.5" aria-hidden />
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Two opposite-direction ribbons of shortcuts to every tool on the site. */
export function ToolsMarquee() {
  return (
    <section aria-label="All tools" className="select-none overflow-hidden border-t border-border">
      <style>{CSS}</style>
      <Row items={ROW_ONE} dir="left" offset={0} edge="first" />
      <Row items={ROW_TWO} dir="right" offset={3} edge="last" />
    </section>
  )
}
