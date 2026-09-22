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
          --st-bg: #e8edf2;
          --st-fg: #0f1419;
          --st-mute: rgba(15, 20, 25, 0.56);
          --st-panel: rgba(255, 255, 255, 0.86);
          --st-line: rgba(15, 20, 25, 0.1);
          --st-line-soft: rgba(15, 20, 25, 0.06);
          --st-accent: #0d7377;
          --st-accent-soft: rgba(13, 115, 119, 0.12);
          --st-warm: #c2410c;
          --st-on-accent: #f2fbfb;
          --st-wash:
            radial-gradient(ellipse 72% 50% at 8% -6%, rgba(13, 115, 119, 0.16), transparent 56%),
            radial-gradient(ellipse 46% 36% at 100% 8%, rgba(194, 65, 12, 0.06), transparent 48%),
            radial-gradient(ellipse 52% 40% at 90% 100%, rgba(13, 115, 119, 0.07), transparent 52%),
            linear-gradient(180deg, #f2f5f8 0%, #e8edf2 46%, #dde4eb 100%);
          --st-shadow: 0 22px 56px -30px rgba(15, 20, 25, 0.32);
          --st-display: var(--font-st-display), Georgia, serif;
          --st-mark: var(--font-st-mark), system-ui, sans-serif;
          --st-mono: var(--font-st-mono), ui-monospace, monospace;
        }

        :is(html.dark, .dark) .studio-shell {
          --st-bg: #14181e;
          --st-fg: hsla(0, 0%, 100%, 0.94);
          --st-mute: hsla(0, 0%, 100%, 0.52);
          --st-panel: rgba(28, 33, 40, 0.94);
          --st-line: hsla(0, 0%, 100%, 0.11);
          --st-line-soft: hsla(0, 0%, 100%, 0.06);
          --st-accent: #2ec4b6;
          --st-accent-soft: rgba(46, 196, 182, 0.14);
          --st-warm: #fb923c;
          --st-on-accent: #071112;
          --st-wash:
            radial-gradient(ellipse 64% 46% at 6% -2%, rgba(46, 196, 182, 0.12), transparent 54%),
            radial-gradient(ellipse 42% 32% at 100% 6%, rgba(251, 146, 60, 0.05), transparent 46%),
            radial-gradient(ellipse 48% 36% at 88% 100%, rgba(46, 196, 182, 0.05), transparent 50%),
            linear-gradient(180deg, #181d24 0%, #14181e 52%, #10141a 100%);
          --st-shadow: 0 24px 60px -26px rgba(0, 0, 0, 0.58);
        }

        @keyframes st-shimmer {
          100% { transform: translateX(100%); }
        }

        @keyframes st-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes st-pulse-ring {
          0% { transform: scale(0.88); opacity: 0.5; box-shadow: 0 0 0 0 color-mix(in srgb, var(--st-accent) 45%, transparent); }
          70% { transform: scale(1.28); opacity: 0; box-shadow: 0 0 0 10px transparent; }
          100% { opacity: 0; }
        }

        @keyframes st-wave {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }

        @keyframes st-glow-in {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--st-wash)' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_16%,var(--st-bg)_94%)]" />
        {/* Quiet waveform atmosphere — studio identity without clutter */}
        <svg
          className="absolute left-1/2 top-[18%] h-24 w-[min(92vw,42rem)] -translate-x-1/2 opacity-[0.07] dark:opacity-[0.1]"
          viewBox="0 0 640 96"
          fill="none"
          aria-hidden
        >
          {Array.from({ length: 48 }).map((_, i) => {
            const x = 8 + i * 13
            const h = 12 + ((i * 17) % 53)
            return (
              <rect
                key={i}
                x={x}
                y={(96 - h) / 2}
                width="5"
                height={h}
                rx="2.5"
                fill="currentColor"
                className="text-[color:var(--st-accent)]"
                style={{
                  transformOrigin: `${x + 2.5}px 48px`,
                  animation: `st-wave ${1.4 + (i % 5) * 0.18}s ease-in-out ${i * 0.04}s infinite`,
                }}
              />
            )
          })}
        </svg>
        <div
          className="absolute inset-0 opacity-[0.028] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(var(--st-fg) 1px, transparent 1px), linear-gradient(90deg, var(--st-fg) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between px-4 py-2.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <span className="inline-flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--st-accent)] opacity-55" />
              <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--st-accent)]" />
            </span>
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
