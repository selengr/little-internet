'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { DeskView } from '@/components/desk/desk-view'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'

function DeskFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-5">
      <div className="h-28 rounded-xl bg-white/[0.04] animate-pulse mb-3" />
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-2 h-[420px] rounded-xl bg-white/[0.04] animate-pulse" />
        <div className="col-span-12 lg:col-span-7 h-[420px] rounded-xl bg-white/[0.04] animate-pulse" />
        <div className="col-span-12 lg:col-span-3 h-[420px] rounded-xl bg-white/[0.04] animate-pulse" />
      </div>
    </div>
  )
}

export function DeskShell({ fontVars }: { fontVars: string }) {
  return (
    <main
      className={`${fontVars} desk-shell relative min-h-screen overflow-x-clip bg-[#0b0e11] text-white`}
    >
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[#0b0e11]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,197,94,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(56,189,248,0.05),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-3 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-5xl flex items-center justify-between px-4 py-2 rounded-2xl border border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <div className="hidden sm:flex flex-col items-center leading-tight">
            <span className="font-pixel text-[10px] tracking-[0.22em] text-white/55">DESK</span>
            <span className="text-[9px] tracking-[0.14em] uppercase text-white/30">
              Pro market analysis
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-all duration-200 tracking-wide"
          >
            Back home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="pt-20 pb-10 md:pt-24">
        <Suspense fallback={<DeskFallback />}>
          <DeskView />
        </Suspense>
      </div>
    </main>
  )
}
