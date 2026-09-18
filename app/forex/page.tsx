import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { ForexShell } from '@/components/forex-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-fx-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fx-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-fx-mark',
})

export const metadata = {
  title: 'Forex',
  description: 'Convert currencies.',
  openGraph: {
    title: 'Forex',
    description: 'Convert currencies.',
  },
  twitter: {
    title: 'Forex',
    description: 'Convert currencies.',
  },
}

export default function ForexPage() {
  return (
    <ForexShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`} />
  )
}
