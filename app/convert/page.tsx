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
  title: 'Convert',
  description: 'Convert currencies — live free-market USD to IRR and more.',
  openGraph: {
    title: 'Convert',
    description: 'Convert currencies — live free-market USD to IRR and more.',
  },
  twitter: {
    title: 'Convert',
    description: 'Convert currencies — live free-market USD to IRR and more.',
  },
}

export default function ConvertPage() {
  return (
    <ForexShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`} />
  )
}
