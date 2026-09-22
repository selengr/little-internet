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
  title: 'Gold price — live ounce & jewelry purity',
  description:
    'Live gold price per ounce, jewelry purity prices per gram, and what traders think happens next on Little Internet.',
  alternates: { canonical: '/gold' },
  openGraph: {
    title: 'Gold price — live ounce & jewelry purity',
    description:
      'Live gold price per ounce, jewelry purity by karat, and trader outlook markets.',
    url: '/gold',
  },
}

export const dynamic = 'force-dynamic'

export default function GoldPage() {
  return <GoldShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`} />
}
