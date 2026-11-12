import { Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { WeatherRoom } from '@/components/weather/weather-room'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-wx-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-wx-mono',
})

export const metadata = {
  title: 'Sky window — live weather',
  description:
    'Apple-smooth scroll through your sky: Open-Meteo forecast, hour-by-hour ribbon, sunrise and sunset arc.',
  alternates: { canonical: '/weather' },
  openGraph: {
    title: 'Sky window — live weather',
    description: 'Your place, your temperature, your week — Open-Meteo on Little Internet.',
    url: '/weather',
  },
}

export const dynamic = 'force-dynamic'

export default function WeatherPage() {
  return <WeatherRoom fontVars={`${display.variable} ${mono.variable}`} />
}
