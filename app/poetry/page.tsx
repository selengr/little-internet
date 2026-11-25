import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { PoetryPage } from '@/components/poetry-page'

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

const description =
  'Spill a little ink: poem of the day, mood spinner, and PoetryDB search by author or title.'

export const metadata = {
  title: 'Poetry',
  description,
  openGraph: { title: 'Poetry', description },
  twitter: { title: 'Poetry', description },
}

export default function PoetryRoute() {
  return (
    <div className={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <PoetryPage />
    </div>
  )
}
