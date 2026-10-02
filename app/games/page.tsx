import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GamesHub } from '@/components/games/games-hub'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

const description = 'Trivia and a Pokémon guessing game right now — cards and Rock–Paper–Scissors next. No account, no install, just play.'

export const metadata = {
  title: 'Games',
  description,
  openGraph: { title: 'Games', description },
  twitter: { title: 'Games', description },
}

export default function GamesPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[8%] h-[520px] w-[520px] rounded-full bg-indigo-500/[0.14] blur-[130px]" />
        <div className="absolute top-[10%] right-[4%] h-[420px] w-[420px] rounded-full bg-amber-400/[0.12] blur-[110px]" />
        <div className="absolute bottom-[-10%] left-[30%] h-[460px] w-[460px] rounded-full bg-fuchsia-400/[0.1] blur-[120px]" />
        {/* Faint dot grid, like a scoreboard */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1.2px)',
            backgroundSize: '18px 18px',
          }}
        />
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div
          className={`pointer-events-auto flex w-full max-w-3xl items-center justify-between rounded-2xl border border-black/[0.06] px-4 py-2.5 dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel hidden text-[10px] tracking-[0.2em] text-black/50 sm:inline dark:text-white/50">
            GAMES
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-[11px] tracking-wide text-black/70 transition-all duration-200 hover:border-black/20 hover:bg-black/[0.03] hover:text-black dark:border-white/20 dark:text-white/70 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-8 md:pt-32">
        <div className="mb-14 text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur-sm dark:border-white/10">
            Two live · two on the way
          </p>
          <h1
            className="text-[clamp(3.2rem,11vw,6.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(100deg, oklch(0.6 0.19 290), oklch(0.68 0.2 330), oklch(0.72 0.19 55))',
            }}
          >
            Games
          </h1>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Little games built right into the site. Pick one below — no sign-in, nothing to install.
          </p>
        </div>
        <GamesHub />
      </div>
    </main>
  )
}
