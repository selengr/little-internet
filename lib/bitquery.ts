/**
 * Bitquery V2 GraphQL client — server-only.
 * Free / self-serve: realtime dataset only, small limits, heavy caching.
 *
 * Auth: set BITQUERY_ACCESS_TOKEN=ory_at_... in .env.local
 * (Authorization → Applications → My application → Tokens → Generate)
 *
 * Optional refresh via client credentials if you later add a secret:
 * BITQUERY_CLIENT_ID + BITQUERY_CLIENT_SECRET
 */

const GRAPHQL_URL = 'https://streaming.bitquery.io/graphql'
const OAUTH_URL = 'https://oauth2.bitquery.io/oauth2/token'

type TokenCache = { token: string; exp: number }
let tokenCache: TokenCache | null = null

export type OnchainTrade = {
  time: string
  side: 'buy' | 'sell' | 'swap'
  protocol: string
  baseSymbol: string
  quoteSymbol: string
  amount: string
  amountUsd: string | null
  priceUsd: string | null
  txHash: string | null
  network: string
}

export type OnchainTape = {
  status: 'live' | 'unavailable' | 'unconfigured' | 'coming_soon'
  provider: 'Bitquery'
  message: string
  trades: OnchainTrade[]
  fetchedAt: number | null
}

export type AssetOnchain = {
  kind: 'evm' | 'solana'
  network: 'eth' | 'bsc' | 'matic' | 'solana'
  /** Contract / mint — EVM addresses lowercase */
  address: string
  symbol: string
  label: string
}

/** Map Desk CoinGecko ids → Bitquery V2 realtime-friendly tokens */
export const DESK_ONCHAIN: Record<string, AssetOnchain> = {
  bitcoin: {
    kind: 'evm',
    network: 'eth',
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    symbol: 'WBTC',
    label: 'WBTC on Ethereum',
  },
  ethereum: {
    kind: 'evm',
    network: 'eth',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    symbol: 'WETH',
    label: 'WETH on Ethereum',
  },
  solana: {
    kind: 'solana',
    network: 'solana',
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    label: 'SOL on Solana',
  },
  binancecoin: {
    kind: 'evm',
    network: 'bsc',
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
    symbol: 'WBNB',
    label: 'WBNB on BNB Chain',
  },
  chainlink: {
    kind: 'evm',
    network: 'eth',
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    symbol: 'LINK',
    label: 'LINK on Ethereum',
  },
  'matic-network': {
    kind: 'evm',
    network: 'matic',
    address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270', // WMATIC
    symbol: 'WMATIC',
    label: 'WMATIC on Polygon',
  },
  litecoin: {
    kind: 'evm',
    network: 'eth',
    // No native LTC on V2 EVM — skip at call site
    address: '',
    symbol: 'LTC',
    label: 'Litecoin',
  },
}

const tapeCache = new Map<string, { at: number; tape: OnchainTape }>()
const TAPE_CACHE_MS = 60_000 // free-plan friendly

function envToken(): string | null {
  return process.env.BITQUERY_ACCESS_TOKEN?.trim() || null
}

async function fetchClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.BITQUERY_CLIENT_ID?.trim()
  const clientSecret = process.env.BITQUERY_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'api',
  })

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    console.error('[bitquery] oauth failed', res.status, await res.text().catch(() => ''))
    return null
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number }
  if (!json.access_token) return null
  const expiresIn = Number(json.expires_in ?? 1800)
  tokenCache = {
    token: json.access_token,
    exp: Date.now() + Math.max(60, expiresIn - 120) * 1000,
  }
  return json.access_token
}

async function getAccessToken(): Promise<string | null> {
  const staticToken = envToken()
  if (staticToken) return staticToken

  if (tokenCache && Date.now() < tokenCache.exp) return tokenCache.token
  return fetchClientCredentialsToken()
}

