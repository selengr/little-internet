import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { DeskShell } from '@/components/desk/desk-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dk-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dk-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-dk-mark',
})

export const metadata = {
  title: 'Desk — Pro market analysis',
  description:
    'Live candles, EMA, RSI, MACD, volume, and a signal meter — built for clearer market decisions.',
  openGraph: {
    title: 'Desk — Pro market analysis',
    description:
      'Live candles, EMA, RSI, MACD, volume, and a signal meter — built for clearer market decisions.',
  },
  twitter: {
    title: 'Desk — Pro market analysis',
    description:
      'Live candles, EMA, RSI, MACD, volume, and a signal meter — built for clearer market decisions.',
  },
}

export default function DeskPage() {
  return (
    <DeskShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`} />
  )
}
