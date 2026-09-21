'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DeskView } from '@/components/desk/desk-view'
import { cn } from '@/lib/utils'

function DeskFallback() {
  return (
    <div className="mx-auto max-w-[1600px] px-1.5 sm:px-2">
      <div className="h-10 rounded border border-white/[0.06] bg-white/[0.03] animate-pulse mb-1" />
      <div className="grid grid-cols-12 gap-1">
        <div className="col-span-12 lg:col-span-2 h-[520px] rounded border border-white/[0.06] bg-white/[0.03] animate-pulse" />
        <div className="col-span-12 lg:col-span-7 h-[520px] rounded border border-white/[0.06] bg-white/[0.03] animate-pulse" />
        <div className="col-span-12 lg:col-span-3 h-[520px] rounded border border-white/[0.06] bg-white/[0.03] animate-pulse" />
      </div>
    </div>
  )
}

const LINKS = [
  { href: '/desk', label: 'Spot' },
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

type DeskInterval = '1h' | '4h' | '1d' | '1w'

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
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/desk"
              className="font-[family-name:var(--font-dk-mark)] text-[14px] font-bold tracking-tight text-white shrink-0"
            >
              DESK
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
        <Suspense fallback={<DeskFallback />}>
          <DeskView initialAsset={initialAsset} initialInterval={initialInterval} />
        </Suspense>
      </div>
    </main>
  )
}
