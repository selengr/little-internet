'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function JokesShell({
  fontVars,
  children,
}: {
  fontVars: string
  children: ReactNode
}) {
  return (
    <main
      className={`${fontVars} jokes-shell relative min-h-screen overflow-x-clip bg-[var(--jk-bg)] text-[var(--jk-fg)]`}
      style={{ fontFamily: 'var(--jk-sans)' }}
    >
      <style>{`
        .jokes-shell {
          --jk-bg: #f3f2ee;
          --jk-fg: #1a1915;
          --jk-mute: rgba(26, 25, 21, 0.52);
          --jk-panel: rgba(255, 255, 255, 0.78);
          --jk-line: rgba(26, 25, 21, 0.11);
          --jk-line-soft: rgba(26, 25, 21, 0.06);
          --jk-hot: #c94a3a;
          --jk-hot-soft: rgba(201, 74, 58, 0.12);
          --jk-cue: #c94a3a;
          --jk-stage: #1f1e1a;
          --jk-stage-fg: #f3f2ee;
          --jk-on-fg: #f3f2ee;
          --jk-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
          --jk-wash:
            radial-gradient(ellipse 70% 48% at 90% 0%, rgba(201, 74, 58, 0.1), transparent 55%),
            radial-gradient(ellipse 50% 40% at 0% 100%, rgba(26, 25, 21, 0.04), transparent 50%),
            linear-gradient(180deg, #faf9f6 0%, #f3f2ee 48%, #ebe9e3 100%);
          --jk-shadow: 0 18px 50px -28px rgba(26, 25, 21, 0.28);
        }

        :is(html.dark, .dark) .jokes-shell {
          --jk-bg: #2f3437;
          --jk-fg: hsla(0, 0%, 100%, 0.92);
          --jk-mute: hsla(0, 0%, 100%, 0.52);
          --jk-panel: rgba(55, 60, 65, 0.9);
          --jk-line: hsla(0, 0%, 100%, 0.12);
          --jk-line-soft: hsla(0, 0%, 100%, 0.07);
          --jk-hot: #ff7a6a;
          --jk-hot-soft: rgba(255, 122, 106, 0.16);
          --jk-cue: #ff7a6a;
          --jk-stage: #252a2d;
          --jk-stage-fg: #f3f2ee;
          --jk-on-fg: #1a1916;
          --jk-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;
          --jk-wash:
            radial-gradient(ellipse 65% 45% at 95% 0%, rgba(255, 122, 106, 0.1), transparent 52%),
            radial-gradient(ellipse 48% 35% at 0% 90%, rgba(255, 255, 255, 0.03), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 50%, #2c3134 100%);
          --jk-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--jk-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,var(--jk-bg)_92%)]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            JOKES
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
