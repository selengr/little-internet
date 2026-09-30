import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { CatFactsPage } from '@/components/animal-facts/cat-facts-page'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-af-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-af-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-af-mark',
})

const description = 'Wake the eye, meet a fact: fresh, curious cat facts one tap at a time.'

export const metadata = {
  title: 'Cat facts',
  description,
  openGraph: { title: 'Cat facts', description },
  twitter: { title: 'Cat facts', description },
}

export default function CatFactsRoute() {
  return (
    <div className={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <CatFactsPage />
    </div>
  )
}
