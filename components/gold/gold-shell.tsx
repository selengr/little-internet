'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { GoldView } from '@/components/gold/gold-view'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function GoldShell({ fontVars }: { fontVars: string }) {
  return (
    <main
      className={`${fontVars} gold-shell relative min-h-screen overflow-x-clip bg-[var(--gd-bg)] text-[var(--gd-fg)]`}
    >
      <style>{`
        .gold-shell {
          --gd-bg: #f7f5f1;
          --gd-fg: #1c1916;
          --gd-mute: rgba(28, 25, 22, 0.5);
          --gd-line: rgba(28, 25, 22, 0.1);
          --gd-panel: rgba(255, 252, 247, 0.72);
          --gd-metal: #9a7b3c;
          --gd-metal-soft: rgba(154, 123, 60, 0.14);
          --gd-up: #2f6b45;
          --gd-down: #a53d32;
          --gd-wash:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212, 175, 95, 0.22), transparent 55%),
            radial-gradient(ellipse 45% 35% at 100% 80%, rgba(154, 123, 60, 0.08), transparent 50%),
            linear-gradient(180deg, #faf8f4 0%, #f7f5f1 45%, #f0ebe3 100%);
        }
        :is(html.dark, .dark) .gold-shell {
          --gd-bg: #2f3437;
          --gd-fg: hsla(0, 0%, 100%, 0.92);
          --gd-mute: hsla(0, 0%, 100%, 0.5);
          --gd-line: hsla(0, 0%, 100%, 0.1);
          --gd-panel: rgba(55, 60, 64, 0.78);
          --gd-metal: #d4af5f;
          --gd-metal-soft: rgba(212, 175, 95, 0.12);
          --gd-up: #3dd68c;
          --gd-down: #ff6b5a;
          --gd-wash:
            radial-gradient(ellipse 70% 45% at 50% -8%, rgba(212, 175, 95, 0.14), transparent 52%),
            radial-gradient(ellipse 40% 30% at 0% 100%, rgba(212, 175, 95, 0.05), transparent 48%),
            linear-gradient(180deg, #32383b 0%, #2f3437 55%, #2c3134 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--gd-wash)' }} />
      </div>

      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="inline-flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--gd-metal)] opacity-55" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--gd-metal)]" />
            </span>
            GOLD
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

      <div className="pt-24 pb-8 md:pt-28">
        <GoldView />
      </div>
    </main>
  )
}
