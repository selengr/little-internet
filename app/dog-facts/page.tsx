import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { DogFactsPage } from '@/components/animal-facts/dog-facts-page'

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

const description = 'Throw the ball, fetch a fact: fresh, curious dog facts one throw at a time.'

export const metadata = {
  title: 'Dog facts',
  description,
  openGraph: { title: 'Dog facts', description },
  twitter: { title: 'Dog facts', description },
}

export default function DogFactsRoute() {
  return (
    <div className={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <DogFactsPage />
    </div>
  )
}
