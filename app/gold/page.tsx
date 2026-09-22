import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { GoldShell } from '@/components/gold/gold-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-cx-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cx-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-cx-mark',
})

export const metadata = {
  title: 'Gold price desk — live spot, bid/ask & karat board',
  description:
    'Live gold spot price per ounce with buy and sell quotes, change vs previous close, jewelry purity prices per gram, and forward outlook on Little Internet.',
  alternates: { canonical: '/gold' },
  openGraph: {
    title: 'Gold price desk — live spot, bid/ask & karat board',
    description:
      'Live gold spot with bid/ask, session chart, karat product board, and forward prices.',
    url: '/gold',
  },
}

export const dynamic = 'force-dynamic'

export default function GoldPage() {
  return <GoldShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`} />
}
