import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { CatFactsView } from '@/components/animal-facts/CatFactsView'
import { AnimalFactsShell } from '@/components/animal-facts/animal-facts-shell'

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

export const metadata = {
  title: 'Cat facts',
  description: 'One curious cat fact at a time.',
  openGraph: {
    title: 'Cat facts',
    description: 'One curious cat fact at a time.',
  },
  twitter: {
    title: 'Cat facts',
    description: 'One curious cat fact at a time.',
  },
}

export default function CatPage() {
  return (
    <AnimalFactsShell
      fontVars={`${display.variable} ${mono.variable} ${mark.variable}`}
      label="CAT"
    >
      <CatFactsView />
    </AnimalFactsShell>
  )
}
