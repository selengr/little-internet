import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { JokesPage } from '@/components/jokes-page'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-jk-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jk-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-jk-mark',
})

const description = 'Roll the die, read the setup, then reveal the punchline: puns, programming and more.'

export const metadata = {
  title: 'Jokes',
  description,
  openGraph: { title: 'Jokes', description },
  twitter: { title: 'Jokes', description },
}

export default function JokesRoute() {
  return (
    <div className={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <JokesPage />
    </div>
  )
}
