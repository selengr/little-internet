'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { GoldView } from '@/components/gold/gold-view'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

/** Same chrome as crypto — shared tokens + glass header. */
export function GoldShell({ fontVars }: { fontVars: string }) {
  return (
    <main
      className={`${fontVars} crypto-shell gold-shell relative min-h-screen overflow-x-clip bg-[var(--cx-bg)] text-[var(--cx-fg)]`}
    >
      <style>{`
        .crypto-shell {
          --cx-bg: #f3f5f7;
          --cx-fg: #10141a;
          --cx-mute: rgba(16, 20, 26, 0.52);
          --cx-panel: rgba(255, 255, 255, 0.8);
          --cx-line: rgba(16, 20, 26, 0.11);
          --cx-line-soft: rgba(16, 20, 26, 0.06);
          --cx-up: #1a7a4c;
          --cx-down: #c23b2e;
          --cx-signal: #c4a35a;
          --cx-signal-ink: #10141a;
          --cx-tape: rgba(16, 20, 26, 0.035);
          --cx-wash:
            radial-gradient(ellipse 70% 48% at 0% 0%, rgba(196, 163, 90, 0.14), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 100%, rgba(16, 20, 26, 0.05), transparent 50%),
            linear-gradient(180deg, #f8fafb 0%, #f3f5f7 50%, #ebeef2 100%);
          --cx-shadow: 0 18px 50px -28px rgba(16, 20, 26, 0.28);
        }

        :is(html.dark, .dark) .crypto-shell {
          --cx-bg: #2f3437;
          --cx-fg: hsla(0, 0%, 100%, 0.92);
          --cx-mute: hsla(0, 0%, 100%, 0.52);
          --cx-panel: rgba(55, 60, 65, 0.9);
          --cx-line: hsla(0, 0%, 100%, 0.12);
          --cx-line-soft: hsla(0, 0%, 100%, 0.07);
          --cx-up: #3dd68c;
          --cx-down: #ff6b5a;
          --cx-signal: #d4af5f;
          --cx-signal-ink: #1a1e22;
          --cx-tape: hsla(0, 0%, 100%, 0.04);
          --cx-wash:
            radial-gradient(ellipse 65% 45% at 0% 0%, rgba(212, 175, 95, 0.1), transparent 52%),
            radial-gradient(ellipse 50% 35% at 100% 90%, rgba(61, 214, 140, 0.04), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 50%, #2c3134 100%);
          --cx-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--cx-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_20%,var(--cx-bg)_92%)]" />
      </div>

      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="inline-flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--cx-up)] opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--cx-up)]" />
            </span>
            XAU DESK
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
        <GoldView />
      </div>
    </main>
  )
}
