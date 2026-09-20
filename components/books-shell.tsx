'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function BooksShell({
  fontVars,
  children,
}: {
  fontVars: string
  children: ReactNode
}) {
  return (
    <main
      className={`${fontVars} books-shell relative min-h-screen overflow-x-clip bg-[var(--bk-bg)] text-[var(--bk-fg)]`}
    >
      <style>{`
        .books-shell {
          --bk-bg: #f5f3ee;
          --bk-fg: #1a1915;
          --bk-mute: rgba(26, 25, 21, 0.52);
          --bk-panel: rgba(255, 255, 255, 0.78);
          --bk-line: rgba(26, 25, 21, 0.11);
          --bk-line-soft: rgba(26, 25, 21, 0.06);
          --bk-accent: #2f6b4f;
          --bk-accent-soft: rgba(47, 107, 79, 0.12);
          --bk-gold: #9a7428;
          --bk-on-accent: #f5f3ee;
          --bk-wash:
            radial-gradient(ellipse 70% 50% at 8% 0%, rgba(47, 107, 79, 0.1), transparent 55%),
            radial-gradient(ellipse 55% 40% at 100% 100%, rgba(154, 116, 40, 0.07), transparent 50%),
            linear-gradient(180deg, #faf8f4 0%, #f5f3ee 48%, #efece5 100%);
          --bk-shadow: 0 18px 50px -28px rgba(26, 25, 21, 0.28);
        }

        :is(html.dark, .dark) .books-shell {
          --bk-bg: #2f3437;
          --bk-fg: hsla(0, 0%, 100%, 0.92);
          --bk-mute: hsla(0, 0%, 100%, 0.52);
          --bk-panel: rgba(55, 60, 65, 0.9);
          --bk-line: hsla(0, 0%, 100%, 0.12);
          --bk-line-soft: hsla(0, 0%, 100%, 0.07);
          --bk-accent: #7eb896;
          --bk-accent-soft: rgba(126, 184, 150, 0.16);
          --bk-gold: #d4b84a;
          --bk-on-accent: #1c211e;
          --bk-wash:
            radial-gradient(ellipse 65% 45% at 0% 0%, rgba(126, 184, 150, 0.1), transparent 52%),
            radial-gradient(ellipse 50% 35% at 100% 90%, rgba(212, 184, 74, 0.05), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 50%, #2c3134 100%);
          --bk-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--bk-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,var(--bk-bg)_92%)]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            BOOKS
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
