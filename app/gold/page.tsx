import { Cormorant_Garamond, JetBrains_Mono } from 'next/font/google'
import { GoldShell } from '@/components/gold/gold-shell'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-gd-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-gd-mono',
})

export const metadata = {
  title: 'Gold — live XAU spot & karat',
  description:
    'Live gold spot price, karat per gram, futures curve, and crypto prediction odds — a quiet vault on Little Internet.',
  alternates: { canonical: '/gold' },
  openGraph: {
    title: 'Gold — live XAU spot & karat',
    description: 'Live gold spot, karat ladder, and what the crowd prices next.',
    url: '/gold',
  },
}

export const dynamic = 'force-dynamic'

export default function GoldPage() {
  return <GoldShell fontVars={`${display.variable} ${mono.variable}`} />
}
