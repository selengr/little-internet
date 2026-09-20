'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function PoetryShell({
  fontVars,
  children,
}: {
  fontVars: string
  children: ReactNode
}) {
  return (
    <main
      className={`${fontVars} poetry-shell relative min-h-screen overflow-x-clip bg-[var(--py-bg)] text-[var(--py-fg)]`}
      style={{ fontFamily: 'var(--py-sans)' }}
    >
      <style>{`
        .poetry-shell {
          --py-bg: #f4f2ed;
          --py-fg: #1c1916;
          --py-mute: rgba(28, 25, 22, 0.52);
          --py-panel: rgba(255, 255, 255, 0.78);
          --py-line: rgba(28, 25, 22, 0.11);
          --py-line-soft: rgba(28, 25, 22, 0.06);
          --py-accent: #8b3a42;
          --py-accent-soft: rgba(139, 58, 66, 0.12);
          --py-paper: #faf8f4;
          --py-on-fg: #f4f2ed;
          --py-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
          --py-wash:
            radial-gradient(ellipse 65% 45% at 8% 0%, rgba(139, 58, 66, 0.09), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 90%, rgba(28, 25, 22, 0.04), transparent 50%),
            linear-gradient(180deg, #faf8f4 0%, #f4f2ed 48%, #ebe7e0 100%);
          --py-shadow: 0 18px 50px -28px rgba(28, 25, 22, 0.28);
        }

        :is(html.dark, .dark) .poetry-shell {
          --py-bg: #2f3437;
          --py-fg: hsla(0, 0%, 100%, 0.92);
          --py-mute: hsla(0, 0%, 100%, 0.52);
          --py-panel: rgba(55, 60, 65, 0.9);
          --py-line: hsla(0, 0%, 100%, 0.12);
          --py-line-soft: hsla(0, 0%, 100%, 0.07);
          --py-accent: #e08a94;
          --py-accent-soft: rgba(224, 138, 148, 0.16);
          --py-paper: #373c41;
          --py-on-fg: #1c1916;
          --py-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
          --py-wash:
            radial-gradient(ellipse 60% 42% at 0% 0%, rgba(224, 138, 148, 0.1), transparent 52%),
            radial-gradient(ellipse 48% 35% at 100% 90%, rgba(255, 255, 255, 0.03), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 50%, #2c3134 100%);
          --py-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--py-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,var(--py-bg)_92%)]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            POETRY
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

      <div className="pt-24 md:pt-28 pb-20 md:pb-24">{children}</div>
    </main>
  )
}
