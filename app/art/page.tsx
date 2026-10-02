import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { MetExplorer } from '@/components/met-explorer'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-art-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-art-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-art-mark',
})

const description =
  'Explore a huge open-access art collection: search paintings, sculpture and more from over 470,000 works, and look closely at each one.'

export const metadata = {
  title: 'Art Gallery',
  description,
  openGraph: { title: 'Art Gallery', description },
  twitter: { title: 'Art Gallery', description },
}

export default function ArtPage() {
  return (
    <main
      className={`${display.variable} ${mono.variable} ${mark.variable} relative min-h-screen overflow-x-clip bg-[#f4efe6] text-foreground dark:bg-[#12100e]`}
    >
      {/* Same header as the other pages */}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel hidden text-[10px] tracking-[0.2em] text-black/50 sm:inline dark:text-white/50">
            ART
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-[11px] tracking-wide text-black/70 transition-all hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:text-white"
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="pt-28 md:pt-32">
        <MetExplorer />
      </div>
    </main>
  )
}
