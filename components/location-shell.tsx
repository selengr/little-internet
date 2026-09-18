'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserLocationFinder } from '@/components/user-location-finder'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'



export function LocationShell({
  fontVars,
}: {
  fontVars: string
}) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <main
      data-loc-theme={isDark ? 'dark' : 'light'}
      className={`${fontVars} relative min-h-screen overflow-x-clip`}
      style={{
        background: 'var(--loc-bg)',
        color: 'var(--loc-fg)',
      }}
    >
      <style>{`
        [data-loc-theme="light"] {
          --loc-bg: #e8f0ed;
          --loc-fg: #0e1c24;
          --loc-fg-mute: rgba(14, 28, 36, 0.5);
          --loc-paper: rgba(212, 224, 220, 0.65);
          --loc-signal: #0d8f7f;
          --loc-signal-soft: rgba(13, 143, 127, 0.2);
          --loc-line: rgba(14, 28, 36, 0.14);
          --loc-line-soft: rgba(14, 28, 36, 0.08);
          --loc-on-signal: #ffffff;
          --loc-nav-bg: rgba(232, 240, 237, 0.72);
          --loc-grid: rgba(14, 28, 36, 0.04);
          --loc-topo: rgba(14, 28, 36, 0.05);
          --loc-wash: radial-gradient(ellipse 90% 60% at 10% -10%, rgba(13,143,127,0.22), transparent 55%),
                      radial-gradient(ellipse 70% 50% at 100% 100%, rgba(14,28,36,0.12), transparent 50%),
                      linear-gradient(165deg, #e8f0ed 0%, #d4e0dc 45%, #c5d4cf 100%);
        }
        [data-loc-theme="dark"] {
          --loc-bg: #071216;
          --loc-fg: #e4efeb;
          --loc-fg-mute: rgba(228, 239, 235, 0.5);
          --loc-paper: rgba(12, 28, 34, 0.78);
          --loc-signal: #2dd4bf;
          --loc-signal-soft: rgba(45, 212, 191, 0.22);
          --loc-line: rgba(228, 239, 235, 0.14);
          --loc-line-soft: rgba(228, 239, 235, 0.08);
          --loc-on-signal: #071216;
          --loc-nav-bg: rgba(7, 18, 22, 0.82);
          --loc-grid: rgba(228, 239, 235, 0.05);
          --loc-topo: rgba(45, 212, 191, 0.07);
          --loc-wash: radial-gradient(ellipse 80% 55% at 15% 0%, rgba(45,212,191,0.14), transparent 55%),
                      radial-gradient(ellipse 60% 45% at 95% 85%, rgba(13,143,127,0.1), transparent 50%),
                      linear-gradient(165deg, #071216 0%, #0a1a20 50%, #0c2228 100%);
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: 'var(--loc-wash)' }} />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              repeating-radial-gradient(
                circle at 30% 40%,
                transparent 0,
                transparent 28px,
                var(--loc-topo) 28px,
                var(--loc-topo) 29px
              )
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(var(--loc-grid) 1px, transparent 1px),
              linear-gradient(90deg, var(--loc-grid) 1px, transparent 1px)
            `,
            backgroundSize: '72px 72px',
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
              Location
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
        <UserLocationFinder />
      </div>
    </main>
  )
}
