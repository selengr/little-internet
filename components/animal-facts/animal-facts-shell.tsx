'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function AnimalFactsShell({
  fontVars,
  children,
}: {
  fontVars: string
  children: ReactNode
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <main
      data-af-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{ background: 'var(--af-bg)', color: 'var(--af-fg)' }}
    >
      <style>{`
        [data-af-theme="light"] {
          --af-bg: #e6e9ee;
          --af-fg: #10141a;
          --af-mute: rgba(16, 20, 26, 0.5);
          --af-panel: rgba(255, 255, 255, 0.55);
          --af-line: rgba(16, 20, 26, 0.12);
          --af-line-soft: rgba(16, 20, 26, 0.07);
          --af-cat: #3b6ea5;
          --af-cat-soft: rgba(59, 110, 165, 0.14);
          --af-dog: #c96b3c;
          --af-dog-soft: rgba(201, 107, 60, 0.14);
          --af-signal: #b8f000;
          --af-nav: rgba(230, 233, 238, 0.78);
          --af-on-fg: #e6e9ee;
          --af-wash: radial-gradient(ellipse 70% 50% at 0% 20%, rgba(59,110,165,0.16), transparent 55%),
                     radial-gradient(ellipse 60% 45% at 100% 80%, rgba(201,107,60,0.14), transparent 50%),
                     linear-gradient(165deg, #eef1f5 0%, #e6e9ee 45%, #d8dde5 100%);
        }
        [data-af-theme="dark"] {
          --af-bg: #0a0c10;
          --af-fg: #e8ecf2;
          --af-mute: rgba(232, 236, 242, 0.5);
          --af-panel: rgba(14, 18, 26, 0.75);
          --af-line: rgba(232, 236, 242, 0.12);
          --af-line-soft: rgba(232, 236, 242, 0.07);
          --af-cat: #6b9fd4;
          --af-cat-soft: rgba(107, 159, 212, 0.16);
          --af-dog: #e08a5a;
          --af-dog-soft: rgba(224, 138, 90, 0.16);
          --af-signal: #c8ff3d;
          --af-nav: rgba(10, 12, 16, 0.82);
          --af-on-fg: #0a0c10;
          --af-wash: radial-gradient(ellipse 65% 45% at 0% 15%, rgba(107,159,212,0.12), transparent 50%),
                     radial-gradient(ellipse 55% 40% at 100% 85%, rgba(224,138,90,0.1), transparent 50%),
                     linear-gradient(165deg, #0a0c10 0%, #0d1016 50%, #11151c 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--af-wash)' }} />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(var(--af-line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--af-line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '56px 56px',
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
            <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
              Facts
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-black/10 dark:border-white/20 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/30 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all tracking-wide cursor-pointer"
            >
              Back home
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pt-24 md:pt-28 pb-16 md:pb-20">{children}</div>
    </main>
  )
}
