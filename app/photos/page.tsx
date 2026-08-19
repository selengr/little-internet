import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { PhotoDiscovery } from '@/components/photos/photo-discovery'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

function PhotoDiscoveryFallback() {
  return (
    <div className="pb-24">
      <div className="relative h-[52vh] min-h-[320px] max-h-[560px] bg-gradient-to-br from-stone-900 to-black animate-pulse" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 space-y-4">
        <div className="h-8 w-64 rounded-lg bg-white/10 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-white/10 animate-pulse" />
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
    <main className="relative min-h-screen bg-[#0a0a0b] overflow-x-clip text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[15%] w-[520px] h-[520px] rounded-full bg-violet-500/[0.07] blur-[140px]" />
        <div className="absolute bottom-[0%] right-[5%] w-[460px] h-[460px] rounded-full bg-amber-400/[0.05] blur-[120px]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-white/50 hidden sm:inline">
            PHOTOS
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white transition-all tracking-wide cursor-pointer"
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
