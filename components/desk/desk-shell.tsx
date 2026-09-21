'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { DeskView } from '@/components/desk/desk-view'
import { NAV_GLASS, NAV_GLASS_CLASS } from '@/lib/nav-glass'
import { cn } from '@/lib/utils'

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

const LINKS = [
  { href: '/desk', label: 'Desk' },
  { href: '/crypto', label: 'Crypto' },
  { href: '/convert', label: 'Convert' },
] as const

function DeskNavLinks() {
  const pathname = usePathname()
  return (
    <nav className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-black/20 p-0.5">
      {LINKS.map(link => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] transition-colors',
              active ? 'bg-white text-stone-900' : 'text-white/45 hover:text-white',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
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
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="fixed top-3 inset-x-0 z-50 flex justify-center px-3 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-5xl flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border border-white/[0.08] ${NAV_GLASS_CLASS}`}
          style={NAV_GLASS}
        >
          <ThemeToggle />
          <DeskNavLinks />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] px-3 py-2 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-all duration-200 tracking-wide shrink-0"
          >
            Home
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="pt-16 pb-8 md:pt-20">
        <Suspense fallback={<DeskFallback />}>
          <DeskView />
        </Suspense>
      </div>
    </main>
  )
}
