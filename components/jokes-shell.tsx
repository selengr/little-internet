'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function JokesShell({
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
      data-jk-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{ background: 'var(--jk-bg)', color: 'var(--jk-fg)' }}
    >
      <style>{`
        [data-jk-theme="light"] {
          --jk-bg: #e8e9ed;
          --jk-fg: #12141a;
          --jk-mute: rgba(18, 20, 26, 0.52);
          --jk-panel: rgba(255, 255, 255, 0.58);
          --jk-line: rgba(18, 20, 26, 0.12);
          --jk-line-soft: rgba(18, 20, 26, 0.07);
          --jk-hot: #e23d2d;
          --jk-hot-soft: rgba(226, 61, 45, 0.14);
          --jk-cue: #c8ff3d;
          --jk-nav: rgba(232, 233, 237, 0.78);
          --jk-on-fg: #e8e9ed;
          --jk-stage: #16181f;
          --jk-stage-fg: #f2f3f6;
          --jk-wash: radial-gradient(ellipse 70% 50% at 85% 0%, rgba(226,61,45,0.14), transparent 55%),
                     radial-gradient(ellipse 55% 40% at 0% 100%, rgba(200,255,61,0.1), transparent 50%),
                     linear-gradient(165deg, #f0f1f4 0%, #e8e9ed 45%, #dbdde4 100%);
        }
        [data-jk-theme="dark"] {
          --jk-bg: #0a0b0e;
          --jk-fg: #eceef2;
          --jk-mute: rgba(236, 238, 242, 0.5);
          --jk-panel: rgba(16, 18, 24, 0.78);
          --jk-line: rgba(236, 238, 242, 0.12);
          --jk-line-soft: rgba(236, 238, 242, 0.07);
          --jk-hot: #ff6b5a;
          --jk-hot-soft: rgba(255, 107, 90, 0.16);
          --jk-cue: #d4ff4d;
          --jk-nav: rgba(10, 11, 14, 0.82);
          --jk-on-fg: #0a0b0e;
          --jk-stage: #12141a;
          --jk-stage-fg: #f2f3f6;
          --jk-wash: radial-gradient(ellipse 65% 45% at 90% 0%, rgba(255,107,90,0.12), transparent 50%),
                     radial-gradient(ellipse 50% 40% at 0% 90%, rgba(212,255,77,0.06), transparent 50%),
                     linear-gradient(165deg, #0a0b0e 0%, #0d0f14 50%, #12151c 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--jk-wash)' }} />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(var(--jk-line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--jk-line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
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
              Jokes
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
