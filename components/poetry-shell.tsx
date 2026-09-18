'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function PoetryShell({
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
      data-py-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{ background: 'var(--py-bg)', color: 'var(--py-fg)' }}
    >
      <style>{`
        [data-py-theme="light"] {
          --py-bg: #e7e8ec;
          --py-fg: #14161c;
          --py-mute: rgba(20, 22, 28, 0.52);
          --py-panel: rgba(255, 255, 255, 0.55);
          --py-line: rgba(20, 22, 28, 0.12);
          --py-line-soft: rgba(20, 22, 28, 0.07);
          --py-accent: #9b2d3a;
          --py-accent-soft: rgba(155, 45, 58, 0.12);
          --py-cue: #c8ff3d;
          --py-nav: rgba(231, 232, 236, 0.78);
          --py-on-fg: #e7e8ec;
          --py-paper: #f4f5f7;
          --py-wash: radial-gradient(ellipse 65% 45% at 10% 0%, rgba(155,45,58,0.12), transparent 55%),
                     radial-gradient(ellipse 50% 40% at 100% 80%, rgba(20,22,28,0.05), transparent 50%),
                     linear-gradient(165deg, #eff0f3 0%, #e7e8ec 45%, #d9dbe2 100%);
        }
        [data-py-theme="dark"] {
          --py-bg: #0a0b0e;
          --py-fg: #eceef2;
          --py-mute: rgba(236, 238, 242, 0.5);
          --py-panel: rgba(16, 18, 24, 0.78);
          --py-line: rgba(236, 238, 242, 0.12);
          --py-line-soft: rgba(236, 238, 242, 0.07);
          --py-accent: #e85a6b;
          --py-accent-soft: rgba(232, 90, 107, 0.14);
          --py-cue: #d4ff4d;
          --py-nav: rgba(10, 11, 14, 0.82);
          --py-on-fg: #0a0b0e;
          --py-paper: #12141a;
          --py-wash: radial-gradient(ellipse 60% 40% at 5% 0%, rgba(232,90,107,0.1), transparent 50%),
                     radial-gradient(ellipse 45% 35% at 100% 90%, rgba(212,255,77,0.04), transparent 50%),
                     linear-gradient(165deg, #0a0b0e 0%, #0d0f14 50%, #12151c 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--py-wash)' }} />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: `
              linear-gradient(var(--py-line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--py-line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '52px 52px',
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
              Poetry
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
