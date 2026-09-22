import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { StudioShell } from '@/components/studio/studio-shell'
import { StudioView } from '@/components/studio/studio-view'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-st-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-st-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-st-mark',
})

export const metadata = {
  title: 'Magic Studio — hear real English pronunciation',
  description:
    'Step into the booth. Dial a word. Hear real people say it in authentic videos — US, UK, and Australian accents.',
  keywords: [
    'English pronunciation',
    'pronunciation studio',
    'accent training',
    'hear English words',
    'SayItVid',
  ],
  alternates: { canonical: '/studio' },
  openGraph: {
    title: 'Magic Studio — hear real English pronunciation',
    description:
      'Step into the booth. Dial a word. Hear real people say it in authentic videos.',
    url: '/studio',
  },
}

export default function StudioPage() {
  return (
    <StudioShell fontVars={`${display.variable} ${mono.variable} ${mark.variable}`}>
      <StudioView />
    </StudioShell>
  )
}
