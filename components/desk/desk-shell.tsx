'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DeskView } from '@/components/desk/desk-view'
import { DeskSkeleton } from '@/components/desk/desk-skeleton'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/charts', label: 'Charts' },
  { href: '/crypto', label: 'Markets' },
  { href: '/convert', label: 'Convert' },
] as const

function DeskNavLinks() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-0.5">
      {LINKS.map(link => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'px-2.5 py-1 text-[11px] font-mono transition-colors',
              active ? 'text-[#f0b90b]' : 'text-white/40 hover:text-white/75',
            )}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}

type DeskInterval = '1h' | '4h' | '1d' | '1w' | '1mo' | 'max'

export function DeskShell({
  fontVars,
  initialAsset,
  initialInterval,
}: {
  fontVars: string
  initialAsset: string
  initialInterval: DeskInterval
}) {
  return (
    <main
      className={`${fontVars} desk-shell relative min-h-screen overflow-x-clip bg-[#0b0e11] text-white`}
    >
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0b0e11]/98 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between gap-3 px-2 h-9">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center font-pixel text-[9px] tracking-[0.22em] text-white/35 hover:text-white/70 transition-colors shrink-0"
            >
              LITTLE INTERNET
            </Link>
            <span className="hidden sm:block h-3 w-px bg-white/10 shrink-0" aria-hidden />
            <Link
              href="/charts"
              className="font-[family-name:var(--font-dk-mark)] text-[14px] font-bold tracking-tight text-white shrink-0"
            >
              CHARTS
            </Link>
            <DeskNavLinks />
          </div>
          <Link
            href="/"
            className="text-[11px] text-white/35 hover:text-white/70 transition-colors shrink-0"
          >
            Home
          </Link>
        </div>
      </header>

      <div className="pt-1 pb-3">
        <Suspense fallback={<DeskSkeleton />}>
          <DeskView initialAsset={initialAsset} initialInterval={initialInterval} />
        </Suspense>
      </div>
    </main>
  )
}
