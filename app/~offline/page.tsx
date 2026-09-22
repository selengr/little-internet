import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[#f8f8f8] text-[#37352f] dark:bg-[#2f3437] dark:text-[hsla(0,0%,100%,0.9)]">
      <p className="text-[11px] uppercase tracking-[0.22em] text-black/40 dark:text-white/40 mb-4">
        Little Internet
      </p>
      <h1 className="text-3xl md:text-4xl font-light tracking-tight leading-tight max-w-md">
        You’re offline
      </h1>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-black/55 dark:text-white/55">
        This page was saved on your device. Reconnect to browse books, crypto, charts, and the rest of
        the site.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-[#37352f] text-[#f7f6f3] dark:bg-[#e8e6e1] dark:text-[#2f3437] px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Try home
      </Link>
    </main>
  )
}
