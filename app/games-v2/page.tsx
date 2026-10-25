import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { PricierGame } from '@/components/games-v2/pricier-game'

const description = 'Two Magic cards. Pick the one that costs more. Keep the streak.'

export const metadata = {
  title: 'Games v2',
  description,
  openGraph: { title: 'Games v2', description },
  twitter: { title: 'Games v2', description },
}

export default function GamesV2Page() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#efe8dc] text-[#1a1612] dark:bg-[#0e0d0b] dark:text-[#f3efe6]">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-6vw] top-16 select-none font-sans text-[22vw] font-semibold leading-none tracking-[-0.08em] text-[#1a1612]/[0.05] dark:text-[#f3efe6]/[0.05]"
      >
        $
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <p className="font-pixel text-[10px] tracking-[0.32em]">GAMES / V2</p>
        </div>
        <div className="flex items-center gap-4 font-pixel text-[10px] tracking-[0.22em]">
          <Link href="/games" className="opacity-60 transition-opacity hover:opacity-100">
            OLD GAMES
          </Link>
          <Link href="/" className="border-b border-current pb-0.5">
            HOME
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-24 pt-4 md:px-8 md:pt-8">
        <div className="mb-8 grid gap-6 md:mb-12 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <p className="font-pixel text-[10px] tracking-[0.38em] text-[#e23d28]">TABLE 01</p>
            <h1 className="mt-3 max-w-xl text-6xl font-semibold leading-[0.86] tracking-[-0.05em] sm:text-8xl">
              Pric
              <span className="text-[#e23d28]">ier.</span>
            </h1>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[#1a1612]/70 dark:text-[#f3efe6]/70 md:justify-self-end md:pb-2">
            Look at the art. Choose the card that sells for more. One wrong tap clears the streak.
          </p>
        </div>

        <PricierGame />
      </div>
    </main>
  )
}
