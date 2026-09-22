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
        /* Light — sunlit control room */
        .studio-shell {
          --st-bg: #f3eee6;
          --st-fg: #1c1712;
          --st-mute: rgba(28, 23, 18, 0.55);
          --st-panel: rgba(255, 252, 247, 0.92);
          --st-line: rgba(28, 23, 18, 0.1);
          --st-line-soft: rgba(28, 23, 18, 0.06);
          --st-accent: #c4842d;
          --st-accent-soft: rgba(196, 132, 45, 0.14);
          --st-signal: #0d8f7f;
          --st-warm: #c2410c;
          --st-on-accent: #fffaf3;
          --st-rack: #ebe4d8;
          --st-foam: rgba(28, 23, 18, 0.045);
          --st-spot: rgba(196, 132, 45, 0.16);
          --st-floor: #e8e0d4;
          --st-nav-bg: rgba(255, 252, 247, 0.78);
          --st-nav-border: rgba(28, 23, 18, 0.08);
          --st-on-air-bg: rgba(194, 65, 12, 0.1);
          --st-on-air-border: rgba(194, 65, 12, 0.22);
          --st-on-air-dot: #dc2626;
          --st-on-air-text: #b91c1c;
          --st-thumb: #2a241e;
          --st-rail: #c4842d;
          --st-wash:
            radial-gradient(ellipse 80% 50% at 50% -8%, rgba(196, 132, 45, 0.14), transparent 55%),
            radial-gradient(ellipse 48% 38% at 100% 85%, rgba(13, 143, 127, 0.07), transparent 50%),
            radial-gradient(ellipse 42% 32% at 0% 55%, rgba(196, 132, 45, 0.06), transparent 48%),
            linear-gradient(180deg, #faf6f0 0%, #f3eee6 48%, #ebe3d7 100%);
          --st-shadow: 0 24px 56px -30px rgba(28, 23, 18, 0.28);
          --st-display: var(--font-st-display), Georgia, serif;
          --st-mark: var(--font-st-mark), system-ui, sans-serif;
          --st-mono: var(--font-st-mono), ui-monospace, monospace;
        }

        /* Dark — night booth */
        :is(html.dark, .dark) .studio-shell {
          --st-bg: #1a1714;
          --st-fg: #f3ebe1;
          --st-mute: rgba(243, 235, 225, 0.55);
          --st-panel: rgba(36, 31, 27, 0.92);
          --st-line: rgba(243, 235, 225, 0.12);
          --st-line-soft: rgba(243, 235, 225, 0.06);
          --st-accent: #e8a54b;
          --st-accent-soft: rgba(232, 165, 75, 0.16);
          --st-signal: #3dd6c3;
          --st-warm: #ff7a59;
          --st-on-accent: #1a140c;
          --st-rack: #12100e;
          --st-foam: rgba(243, 235, 225, 0.04);
          --st-spot: rgba(232, 165, 75, 0.18);
          --st-floor: #0c0a09;
          --st-nav-bg: rgba(20, 17, 14, 0.72);
          --st-nav-border: rgba(243, 235, 225, 0.1);
          --st-on-air-bg: rgba(255, 90, 70, 0.12);
          --st-on-air-border: rgba(255, 90, 70, 0.28);
          --st-on-air-dot: #ff6b5a;
          --st-on-air-text: #fecaca;
          --st-thumb: #0b0e12;
          --st-rail: #e8a54b;
          --st-wash:
            radial-gradient(ellipse 80% 55% at 50% -10%, rgba(232, 165, 75, 0.14), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 80%, rgba(61, 214, 195, 0.06), transparent 50%),
            radial-gradient(ellipse 45% 35% at 0% 60%, rgba(232, 165, 75, 0.05), transparent 48%),
            linear-gradient(180deg, #221e1a 0%, #1a1714 45%, #141210 100%);
          --st-shadow: 0 28px 64px -28px rgba(0, 0, 0, 0.72);
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

        @keyframes st-listen {
          0%, 100% { height: 22%; opacity: 0.45; }
          50% { height: 100%; opacity: 1; }
        }

        @keyframes st-soft-breathe {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes st-on-air {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 color-mix(in srgb, var(--st-on-air-dot) 45%, transparent); }
          50% { opacity: 0.72; box-shadow: 0 0 14px 2px color-mix(in srgb, var(--st-on-air-dot) 30%, transparent); }
        }

        @keyframes st-vu {
          0%, 100% { transform: scaleX(0.35); }
          40% { transform: scaleX(0.92); }
          70% { transform: scaleX(0.55); }
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: 'var(--st-wash)' }} />

        <div
          className="absolute inset-y-0 left-0 w-[min(18vw,9rem)] opacity-40 dark:opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(135deg, var(--st-foam) 25%, transparent 25%),
              linear-gradient(225deg, var(--st-foam) 25%, transparent 25%),
              linear-gradient(45deg, var(--st-foam) 25%, transparent 25%),
              linear-gradient(315deg, var(--st-foam) 25%, transparent 25%)
            `,
            backgroundSize: '22px 22px',
            backgroundPosition: '0 0, 0 11px, 11px -11px, -11px 0',
            maskImage: 'linear-gradient(90deg, black, transparent)',
          }}
        />
        <div
          className="absolute inset-y-0 right-0 w-[min(18vw,9rem)] opacity-40 dark:opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(135deg, var(--st-foam) 25%, transparent 25%),
              linear-gradient(225deg, var(--st-foam) 25%, transparent 25%),
              linear-gradient(45deg, var(--st-foam) 25%, transparent 25%),
              linear-gradient(315deg, var(--st-foam) 25%, transparent 25%)
            `,
            backgroundSize: '22px 22px',
            backgroundPosition: '0 0, 0 11px, 11px -11px, -11px 0',
            maskImage: 'linear-gradient(270deg, black, transparent)',
          }}
        />

        <div
          className="absolute left-1/2 top-0 h-[22rem] w-[36rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--st-spot), transparent 68%)',
            animation: 'st-soft-breathe 8s ease-in-out infinite',
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 110%, transparent 22%, var(--st-floor) 92%)',
            opacity: 0.55,
          }}
        />

        <div className="absolute bottom-[18%] left-[4%] hidden flex-col gap-1.5 opacity-35 lg:flex dark:opacity-40">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-1 w-16 origin-left rounded-full bg-[color:var(--st-signal)]/80"
              style={{ animation: `st-vu ${1.1 + (i % 4) * 0.25}s ease-in-out ${i * 0.08}s infinite` }}
            />
          ))}
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 opacity-90"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--st-rack) 18%, var(--st-accent) 50%, var(--st-rack) 82%, transparent)',
        }}
      />

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border ${NAV_GLASS_CLASS}`}
          style={{
            ...NAV_GLASS,
            background: 'var(--st-nav-bg)',
            borderColor: 'var(--st-nav-border)',
          }}
        >
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3 min-w-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1"
              style={{
                background: 'var(--st-on-air-bg)',
                borderColor: 'var(--st-on-air-border)',
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{
                  background: 'var(--st-on-air-dot)',
                  animation: 'st-on-air 1.6s ease-in-out infinite',
                }}
              />
              <span
                className="text-[9px] font-bold tracking-[0.22em]"
                style={{ fontFamily: 'var(--st-mono)', color: 'var(--st-on-air-text)' }}
              >
                ON AIR
              </span>
            </span>
            <span
              className="truncate text-[10px] tracking-[0.28em] text-[color:var(--st-mute)]"
              style={{ fontFamily: 'var(--st-mono)' }}
            >
              MAGIC STUDIO
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-[color:var(--st-line)] text-[color:var(--st-mute)] hover:text-[color:var(--st-fg)] hover:border-[color:var(--st-accent)]/35 hover:bg-[color:var(--st-accent-soft)] transition-all duration-200 tracking-wide shrink-0"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Leave studio
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="relative pt-24 md:pt-28 pb-20 md:pb-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-20 mx-auto hidden h-[calc(100%-5rem)] max-w-4xl md:block"
          aria-hidden
        >
          <div className="absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-[color:var(--st-accent)]/30 to-transparent" />
          <div className="absolute inset-y-8 right-0 w-px bg-gradient-to-b from-transparent via-[color:var(--st-accent)]/30 to-transparent" />
        </div>
        {children}
      </div>
    </main>
  )
}
