import { Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { TodayRoom } from '@/components/today/today-room'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-td-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-td-mono',
})

export const metadata = {
  title: 'Today desk — quote, number & holiday',
  description:
    'Daily mash: NASA APOD, Quotable, Numbers API, and the next public holidays for your country.',
  alternates: { canonical: '/today' },
  openGraph: {
    title: 'Today desk',
    url: '/today',
  },
}

export const dynamic = 'force-dynamic'

export default function TodayPage() {
  return <TodayRoom fontVars={`${display.variable} ${mono.variable}`} />
}