async function bitqueryGraphql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; errors?: { message: string }[] }> {
  const token = await getAccessToken()
  if (!token) {
    return { errors: [{ message: 'BITQUERY_ACCESS_TOKEN is not configured' }] }
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    // free plan: avoid Next fetch cache stacking oddities
    cache: 'no-store',
  })

  const json = (await res.json().catch(() => ({}))) as {
    data?: T
    errors?: { message: string }[]
  }

  if (!res.ok) {
    const msg =
      json.errors?.[0]?.message ||
      (res.status === 402
        ? 'Bitquery plan/points exhausted (402)'
        : `Bitquery HTTP ${res.status}`)
    return { errors: [{ message: msg }] }
  }

  return json
}

function fmtAmt(n: unknown, digits = 4): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
  if (Math.abs(v) >= 1) return v.toFixed(digits)
  return v.toPrecision(3)
}

function evmDexQuery(network: 'eth' | 'bsc' | 'matic' | 'base' | 'arbitrum') {
  // realtime default — do NOT request archive/combined (paid add-on)
  return `
    query DeskEvmTape($address: String!) {
      EVM(network: ${network}) {
        DEXTrades(
          limit: { count: 12 }
          orderBy: { descending: Block_Time }
          where: {
            Trade: { Buy: { Currency: { SmartContract: { is: $address } } } }
          }
        ) {
          Block { Time }
          Transaction { Hash }
          Trade {
            Dex { ProtocolName ProtocolFamily }
            Buy {
              Amount
              AmountInUSD
              Buyer
              Currency { Symbol SmartContract }
            }
            Sell {
              Amount
              AmountInUSD
              Currency { Symbol SmartContract }
            }
          }
        }
      }
    }
  `
}

function solanaDexQuery() {
  return `
    query DeskSolTape($mint: String!) {
      Solana {
        DEXTradeByTokens(
          limit: { count: 12 }
          orderBy: { descending: Block_Time }
          where: { Trade: { Currency: { MintAddress: { is: $mint } } } }
        ) {
          Block { Time }
          Transaction { Signature }
          Trade {
            Dex { ProtocolName }
            Currency { Symbol MintAddress }
            Side { Type Currency { Symbol MintAddress } }
            Amount
            PriceInUSD
            Price
          }
        }
      }
    }
  `
}

type EvmTradeRow = {
  Block?: { Time?: string }
  Transaction?: { Hash?: string }
  Trade?: {
    Dex?: { ProtocolName?: string; ProtocolFamily?: string }
    Buy?: {
      Amount?: string | number
      AmountInUSD?: string | number
      Currency?: { Symbol?: string; SmartContract?: string }
    }
    Sell?: {
      Amount?: string | number
      AmountInUSD?: string | number
      Currency?: { Symbol?: string; SmartContract?: string }
    }
  }
}

type SolTradeRow = {
  Block?: { Time?: string }
  Transaction?: { Signature?: string }
  Trade?: {
    Dex?: { ProtocolName?: string }
    Currency?: { Symbol?: string }
    Side?: { Type?: string; Currency?: { Symbol?: string } }
    Amount?: string | number
    PriceInUSD?: string | number
  }
}

function mapEvmTrades(
  rows: EvmTradeRow[],
  networkLabel: 'Ethereum' | 'BNB Chain' | 'Polygon',
): OnchainTrade[] {
  return rows.map(row => {
    const buy = row.Trade?.Buy
    const sell = row.Trade?.Sell
    return {
      time: row.Block?.Time ?? '',
      side: 'buy' as const,
      protocol: row.Trade?.Dex?.ProtocolName || row.Trade?.Dex?.ProtocolFamily || 'DEX',
      baseSymbol: buy?.Currency?.Symbol || '—',
      quoteSymbol: sell?.Currency?.Symbol || '—',
      amount: fmtAmt(buy?.Amount),
      amountUsd: buy?.AmountInUSD != null ? `$${fmtAmt(buy.AmountInUSD, 2)}` : null,
      priceUsd: null,
      txHash: row.Transaction?.Hash ?? null,
      network: networkLabel,
    }
  })
}

