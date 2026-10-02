'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
  Gamepad2,
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
  X,
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
  { label: 'Games', sub: 'Trivia and more', href: '/games', icon: Gamepad2, badge: 'new' },
  { label: 'Live Markets', sub: 'Charts and candles', href: '/charts', icon: ChartCandlestick, badge: 'live' },
  { label: 'Crypto Prices', sub: 'The top coins', href: '/crypto', icon: Bitcoin, badge: 'live' },
  { label: 'Photo Discovery', sub: 'Fresh from Unsplash', href: '/photos', icon: Camera },
]

const ROW_TWO: Item[] = [
  { label: 'English Suite', sub: 'Study and practise', href: '/studio', icon: GraduationCap },
  { label: 'Dictionary', sub: 'Words and audio', href: '/dictionary', icon: BookA },
  { label: 'Book Explorer', sub: 'Your next read', href: '/books', icon: Library },
  { label: 'Art Gallery', sub: 'Half a million works', href: '/art', icon: Palette },
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
  html[data-tools-open] .tm-row { animation-play-state: paused; }

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

type Opener = (item: Item, hue: string, rect: DOMRect) => void

function Row({ items, dir, offset, edge, onOpen }: { items: Item[]; dir: 'left' | 'right'; offset: number; edge: 'first' | 'last'; onOpen: Opener }) {
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
                  onClick={e => {
                    // Cmd/Ctrl/Shift/middle click keep their normal "open in a tab" behaviour.
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                    e.preventDefault()
                    onOpen(it, HUES[(i + offset) % HUES.length], e.currentTarget.getBoundingClientRect())
                  }}
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

const MODAL_CSS = `
  @keyframes tm-load { 0%,100% { transform: scaleY(.3) } 50% { transform: scaleY(1) } }
  @media (prefers-reduced-motion: reduce) { .tm-load-bar { animation: none !important; transform: scaleY(.7) } }
`

type Opened = { item: Item; hue: string; rect: DOMRect }

/** The tool's own page, shown in a frame that grows out of the chip that was clicked. */
function ToolModal({ opened, onClose }: { opened: Opened; onClose: () => void }) {
  const { item, hue, rect } = opened
  const reduce = useReducedMotion()
  const Icon = item.icon
  const [loaded, setLoaded] = useState(false)
  const [path, setPath] = useState(item.href)
  const frame = useRef<HTMLIFrameElement>(null)

  // The panel starts on the chip: offset from the screen centre, and scaled down to the chip's size.
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2
  const from = reduce ? { opacity: 0 } : { opacity: 0, x: dx, y: dy, scale: 0.18 }

  return (
    <DialogPrimitive.Root open onOpenChange={open => !open && onClose()}>
      <DialogPrimitive.Portal>
        <style>{MODAL_CSS}</style>
        <DialogPrimitive.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-[190] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
        </DialogPrimitive.Overlay>

        <DialogPrimitive.Content asChild aria-describedby={undefined}>
          <motion.div
            className="fixed left-1/2 top-1/2 z-[200] -ml-[min(47vw,590px)] -mt-[min(46dvh,410px)] flex h-[min(92dvh,820px)] w-[min(94vw,1180px)] flex-col overflow-hidden rounded-[1.6rem] border bg-background outline-none"
            style={{
              borderColor: `color-mix(in srgb, ${hue} 45%, transparent)`,
              boxShadow: `0 40px 90px -50px ${hue}, 0 0 0 1px color-mix(in srgb, ${hue} 25%, transparent)`,
            }}
            initial={from}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { ...from, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
            transition={{ type: 'spring', stiffness: 250, damping: 30, mass: 0.9 }}
          >
            <DialogPrimitive.Title className="sr-only">{item.label}</DialogPrimitive.Title>

            <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-2.5">
              <span
                className="grid size-8 place-items-center rounded-xl text-white"
                style={{ background: hue }}
                aria-hidden
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{path}</p>
              </div>
              <Link
                href={path}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[12px] transition-colors hover:bg-muted"
              >
                Open full page
                <ArrowUpRight className="size-3.5" />
              </Link>
              <DialogPrimitive.Close
                aria-label="Close"
                className="grid size-9 place-items-center rounded-full transition-colors hover:bg-muted"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </header>

            <div className="relative min-h-0 flex-1 overflow-hidden">
              {/* The page's own top bar is hidden in embedded mode, so pull the frame up under the header. */}
              <iframe
                ref={frame}
                src={item.href}
                title={item.label}
                // The location, QR scanner and English studio pages need these, and a frame must be allowed them.
                allow="geolocation; clipboard-write; clipboard-read; fullscreen; camera; microphone; autoplay"
                allowFullScreen
                onLoad={() => {
                  setLoaded(true)
                  try {
                    const p = frame.current?.contentWindow?.location
                    if (p) setPath(p.pathname + p.search)
                  } catch {
                    /* cross-origin pages cannot be read; keep the original path */
                  }
                }}
                className="absolute inset-x-0 bottom-0 -top-14 h-[calc(100%+3.5rem)] w-full border-0 bg-background"
              />
              <AnimatePresence>
                {!loaded && (
                  <motion.div
                    className="absolute inset-0 grid place-items-center bg-background"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    role="status"
                  >
                    <div className="flex flex-col items-center gap-5">
                      <div className="flex h-10 items-end gap-1.5" aria-hidden>
                        {[0, 1, 2, 3, 4].map(i => (
                          <span
                            key={i}
                            className="tm-load-bar block h-full w-1.5 origin-bottom rounded-full"
                            style={{ background: hue, animation: `tm-load ${0.9 + (i % 3) * 0.2}s ease-in-out ${i * 0.1}s infinite` }}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Opening {item.label}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Two opposite-direction ribbons of shortcuts to every tool on the site. Clicking one opens it in a frame. */
export function ToolsMarquee() {
  const [opened, setOpened] = useState<Opened | null>(null)
  const open: Opener = (item, hue, rect) => setOpened({ item, hue, rect })

  // The ribbons rest while a tool is open.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-tools-open', Boolean(opened))
    return () => document.documentElement.removeAttribute('data-tools-open')
  }, [opened])

  return (
    <section aria-label="All tools" className="select-none overflow-hidden border-t border-border">
      <style>{CSS}</style>
      <Row items={ROW_ONE} dir="left" offset={0} edge="first" onOpen={open} />
      <Row items={ROW_TWO} dir="right" offset={3} edge="last" onOpen={open} />
      <AnimatePresence>
        {opened && <ToolModal key={opened.item.label} opened={opened} onClose={() => setOpened(null)} />}
      </AnimatePresence>
    </section>
  )
}
