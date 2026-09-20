'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function AnimalFactsShell({
  fontVars,
  children,
  label = 'FACTS',
}: {
  fontVars: string
  children: ReactNode
  label?: string
}) {
  return (
    <main
      className={`${fontVars} animal-facts-shell relative min-h-screen overflow-x-clip bg-[var(--af-bg)] text-[var(--af-fg)]`}
    >
      <style>{`
        .animal-facts-shell {
          --af-bg: #f2f4f1;
          --af-fg: #171a16;
          --af-mute: rgba(23, 26, 22, 0.52);
          --af-panel: rgba(255, 255, 255, 0.8);
          --af-line: rgba(23, 26, 22, 0.11);
          --af-line-soft: rgba(23, 26, 22, 0.06);
          --af-cat: #3d6b8a;
          --af-cat-soft: rgba(61, 107, 138, 0.12);
          --af-dog: #8a6b3d;
          --af-dog-soft: rgba(138, 107, 61, 0.12);
          --af-accent: #3d6b8a;
          --af-accent-soft: rgba(61, 107, 138, 0.12);
          --af-on-fg: #f2f4f1;
          --af-wash:
            radial-gradient(ellipse 65% 45% at 0% 0%, rgba(61, 107, 138, 0.1), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 100%, rgba(138, 107, 61, 0.07), transparent 50%),
            linear-gradient(180deg, #f8f9f6 0%, #f2f4f1 48%, #e8ebe6 100%);
          --af-shadow: 0 18px 50px -28px rgba(23, 26, 22, 0.28);
        }

        :is(html.dark, .dark) .animal-facts-shell {
          --af-bg: #2f3437;
          --af-fg: hsla(0, 0%, 100%, 0.92);
          --af-mute: hsla(0, 0%, 100%, 0.52);
          --af-panel: rgba(55, 60, 65, 0.9);
          --af-line: hsla(0, 0%, 100%, 0.12);
          --af-line-soft: hsla(0, 0%, 100%, 0.07);
          --af-cat: #7eb0d4;
          --af-cat-soft: rgba(126, 176, 212, 0.16);
          --af-dog: #d4b07e;
          --af-dog-soft: rgba(212, 176, 126, 0.16);
          --af-accent: #7eb0d4;
          --af-accent-soft: rgba(126, 176, 212, 0.16);
          --af-on-fg: #1a1d1a;
          --af-wash:
            radial-gradient(ellipse 60% 42% at 0% 0%, rgba(126, 176, 212, 0.1), transparent 52%),
            radial-gradient(ellipse 48% 35% at 100% 90%, rgba(212, 176, 126, 0.06), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 50%, #2c3134 100%);
          --af-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--af-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,var(--af-bg)_92%)]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            {label}
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
