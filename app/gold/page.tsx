import { Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { GoldShell } from '@/components/gold-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-gd-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-gd-mono',
})

export const metadata = {
  title: 'Gold — live XAU price',
  description:
    'Live gold spot price, karat per gram, recent path, and forward curve — plus crypto prediction markets.',
  alternates: { canonical: '/gold' },
  openGraph: {
    title: 'Gold — live XAU price',
    description: 'Live gold spot, karat pricing, and a quiet look at the metal market.',
    url: '/gold',
  },
}

export const dynamic = 'force-dynamic'

export default function GoldPage() {
  return <GoldShell fontVars={`${display.variable} ${mono.variable}`} />
}
