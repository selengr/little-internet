'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { ForexMarket } from '@/components/forex-market'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function ForexShell({ fontVars }: { fontVars: string }) {
  return (
    <main
      className={`${fontVars} forex-shell relative min-h-screen overflow-x-clip bg-[var(--fx-bg)] text-[var(--fx-fg)]`}
    >
      <style>{`
        .forex-shell {
          --fx-bg: #f2f4f8;
          --fx-fg: #101722;
          --fx-mute: rgba(16, 23, 34, 0.52);
          --fx-panel: rgba(255, 255, 255, 0.8);
          --fx-line: rgba(16, 23, 34, 0.11);
          --fx-line-soft: rgba(16, 23, 34, 0.06);
          --fx-up: #0d7a56;
          --fx-down: #b93a2f;
          --fx-accent: #1f6feb;
          --fx-accent-soft: rgba(31, 111, 235, 0.12);
          --fx-on-accent: #ffffff;
          --fx-wash:
            radial-gradient(ellipse 70% 48% at 100% 0%, rgba(31, 111, 235, 0.11), transparent 55%),
            radial-gradient(ellipse 50% 40% at 0% 100%, rgba(16, 23, 34, 0.05), transparent 50%),
            linear-gradient(180deg, #f7f9fc 0%, #f2f4f8 50%, #eaedf3 100%);
          --fx-shadow: 0 18px 50px -28px rgba(16, 23, 34, 0.28);
        }

        :is(html.dark, .dark) .forex-shell {
          --fx-bg: #282d36;
          --fx-fg: hsla(0, 0%, 100%, 0.92);
          --fx-mute: hsla(0, 0%, 100%, 0.52);
          --fx-panel: rgba(50, 56, 66, 0.9);
          --fx-line: hsla(0, 0%, 100%, 0.12);
          --fx-line-soft: hsla(0, 0%, 100%, 0.07);
          --fx-up: #3ecf8e;
          --fx-down: #ff6b5a;
          --fx-accent: #5b9dff;
          --fx-accent-soft: rgba(91, 157, 255, 0.16);
          --fx-on-accent: #1a1f28;
          --fx-wash:
            radial-gradient(ellipse 65% 45% at 100% 0%, rgba(91, 157, 255, 0.1), transparent 52%),
            radial-gradient(ellipse 50% 35% at 0% 100%, rgba(62, 207, 142, 0.05), transparent 48%),
            linear-gradient(180deg, #2e343e 0%, #282d36 50%, #242932 100%);
          --fx-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--fx-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,var(--fx-bg)_92%)]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="inline-flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--fx-up)] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--fx-up)]" />
            </span>
            CONVERT
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

      <div className="pt-24 pb-16 md:pt-28">
        <ForexMarket />
      </div>
    </main>
  )
}
