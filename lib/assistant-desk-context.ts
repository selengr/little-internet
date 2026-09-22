import { formatPct, formatUsd } from '@/lib/crypto-format'
import { buildDeskBotAdvice } from '@/lib/desk-bot'
import { buildTapeRead, computeIndicators, type OhlcBar } from '@/lib/desk-indicators'

const COINGECKO = 'https://api.coingecko.com/api/v3'

const ASSETS: Record<string, { id: string; symbol: string; name: string }> = {
  bitcoin: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  ethereum: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  solana: { id: 'solana', symbol: 'SOL', name: 'Solana' },
  binancecoin: { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  ripple: { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  cardano: { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  dogecoin: { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  'avalanche-2': { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  polkadot: { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  chainlink: { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  litecoin: { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  'matic-network': { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
}

/** Phrase / ticker → CoinGecko id */
const ALIASES: { re: RegExp; id: string }[] = [
  { re: /\b(btc|bitcoin)\b/i, id: 'bitcoin' },
  { re: /\b(eth|ethereum)\b/i, id: 'ethereum' },
  { re: /\b(sol|solana)\b/i, id: 'solana' },
  { re: /\b(bnb|binance\s*coin)\b/i, id: 'binancecoin' },
  { re: /\b(xrp|ripple)\b/i, id: 'ripple' },
  { re: /\b(ada|cardano)\b/i, id: 'cardano' },
  { re: /\b(doge|dogecoin)\b/i, id: 'dogecoin' },
  { re: /\b(avax|avalanche)\b/i, id: 'avalanche-2' },
  { re: /\b(dot|polkadot)\b/i, id: 'polkadot' },
  { re: /\b(link|chainlink)\b/i, id: 'chainlink' },
  { re: /\b(ltc|litecoin)\b/i, id: 'litecoin' },
  { re: /\b(matic|polygon)\b/i, id: 'matic-network' },
]

const CRYPTO_TOPIC =
  /\b(crypto|cryptocurrency|coin|token|altcoin|desk|pilot|chart|charts|candles?)\b/i

type CacheEntry = { at: number; text: string }
const cache = new Map<string, CacheEntry>()
const CACHE_MS = 60_000

export function shouldAttachDeskContext(userText: string): boolean {
  if (ALIASES.some(({ re }) => re.test(userText))) return true
  return CRYPTO_TOPIC.test(userText)
}

export function resolveDeskAssetsFromText(userText: string): string[] {
  const ids: string[] = []
  for (const { re, id } of ALIASES) {
    if (re.test(userText) && !ids.includes(id)) ids.push(id)
  }
  if (ids.length === 0 && shouldAttachDeskContext(userText)) ids.push('bitcoin')
  return ids.slice(0, 3)
}

async function fetchAssetPilot(assetId: string): Promise<string | null> {
  const hit = cache.get(assetId)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.text

  const meta = ASSETS[assetId]
  if (!meta) return null

  try {
    const headers: HeadersInit = { Accept: 'application/json' }
    const key = process.env.COINGECKO_API_KEY?.trim()
    if (key) headers['x-cg-demo-api-key'] = key

    const [ohlcRes, mktRes] = await Promise.all([
      fetch(`${COINGECKO}/coins/${assetId}/ohlc?vs_currency=usd&days=90`, {
        headers,
        cache: 'no-store',
      }),
      fetch(
        `${COINGECKO}/coins/markets?vs_currency=usd&ids=${assetId}&price_change_percentage=24h`,
        { headers, cache: 'no-store' },
      ),
    ])

    let bars: OhlcBar[] = []
    if (ohlcRes.ok) {
      const raw = (await ohlcRes.json()) as number[][]
      bars = (Array.isArray(raw) ? raw : [])
        .filter(row => Array.isArray(row) && row.length >= 5)
        .map(([t, o, h, l, c]) => ({
          t: Number(t),
          o: Number(o),
          h: Number(h),
          l: Number(l),
          c: Number(c),
        }))
        .filter(b => [b.o, b.h, b.l, b.c].every(n => Number.isFinite(n)))
    }

    if (bars.length > 180) bars = bars.slice(-180)
    if (bars.length < 8) return null

    const markets = mktRes.ok ? ((await mktRes.json()) as { current_price?: number; price_change_percentage_24h?: number }[]) : []
    const row = Array.isArray(markets) ? markets[0] : null
    const price = row?.current_price ?? bars[bars.length - 1]?.c ?? null
    const change24h = row?.price_change_percentage_24h ?? null

    const indicators = computeIndicators(bars)
    const tape = buildTapeRead(bars, indicators)
    const advice = buildDeskBotAdvice(bars, tape, price)

    const actionLabel =
      advice.action === 'buy' ? 'BUY lean' : advice.action === 'sell' ? 'SELL lean' : 'WAIT'
    const buy =
      advice.buyFrom != null && advice.buyTo != null
        ? `${formatUsd(advice.buyFrom)} – ${formatUsd(advice.buyTo)}`
        : 'n/a'
    const sell =
      advice.sellFrom != null && advice.sellTo != null
        ? `${formatUsd(advice.sellFrom)} – ${formatUsd(advice.sellTo)}`
        : 'n/a'

    const text = [
      `${meta.name} (${meta.symbol})`,
      `Price: ${formatUsd(price)} (24h ${formatPct(change24h)})`,
      `Chart Pilot: ${actionLabel} — ${advice.tip}`,
      `Buy around: ${buy}`,
      `Sell around: ${sell}`,
      `Bias: ${tape.bias}; RSI ${tape.rsi != null ? tape.rsi.toFixed(0) : 'n/a'}`,
    ].join('\n')

    cache.set(assetId, { at: Date.now(), text })
    return text
  } catch (err) {
    console.error('[assistant-desk]', assetId, err)
    return null
  }
}

/** Live Chart Pilot snapshot for the site assistant when the user asks about crypto. */
export async function buildAssistantDeskContext(userText: string): Promise<string | null> {
  if (!shouldAttachDeskContext(userText)) return null
  const ids = resolveDeskAssetsFromText(userText)
  const parts: string[] = []
  for (const id of ids) {
    const brief = await fetchAssetPilot(id)
    if (brief) parts.push(brief)
  }
  if (!parts.length) return null
  return [
    'CHART PILOT LIVE DATA (from this site’s /charts analysis — educational only, not financial advice):',
    parts.join('\n\n'),
    'Use this data to answer simply: say what Chart Pilot leans (buy / sell / wait), the price zones, and remind them crypto is risky. Also point them to /crypto (prices), /charts (full candles), and /convert (currency) when relevant.',
  ].join('\n\n')
}
