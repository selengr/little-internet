import { GoldMarket } from '@/components/gold-market'

export const metadata = {
  title: 'Gold — live spot & karat prices',
  description:
    'Live gold and silver spot prices plus per-gram karat values (24K–10K) on Little Internet.',
  alternates: { canonical: '/gold' },
  openGraph: {
    title: 'Gold — live spot & karat prices',
    description: 'Live gold and silver spot prices plus per-gram karat values.',
    url: '/gold',
  },
}

export default function GoldPage() {
  return <GoldMarket />
}
