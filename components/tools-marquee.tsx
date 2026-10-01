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
  NotebookPen,
  Palette,
  QrCode,
  ScanBarcode,
  type LucideIcon,
} from 'lucide-react'

type Item = { label: string; href: string; icon: LucideIcon }

// Every name used to be plain text; now each one is a shortcut to its page.
const ROW_ONE: Item[] = [
  { label: 'QR Codes', href: '/qr', icon: QrCode },
  { label: 'Currency Convert', href: '/convert', icon: ArrowRightLeft },
  { label: 'File Convert', href: '/files', icon: FileOutput },
  { label: 'Cat Facts', href: '/cat-facts', icon: Cat },
  { label: 'Dog Facts', href: '/dog-facts', icon: Dog },
  { label: 'Daily Poetry', href: '/poetry', icon: Feather },
  { label: 'Joke Spinner', href: '/jokes', icon: Laugh },
  { label: 'Live Markets', href: '/charts', icon: ChartCandlestick },
  { label: 'Crypto Prices', href: '/crypto', icon: Bitcoin },
  { label: 'Photo Discovery', href: '/photos', icon: Camera },
]

const ROW_TWO: Item[] = [
  { label: 'English Suite', href: '/studio', icon: GraduationCap },
  { label: 'Dictionary', href: '/dictionary', icon: BookA },
  { label: 'Book Explorer', href: '/books', icon: Library },
  { label: 'Art Gallery', href: '/art', icon: Palette },
  { label: 'Lyrics Finder', href: '/lyrics', icon: MicVocal },
  { label: 'Music Browse', href: '/music', icon: Headphones },
  { label: 'Country Explorer', href: '/countries', icon: Globe },
  { label: 'Where Am I', href: '/location', icon: MapPin },
  { label: 'Notion Notes', href: '/notion', icon: NotebookPen },
  { label: 'Barcode Maker', href: '/qr', icon: ScanBarcode },
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
  .tm-row-left { animation: tm-left 46s linear infinite; }
  .tm-row-right { animation: tm-right 40s linear infinite; }
  /* Hovering or tabbing into a row stops it, so a chip can be read and clicked. */
  .tm-row:hover, .tm-row:focus-within { animation-play-state: paused; }

  .tm-chip {
    --tm: #6366f1;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: .75rem;
    margin: .5rem .35rem;
    padding: .55rem 1.1rem .55rem .6rem;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--card) 70%, transparent);
    white-space: nowrap;
    transition: transform .25s ease, border-color .25s ease, box-shadow .35s ease, background-color .25s ease;
  }
  .tm-chip:hover, .tm-chip:focus-visible {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--tm) 55%, transparent);
    background: color-mix(in srgb, var(--tm) 7%, var(--card));
    box-shadow:
      0 12px 26px -16px color-mix(in srgb, var(--tm) 80%, transparent),
      inset 0 0 18px -8px color-mix(in srgb, var(--tm) 55%, transparent);
    outline: none;
  }
  .tm-icon {
    display: grid; place-items: center;
    width: 1.9rem; height: 1.9rem; border-radius: 9999px;
    color: var(--tm);
    background: color-mix(in srgb, var(--tm) 14%, transparent);
    transition: background-color .25s ease, color .25s ease, transform .35s ease;
  }
  .tm-chip:hover .tm-icon, .tm-chip:focus-visible .tm-icon {
    background: var(--tm); color: #fff; transform: rotate(-8deg) scale(1.08);
  }
  .tm-arrow { width: 0; opacity: 0; margin-left: -.5rem; transition: width .25s ease, opacity .25s ease, margin .25s ease; }
  .tm-chip:hover .tm-arrow, .tm-chip:focus-visible .tm-arrow { width: .9rem; opacity: .7; margin-left: 0; }

  @media (prefers-reduced-motion: reduce) {
    .tm-row-left, .tm-row-right { animation: none; }
    .tm-fade { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
    .tm-dup { display: none; }
  }
`

function Row({ items, dir, offset }: { items: Item[]; dir: 'left' | 'right'; offset: number }) {
  return (
    <div className="tm-fade overflow-hidden">
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
                  className="tm-chip text-sm text-foreground/80 hover:text-foreground"
                  style={{ ['--tm' as string]: HUES[(i + offset) % HUES.length] }}
                >
                  <span className="tm-icon" aria-hidden>
                    <Icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span className="tracking-wide">{it.label}</span>
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
    <section aria-label="All tools" className="select-none overflow-hidden border-t border-border py-4">
      <style>{CSS}</style>
      <p className="px-6 pb-1 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
        Everything on this site · hover to pause
      </p>
      <Row items={ROW_ONE} dir="left" offset={0} />
      <Row items={ROW_TWO} dir="right" offset={3} />
    </section>
  )
}
