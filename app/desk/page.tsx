import { Instrument_Serif, JetBrains_Mono, Syne } from 'next/font/google'
import { DeskShell } from '@/components/desk/desk-shell'

const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dk-display',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dk-mono',
})

const mark = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-dk-mark',
})

export const metadata = {
  title: 'Desk — Pro market analysis',
  description:
    'Live candles, EMA, RSI, MACD, volume, Desk Pilot buy/sell zones, and a signal meter — clearer crypto chart decisions.',
  alternates: { canonical: '/desk' },
  openGraph: {
    title: 'Desk — Pro market analysis',
    description:
      'Live candles, EMA, RSI, MACD, volume, Desk Pilot buy/sell zones, and a signal meter — clearer crypto chart decisions.',
    url: '/desk',
  },
  twitter: {
    title: 'Desk — Pro market analysis',
    description:
      'Live candles, EMA, RSI, MACD, volume, Desk Pilot buy/sell zones, and a signal meter — clearer crypto chart decisions.',
  },
}

export const dynamic = 'force-dynamic'

type DeskInterval = '1h' | '4h' | '1d' | '1w' | '1mo' | 'max'

function parseDeskQuery(sp: Record<string, string | string[] | undefined>) {
  const assetRaw = sp.asset
  const asset = (
    typeof assetRaw === 'string' ? assetRaw : Array.isArray(assetRaw) ? assetRaw[0] : 'bitcoin'
  ).toLowerCase()
  const ivRaw = sp.interval
  const iv = typeof ivRaw === 'string' ? ivRaw : Array.isArray(ivRaw) ? ivRaw[0] : undefined
  const interval: DeskInterval =
    iv === '1h' || iv === '4h' || iv === '1d' || iv === '1w' || iv === '1mo' || iv === 'max'
      ? iv
      : '1d'
  return { asset, interval }
}

export default async function DeskPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { asset, interval } = parseDeskQuery(await searchParams)
  return (
    <DeskShell
      fontVars={`${display.variable} ${mono.variable} ${mark.variable}`}
      initialAsset={asset}
      initialInterval={interval}
    />
  )
}
