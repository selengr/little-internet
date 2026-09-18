import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { CryptoShell } from '@/components/crypto-shell'

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
  title: 'Crypto',
  description: 'Live coin prices.',
}

export default function CryptoPage() {
  return (
    <CryptoShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`} />
  )
}