function mapSolTrades(rows: SolTradeRow[]): OnchainTrade[] {
  return rows.map(row => {
    const sideRaw = (row.Trade?.Side?.Type ?? '').toLowerCase()
    const side: OnchainTrade['side'] =
      sideRaw.includes('buy') || sideRaw === 'buy' ? 'buy' : sideRaw.includes('sell') ? 'sell' : 'swap'
    return {
      time: row.Block?.Time ?? '',
      side,
      protocol: row.Trade?.Dex?.ProtocolName || 'DEX',
      baseSymbol: row.Trade?.Currency?.Symbol || 'SOL',
      quoteSymbol: row.Trade?.Side?.Currency?.Symbol || '—',
      amount: fmtAmt(row.Trade?.Amount),
      amountUsd: null,
      priceUsd:
        row.Trade?.PriceInUSD != null ? `$${fmtAmt(row.Trade.PriceInUSD, 4)}` : null,
      txHash: row.Transaction?.Signature ?? null,
      network: 'Solana',
    }
  })
}

export async function fetchOnchainTape(assetId: string): Promise<OnchainTape> {
  const meta = DESK_ONCHAIN[assetId]
  if (!meta || !meta.address) {
    return {
      status: 'unavailable',
      provider: 'Bitquery',
      message: 'On-chain tape is available for ETH, SOL, BNB, LINK, MATIC, and WBTC (BTC proxy).',
      trades: [],
      fetchedAt: null,
    }
  }

  const cacheKey = `tape:${assetId}`
  const hit = tapeCache.get(cacheKey)
  if (hit && Date.now() - hit.at < TAPE_CACHE_MS) return hit.tape

  if (!envToken() && !(process.env.BITQUERY_CLIENT_ID && process.env.BITQUERY_CLIENT_SECRET)) {
    return {
      status: 'unconfigured',
      provider: 'Bitquery',
      message:
        'Add BITQUERY_ACCESS_TOKEN to .env.local (Applications → Tokens → Generate). Free realtime plan only.',
      trades: [],
      fetchedAt: null,
    }
  }

  try {
    if (meta.kind === 'solana') {
      const result = await bitqueryGraphql<{
        Solana?: { DEXTradeByTokens?: SolTradeRow[] }
      }>(solanaDexQuery(), { mint: meta.address })

      if (result.errors?.length) {
        const tape: OnchainTape = {
          status: 'unavailable',
          provider: 'Bitquery',
          message: result.errors[0].message,
          trades: [],
          fetchedAt: Date.now(),
        }
        tapeCache.set(cacheKey, { at: Date.now(), tape })
        return tape
      }

      const trades = mapSolTrades(result.data?.Solana?.DEXTradeByTokens ?? [])
      const tape: OnchainTape = {
        status: 'live',
        provider: 'Bitquery',
        message: `Recent ${meta.label} DEX fills · realtime`,
        trades,
        fetchedAt: Date.now(),
      }
      tapeCache.set(cacheKey, { at: Date.now(), tape })
      return tape
    }

    const address = meta.address.toLowerCase()
    const network = meta.network === 'solana' ? 'eth' : meta.network
    const networkLabel =
      network === 'bsc' ? 'BNB Chain' : network === 'matic' ? 'Polygon' : 'Ethereum'
    const result = await bitqueryGraphql<{
      EVM?: { DEXTrades?: EvmTradeRow[] }
    }>(evmDexQuery(network), { address })

    if (result.errors?.length) {
      const tape: OnchainTape = {
        status: 'unavailable',
        provider: 'Bitquery',
        message: result.errors[0].message,
        trades: [],
        fetchedAt: Date.now(),
      }
      tapeCache.set(cacheKey, { at: Date.now(), tape })
      return tape
    }

    const trades = mapEvmTrades(result.data?.EVM?.DEXTrades ?? [], networkLabel)
    const tape: OnchainTape = {
      status: 'live',
      provider: 'Bitquery',
      message: `Recent ${meta.label} DEX fills · realtime`,
      trades,
      fetchedAt: Date.now(),
    }
    tapeCache.set(cacheKey, { at: Date.now(), tape })
    return tape
  } catch (err) {
    console.error('[bitquery] tape', err)
    return {
      status: 'unavailable',
      provider: 'Bitquery',
      message: err instanceof Error ? err.message : 'On-chain tape failed',
      trades: [],
      fetchedAt: Date.now(),
    }
  }
}
