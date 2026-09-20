import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import { PhotoDiscovery } from '@/components/photos/photo-discovery'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display-serif',
})

function PhotoDiscoveryFallback() {
  return (
    <div className="pb-24">
      <div className="relative h-[52vh] min-h-[320px] max-h-[560px] bg-muted animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 space-y-4">
        <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Photo Discovery — Unsplash',
  description: 'Discover beautiful high-quality photos from creators around the world.',
}

export default function PhotosPage() {
  return (
    <main
      className={`${display.variable} relative min-h-screen bg-background overflow-x-clip text-foreground`}
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[15%] w-[520px] h-[520px] rounded-full bg-violet-500/[0.06] dark:bg-violet-500/[0.08] blur-[140px]" />
        <div className="absolute bottom-[0%] right-[5%] w-[460px] h-[460px] rounded-full bg-amber-400/[0.04] dark:bg-amber-400/[0.06] blur-[120px]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            PHOTOS
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 tracking-wide"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="pt-20 md:pt-24">
        <Suspense fallback={<PhotoDiscoveryFallback />}>
          <PhotoDiscovery />
        </Suspense>
      </div>
    </main>
  )
}
