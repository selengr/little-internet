'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { DeskView } from '@/components/desk/desk-view'
import { cn } from '@/lib/utils'

function DeskFallback() {
  return (
    <div className="mx-auto max-w-[1480px] px-2 sm:px-3">
      <div className="h-12 rounded border border-white/[0.06] bg-white/[0.04] animate-pulse mb-2" />
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 lg:col-span-2 h-[480px] rounded border border-white/[0.06] bg-white/[0.04] animate-pulse" />
        <div className="col-span-12 lg:col-span-7 h-[480px] rounded border border-white/[0.06] bg-white/[0.04] animate-pulse" />
        <div className="col-span-12 lg:col-span-3 h-[480px] rounded border border-white/[0.06] bg-white/[0.04] animate-pulse" />
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
    <nav className="hidden sm:flex items-center gap-0.5">
      {LINKS.map(link => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors border-b-2',
              active
                ? 'border-[#2b6cb0] text-white'
                : 'border-transparent text-white/40 hover:text-white/75',
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
      className={`${fontVars} desk-shell relative min-h-screen overflow-x-clip bg-[#0a0d11] text-white`}
    >
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-[#0a0d11]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0c1016]/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1480px] flex items-center justify-between gap-3 px-2 sm:px-3 h-11">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/desk"
              className="font-[family-name:var(--font-dk-mark)] text-[13px] font-bold tracking-wide text-white shrink-0"
            >
              DESK
            </Link>
            <span className="hidden sm:inline text-[10px] font-mono text-emerald-400/80 uppercase tracking-wider">
              ● Live
            </span>
            <DeskNavLinks />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded border border-white/10 text-white/55 hover:text-white hover:border-white/25 transition-colors tracking-wide shrink-0 font-mono uppercase"
            >
              Home
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-2 pb-6">
        <Suspense fallback={<DeskFallback />}>
          <DeskView />
        </Suspense>
      </div>
    </main>
  )
}
