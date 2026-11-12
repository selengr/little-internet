import { Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { SpaceRoom } from '@/components/space/space-room'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-sp-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sp-mono',
})

export const metadata = {
  title: 'Orbit room — ISS, APOD & launches',
  description:
    'NASA picture of the day, live ISS telemetry, crew count, and upcoming launches — scroll-driven space desk.',
  alternates: { canonical: '/space' },
  openGraph: {
    title: 'Orbit room — ISS, APOD & launches',
    url: '/space',
  },
}

export const dynamic = 'force-dynamic'

export default function SpacePage() {
  return <SpaceRoom fontVars={`${display.variable} ${mono.variable}`} />
}
