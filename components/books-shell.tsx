'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function BooksShell({
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
      data-bk-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{ background: 'var(--bk-bg)', color: 'var(--bk-fg)' }}
    >
      <style>{`
        [data-bk-theme="light"] {
          --bk-bg: #e8ebe4;
          --bk-fg: #141814;
          --bk-mute: rgba(20, 24, 20, 0.5);
          --bk-panel: rgba(255, 255, 255, 0.55);
          --bk-line: rgba(20, 24, 20, 0.12);
          --bk-line-soft: rgba(20, 24, 20, 0.07);
          --bk-accent: #2f6b4f;
          --bk-accent-soft: rgba(47, 107, 79, 0.14);
          --bk-gold: #9a7b2f;
          --bk-nav: rgba(232, 235, 228, 0.78);
          --bk-on-accent: #f4f6f1;
          --bk-wash: radial-gradient(ellipse 80% 55% at 0% 0%, rgba(47,107,79,0.16), transparent 52%),
                     radial-gradient(ellipse 60% 45% at 100% 100%, rgba(154,123,47,0.1), transparent 50%),
                     linear-gradient(165deg, #eef1ea 0%, #e8ebe4 45%, #dce1d7 100%);
        }
        [data-bk-theme="dark"] {
          --bk-bg: #0c0e0c;
          --bk-fg: #e8ebe4;
          --bk-mute: rgba(232, 235, 228, 0.5);
          --bk-panel: rgba(18, 22, 18, 0.75);
          --bk-line: rgba(232, 235, 228, 0.12);
          --bk-line-soft: rgba(232, 235, 228, 0.07);
          --bk-accent: #5a9e78;
          --bk-accent-soft: rgba(90, 158, 120, 0.16);
          --bk-gold: #d4b84a;
          --bk-nav: rgba(12, 14, 12, 0.82);
          --bk-on-accent: #0c0e0c;
          --bk-wash: radial-gradient(ellipse 75% 50% at 0% 0%, rgba(90,158,120,0.12), transparent 50%),
                     radial-gradient(ellipse 55% 40% at 100% 90%, rgba(212,184,74,0.06), transparent 50%),
                     linear-gradient(165deg, #0c0e0c 0%, #101310 50%, #141814 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--bk-wash)' }} />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `
              linear-gradient(var(--bk-line-soft) 1px, transparent 1px),
              linear-gradient(90deg, var(--bk-line-soft) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 48px, var(--bk-accent-soft) 48px, var(--bk-accent-soft) 49px)',
          }}
        />
      </div>

      <div className="fixed top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl">
          <div
            className={`flex items-center justify-between px-5 py-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] ${NAV_GLASS_CLASS}`}
            style={NAV_GLASS}
          >
            <ThemeToggle />
            <span className="font-pixel text-[10px] tracking-[0.2em] text-black/50 dark:text-white/50 hidden sm:inline">
              Books
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

      <div className="pt-24 md:pt-28 pb-20 md:pb-24">{children}</div>
    </main>
  )
}
