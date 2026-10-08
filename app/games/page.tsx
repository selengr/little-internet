import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight, Gamepad2 } from 'lucide-react'
import { GamesHub } from '@/components/games/games-hub'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

const description = 'Trivia, chess puzzles, Sudoku, a Pokémon guessing game, Higher or Lower and Rock–Paper–Scissors — six little games, no account, no install.'

// The selected game depends on the request's ?mode= — must render per-request,
// not be baked into one static snapshot, or the server HTML can mismatch what
// the client hydrates against (a stale cached shell vs a live ?mode= link).
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Games',
  description,
  openGraph: { title: 'Games', description },
  twitter: { title: 'Games', description },
}

export default function GamesPage() {
  return (
    <main className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,oklch(0.7_0.04_280_/0.1),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,oklch(0.4_0.04_280_/0.18),transparent_55%)]" />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-[11px] tracking-wide text-black/70 transition-all duration-200 hover:border-black/20 hover:bg-black/[0.03] hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-24 pt-28 md:px-8 md:pt-32">
        <div className="mb-8 text-center sm:mb-10">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            <Gamepad2 className="size-9 shrink-0 text-indigo-500 sm:size-10" strokeWidth={2.25} />
            Pick a game
          </h1>
          <p className="mx-auto mt-2.5 max-w-xs text-[14.5px] text-muted-foreground sm:max-w-sm">
            Six little games. Tap one and start playing.
          </p>
        </div>
        <Suspense fallback={null}>
          <GamesHub />
        </Suspense>
      </div>
    </main>
  )
}
