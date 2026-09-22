'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

export function StudioShell({
  fontVars,
  children,
}: {
  fontVars: string
  children: ReactNode
}) {
  return (
    <main
      className={`${fontVars} studio-shell relative min-h-screen overflow-x-clip bg-[var(--st-bg)] text-[var(--st-fg)]`}
    >
      <style>{`
        .studio-shell {
          --st-bg: #eef1f4;
          --st-fg: #12161c;
          --st-mute: rgba(18, 22, 28, 0.55);
          --st-panel: rgba(255, 255, 255, 0.82);
          --st-line: rgba(18, 22, 28, 0.1);
          --st-line-soft: rgba(18, 22, 28, 0.06);
          --st-accent: #0f766e;
          --st-accent-soft: rgba(15, 118, 110, 0.12);
          --st-warm: #b45309;
          --st-on-accent: #f4fbfa;
          --st-wash:
            radial-gradient(ellipse 68% 48% at 12% -4%, rgba(15, 118, 110, 0.14), transparent 55%),
            radial-gradient(ellipse 50% 38% at 96% 100%, rgba(180, 83, 9, 0.08), transparent 50%),
            linear-gradient(180deg, #f5f7f9 0%, #eef1f4 48%, #e6eaef 100%);
          --st-shadow: 0 20px 52px -28px rgba(18, 22, 28, 0.3);
          --st-display: var(--font-st-display), Georgia, serif;
          --st-mark: var(--font-st-mark), system-ui, sans-serif;
          --st-mono: var(--font-st-mono), ui-monospace, monospace;
        }

        :is(html.dark, .dark) .studio-shell {
          --st-bg: #171a1f;
          --st-fg: hsla(0, 0%, 100%, 0.93);
          --st-mute: hsla(0, 0%, 100%, 0.52);
          --st-panel: rgba(32, 36, 42, 0.92);
          --st-line: hsla(0, 0%, 100%, 0.11);
          --st-line-soft: hsla(0, 0%, 100%, 0.06);
          --st-accent: #2dd4bf;
          --st-accent-soft: rgba(45, 212, 191, 0.14);
          --st-warm: #fbbf24;
          --st-on-accent: #0c1413;
          --st-wash:
            radial-gradient(ellipse 62% 44% at 8% 0%, rgba(45, 212, 191, 0.1), transparent 52%),
            radial-gradient(ellipse 48% 34% at 100% 92%, rgba(251, 191, 36, 0.05), transparent 48%),
            linear-gradient(180deg, #1b1f25 0%, #171a1f 52%, #14171c 100%);
          --st-shadow: 0 22px 56px -24px rgba(0, 0, 0, 0.55);
        }

        @keyframes st-shimmer {
          100% { transform: translateX(100%); }
        }

        @keyframes st-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes st-pulse-ring {
          0% { transform: scale(0.85); opacity: 0.55; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--st-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_18%,var(--st-bg)_94%)]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.045]"
          style={{
            backgroundImage:
              'linear-gradient(var(--st-fg) 1px, transparent 1px), linear-gradient(90deg, var(--st-fg) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            STUDIO
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
