'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { CryptoMarket } from '@/components/crypto-market'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function CryptoShell({ fontVars }: { fontVars: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <main
      data-crypto-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{ background: 'var(--cx-bg)', color: 'var(--cx-fg)' }}
    >
      <style>{`
        [data-crypto-theme="light"] {
          --cx-bg: #e9edf1;
          --cx-fg: #0b1016;
          --cx-mute: rgba(11, 16, 22, 0.48);
          --cx-panel: rgba(255, 255, 255, 0.55);
          --cx-line: rgba(11, 16, 22, 0.12);
          --cx-line-soft: rgba(11, 16, 22, 0.07);
          --cx-up: #1a7a4c;
          --cx-down: #c23b2e;
          --cx-signal: #b8f000;
          --cx-signal-ink: #0b1016;
          --cx-nav: rgba(233, 237, 241, 0.78);
          --cx-tape: rgba(11, 16, 22, 0.04);
          --cx-wash: radial-gradient(ellipse 90% 55% at 0% 0%, rgba(184,240,0,0.18), transparent 50%),
                     radial-gradient(ellipse 70% 50% at 100% 100%, rgba(11,16,22,0.08), transparent 55%),
                     linear-gradient(165deg, #eef2f5 0%, #e9edf1 40%, #dfe5eb 100%);
        }
        [data-crypto-theme="dark"] {
          --cx-bg: #07090c;
          --cx-fg: #e8ecef;
          --cx-mute: rgba(232, 236, 239, 0.48);
          --cx-panel: rgba(16, 20, 26, 0.72);
          --cx-line: rgba(232, 236, 239, 0.12);
          --cx-line-soft: rgba(232, 236, 239, 0.07);
          --cx-up: #3dd68c;
          --cx-down: #ff6b5a;
          --cx-signal: #c8ff3d;
          --cx-signal-ink: #07090c;
          --cx-nav: rgba(7, 9, 12, 0.82);
          --cx-tape: rgba(232, 236, 239, 0.04);
          --cx-wash: radial-gradient(ellipse 80% 50% at 8% 0%, rgba(200,255,61,0.1), transparent 50%),
                     radial-gradient(ellipse 60% 45% at 100% 90%, rgba(61,214,140,0.06), transparent 50%),
                     linear-gradient(165deg, #07090c 0%, #0b0e13 50%, #0e1218 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--cx-wash)' }} />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(var(--cx-line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--cx-line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--cx-tape) 2px, var(--cx-tape) 3px)',
          }}
        />
      </div>

      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl">
          <div
            className={`flex items-center justify-between px-5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
            style={NAV_GLASS}
          >
            <ThemeToggle />
            <span className="inline-flex items-center gap-2 font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--cx-up)] opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--cx-up)]" />
              </span>
              Crypto
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all duration-200 tracking-wide"
            >
              Back home
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-16 md:pt-28">
        <CryptoMarket />
      </div>
    </main>
  )
}
