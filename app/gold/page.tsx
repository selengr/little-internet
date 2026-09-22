import { Cormorant_Garamond, Syne } from 'next/font/google'
import type { Metadata } from 'next'
import { GoldVault } from '@/components/gold-vault'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-gold-display',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-gold-mark',
})

export const metadata: Metadata = {
  title: 'Gold — live XAU vault',
  description:
    'Live gold spot, karat-by-gram prices, forward futures curve, and the Dino.markets morning tape — then continue to crypto.',
  alternates: { canonical: '/gold' },
  openGraph: {
    title: 'Gold — live XAU vault',
    description:
      'Live gold spot, karat-by-gram prices, forward futures curve, and the Dino morning tape.',
    url: '/gold',
  },
}

export const dynamic = 'force-dynamic'

export default function GoldPage() {
  return (
    <main className={`${display.variable} ${mark.variable}`}>
      <GoldVault />
    </main>
  )
}
