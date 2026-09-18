'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { ForexMarket } from '@/components/forex-market'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function ForexShell({ fontVars }: { fontVars: string }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <main
      data-fx-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{ background: 'var(--fx-bg)', color: 'var(--fx-fg)' }}
    >
      <style>{`
        [data-fx-theme="light"] {
          --fx-bg: #e4e9ef;
          --fx-fg: #0f1724;
          --fx-mute: rgba(15, 23, 36, 0.5);
          --fx-panel: rgba(255, 255, 255, 0.52);
          --fx-line: rgba(15, 23, 36, 0.12);
          --fx-line-soft: rgba(15, 23, 36, 0.07);
          --fx-up: #0d7a56;
          --fx-down: #b93a2f;
          --fx-accent: #1f6feb;
          --fx-accent-soft: rgba(31, 111, 235, 0.14);
          --fx-nav: rgba(228, 233, 239, 0.78);
          --fx-on-accent: #ffffff;
          --fx-wash: radial-gradient(ellipse 85% 55% at 100% 0%, rgba(31,111,235,0.16), transparent 52%),
                     radial-gradient(ellipse 60% 45% at 0% 100%, rgba(15,23,36,0.08), transparent 50%),
                     linear-gradient(165deg, #eef2f6 0%, #e4e9ef 45%, #d7dee8 100%);
        }
        [data-fx-theme="dark"] {
          --fx-bg: #080b11;
          --fx-fg: #e7ecf3;
          --fx-mute: rgba(231, 236, 243, 0.5);
          --fx-panel: rgba(14, 18, 28, 0.75);
          --fx-line: rgba(231, 236, 243, 0.12);
          --fx-line-soft: rgba(231, 236, 243, 0.07);
          --fx-up: #3ecf8e;
          --fx-down: #ff6b5a;
          --fx-accent: #5b9dff;
          --fx-accent-soft: rgba(91, 157, 255, 0.16);
          --fx-nav: rgba(8, 11, 17, 0.82);
          --fx-on-accent: #080b11;
          --fx-wash: radial-gradient(ellipse 80% 50% at 100% 0%, rgba(91,157,255,0.12), transparent 50%),
                     radial-gradient(ellipse 55% 40% at 0% 100%, rgba(62,207,142,0.06), transparent 50%),
                     linear-gradient(165deg, #080b11 0%, #0b1018 50%, #0e1420 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--fx-wash)' }} />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(var(--fx-line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--fx-line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(-12deg, transparent, transparent 40px, var(--fx-accent-soft) 40px, var(--fx-accent-soft) 41px)',
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
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[color:var(--fx-up)] opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[color:var(--fx-up)]" />
              </span>
              Forex
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
        <ForexMarket />
      </div>
    </main>
  )
}
