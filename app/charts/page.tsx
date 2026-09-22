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
  title: 'Charts — live crypto candles & tips',
  description:
    'Live crypto candlestick charts with EMA, RSI, MACD, volume, and buy/sell zones — clearer chart decisions on Little Internet.',
  alternates: { canonical: '/charts' },
  openGraph: {
    title: 'Charts — live crypto candles & tips',
    description:
      'Live crypto candlestick charts with EMA, RSI, MACD, volume, and buy/sell zones — clearer chart decisions.',
    url: '/charts',
  },
  twitter: {
    title: 'Charts — live crypto candles & tips',
    description:
      'Live crypto candlestick charts with EMA, RSI, MACD, volume, and buy/sell zones — clearer chart decisions.',
  },
}

export const dynamic = 'force-dynamic'

type ChartInterval = '1h' | '4h' | '1d' | '1w' | '1mo' | 'max'

function parseChartQuery(sp: Record<string, string | string[] | undefined>) {
  const assetRaw = sp.asset
  const asset = (
    typeof assetRaw === 'string' ? assetRaw : Array.isArray(assetRaw) ? assetRaw[0] : 'bitcoin'
  ).toLowerCase()
  const ivRaw = sp.interval
  const iv = typeof ivRaw === 'string' ? ivRaw : Array.isArray(ivRaw) ? ivRaw[0] : undefined
  const interval: ChartInterval =
    iv === '1h' || iv === '4h' || iv === '1d' || iv === '1w' || iv === '1mo' || iv === 'max'
      ? iv
      : '1d'
  return { asset, interval }
}

export default async function ChartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { asset, interval } = parseChartQuery(await searchParams)
  return (
    <DeskShell
      fontVars={`${display.variable} ${mono.variable} ${mark.variable}`}
      initialAsset={asset}
      initialInterval={interval}
    />
  )
}
