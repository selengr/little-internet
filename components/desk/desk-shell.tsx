'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { DeskView } from '@/components/desk/desk-view'
import { DeskSkeleton } from '@/components/desk/desk-skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
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
        <div className="mx-auto max-w-[1600px] flex min-h-10 items-center justify-between gap-2 px-2 py-1 sm:gap-3 sm:px-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <span className="hidden h-3 w-px bg-white/10 sm:block shrink-0" aria-hidden />
            <Link
              href="/"
              className="hidden font-pixel text-[9px] tracking-[0.2em] text-white/35 transition-colors hover:text-white/65 xl:inline-flex shrink-0"
            >
              LITTLE INTERNET
            </Link>
            <span className="hidden h-3 w-px bg-white/10 xl:block shrink-0" aria-hidden />
            <Link
              href="/charts"
              className="font-[family-name:var(--font-dk-mark)] text-[13px] font-bold tracking-tight text-white sm:text-[14px] shrink-0"
            >
              CHARTS
            </Link>
            <DeskNavLinks />
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] text-white/55 transition-colors hover:border-white/18 hover:bg-white/[0.04] hover:text-white/90 sm:gap-2 sm:px-2.5 sm:text-[11px]"
          >
            Back home
            <ArrowRight className="size-3 sm:size-3.5" />
          </Link>
        </div>
      </header>

      <div className="pt-0.5 pb-3">
        <Suspense fallback={<DeskSkeleton />}>
          <DeskView initialAsset={initialAsset} initialInterval={initialInterval} />
        </Suspense>
      </div>
    </main>
  )
}
