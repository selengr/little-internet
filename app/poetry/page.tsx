import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { DailyPoetry } from '@/components/daily-poetry'
import { PoetryShell } from '@/components/poetry-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-py-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-py-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-py-mark',
})

export const metadata = {
  title: 'Poetry',
  description: 'A poem for today.',
  openGraph: {
    title: 'Poetry',
    description: 'A poem for today.',
  },
  twitter: {
    title: 'Poetry',
    description: 'A poem for today.',
  },
}

export default function PoetryPage() {
  return (
    <PoetryShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <DailyPoetry />
    </PoetryShell>
  )
}
