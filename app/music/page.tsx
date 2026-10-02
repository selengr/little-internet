import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MusicExplorer } from '@/components/music-explorer'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export const metadata = {
  title: 'Music Explorer — Listening Room',
  description: 'Search artists, top tracks, albums, and and related sounds.',
}

export default function MusicPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#f3efe8] dark:bg-[#0c0b0a] text-stone-900 dark:text-stone-100">
      <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-5 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-2xl flex items-center justify-between px-4 py-2.5 rounded-full border border-stone-900/8 dark:border-white/8 ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[9px] tracking-[0.22em] text-stone-400/80 hidden sm:inline">
            LISTENING ROOM
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors tracking-[0.1em] uppercase cursor-pointer"
          >
            Return
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="pt-24 md:pt-28">
        <MusicExplorer />
      </div>
    </main>
  )
}
