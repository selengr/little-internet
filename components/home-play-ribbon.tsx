import Link from 'next/link'
import { ArrowRight, Gamepad2, HelpCircle } from 'lucide-react'

/** Homepage strip — arcade entry besides the tools marquee. */
export function HomePlayRibbon() {
  return (
    <section
      id="play"
      className="border-y border-border bg-muted/30 px-6 py-10 md:px-12 lg:px-20"
      aria-labelledby="play-heading"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-pixel text-[10px] tracking-[0.25em] text-muted-foreground">ARCADE</p>
          <h2 id="play-heading" className="mt-2 text-2xl font-light tracking-tight md:text-3xl">
            Seven quick tables. Keyboard-friendly.
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Trivia, chess, silhouettes, and more — pin favorites, share scores, press <kbd className="rounded border px-1 text-[10px]">?</kbd> for
            help.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Gamepad2 className="size-4" />
            Open arcade
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/games?help=1"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="size-4" />
            Keyboard help
          </Link>
        </div>
      </div>
    </section>
  )
}