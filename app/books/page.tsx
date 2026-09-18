import { Suspense } from 'react'
import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { BookExplorer } from '@/components/book-explorer'
import { BooksShell } from '@/components/books-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-bk-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-bk-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-bk-mark',
})

export const metadata = {
  title: 'Books',
  description: 'Find a book to read.',
  openGraph: {
    title: 'Books',
    description: 'Find a book to read.',
  },
  twitter: {
    title: 'Books',
    description: 'Find a book to read.',
  },
}

function BookExplorerFallback() {
  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 animate-pulse space-y-10">
      <div className="h-14 w-48 bg-[color:var(--bk-fg)]/10" />
      <div className="h-12 w-full max-w-xl bg-[color:var(--bk-fg)]/10" />
      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <div className="aspect-[2/3] w-[200px] mx-auto lg:mx-0 bg-[color:var(--bk-fg)]/10" />
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-[color:var(--bk-fg)]/10" />
          <div className="h-5 w-1/3 bg-[color:var(--bk-fg)]/8" />
          <div className="h-32 w-full bg-[color:var(--bk-fg)]/8" />
        </div>
      </div>
    </div>
  )
}

export default function BooksPage() {
  return (
    <BooksShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <Suspense fallback={<BookExplorerFallback />}>
        <BookExplorer />
      </Suspense>
    </BooksShell>
  )
}
