/**
 * Etherscan API v2 — server-only, free-tier friendly.
 * Docs: https://docs.etherscan.io/
 *
 * Free: 3 calls/sec, 100k/day. Cache aggressively.
 * Never expose the key to the browser.
 */

const BASE = 'https://api.etherscan.io/v2/api'

export type GasOracle = {
  safe: number
  propose: number
  fast: number
  baseFee: number
  lastBlock: string
}

export type EthPrice = {
  ethusd: number
  ethbtc: number
}

export type TokenTransfer = {
  hash: string
  from: string
  to: string
  value: string
  tokenSymbol: string
  tokenDecimal: number
  timeStamp: number
  amount: number
}

export type NetworkPulse = {
  status: 'live' | 'unconfigured' | 'unavailable'
  message: string
  gas: GasOracle | null
  ethPrice: EthPrice | null
  transfers: TokenTransfer[]
  chainId: number
  chainLabel: string
  fetchedAt: number | null
}

type CacheEntry<T> = { at: number; data: T }
const cache = new Map<string, CacheEntry<unknown>>()

function getKey() {
  return process.env.ETHERSCAN_API_KEY?.trim() || null
}

async function etherscanGet(
  params: Record<string, string>,
  chainId = 1,
): Promise<{ status: string; message: string; result: unknown }> {
  const apikey = getKey()
  if (!apikey) throw new Error('ETHERSCAN_API_KEY is not configured')

  const qs = new URLSearchParams({ ...params, chainid: String(chainId), apikey })
  const res = await fetch(`${BASE}?${qs}`, { cache: 'no-store' })
  const json = (await res.json()) as { status: string; message: string; result: unknown }
  return json
}

function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.data)
  return fn().then(data => {
    cache.set(key, { at: Date.now(), data })
    return data
  })
}

export async function fetchGasOracle(chainId = 1): Promise<GasOracle | null> {
  return cached(`gas:${chainId}`, 30_000, async () => {
    const json = await etherscanGet(
      { module: 'gastracker', action: 'gasoracle' },
      chainId,
    )
    if (json.status !== '1' || !json.result || typeof json.result !== 'object') return null
    const r = json.result as Record<string, string>
    return {
      safe: Number(r.SafeGasPrice),
      propose: Number(r.ProposeGasPrice),
      fast: Number(r.FastGasPrice),
      baseFee: Number(r.suggestBaseFee),
      lastBlock: String(r.LastBlock ?? ''),
    }
  })
}

export async function fetchEthPrice(): Promise<EthPrice | null> {
  return cached('ethprice', 45_000, async () => {
    const json = await etherscanGet({ module: 'stats', action: 'ethprice' }, 1)
    if (json.status !== '1' || !json.result || typeof json.result !== 'object') return null
    const r = json.result as Record<string, string>
    return {
      ethusd: Number(r.ethusd),
      ethbtc: Number(r.ethbtc),
    }
  })
}

export async function fetchRecentTokenTransfers(
  contractAddress: string,
  chainId = 1,
  offset = 12,
): Promise<TokenTransfer[]> {
  const addr = contractAddress.toLowerCase()
  return cached(`tokentx:${chainId}:${addr}:${offset}`, 45_000, async () => {
    const json = await etherscanGet(
      {
        module: 'account',
        action: 'tokentx',
        contractaddress: addr,
        page: '1',
        offset: String(offset),
        sort: 'desc',
      },
      chainId,
    )
    if (json.status !== '1' || !Array.isArray(json.result)) return []
    return (json.result as Record<string, string>[]).map(row => {
      const decimals = Number(row.tokenDecimal || 18)
      const raw = Number(row.value || 0)
      const amount = raw / 10 ** decimals
      return {
        hash: row.hash,
        from: row.from,
        to: row.to,
        value: row.value,
        tokenSymbol: row.tokenSymbol || 'TOKEN',
        tokenDecimal: decimals,
        timeStamp: Number(row.timeStamp),
        amount,
      }
    })
  })
}

/** Desk asset id → Etherscan contract + chain (free-tier Ethereum preferred) */
export const ETHERSCAN_ASSETS: Record<
  string,
  { chainId: number; chainLabel: string; contract: string; symbol: string }
> = {
  bitcoin: {
    chainId: 1,
    chainLabel: 'Ethereum',
    contract: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    symbol: 'WBTC',
  },
  ethereum: {
    chainId: 1,
    chainLabel: 'Ethereum',
    contract: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    symbol: 'WETH',
  },
  chainlink: {
    chainId: 1,
    chainLabel: 'Ethereum',
    contract: '0x514910771af9ca656af840dff83e8264ecf986ca',
    symbol: 'LINK',
  },
  // Polygon is free-tier available
  'matic-network': {
    chainId: 137,
    chainLabel: 'Polygon',
    contract: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    symbol: 'WMATIC',
  },
}

export async function fetchNetworkPulse(assetId: string): Promise<NetworkPulse> {
  if (!getKey()) {
    return {
      status: 'unconfigured',
      message: 'Add ETHERSCAN_API_KEY to .env.local for live gas and transfers.',
      gas: null,
      ethPrice: null,
      transfers: [],
      chainId: 1,
      chainLabel: 'Ethereum',
      fetchedAt: null,
    }
  }

  const meta = ETHERSCAN_ASSETS[assetId]
  try {
    // Stay under free 3/sec: at most 3 parallel calls
    const [gas, ethPrice, transfers] = await Promise.all([
      fetchGasOracle(1), // gas always from Ethereum mainnet (most useful)
      fetchEthPrice(),
      meta
        ? fetchRecentTokenTransfers(meta.contract, meta.chainId, 14)
        : Promise.resolve([] as TokenTransfer[]),
    ])

    return {
      status: 'live',
      message: meta
        ? `Live ${meta.symbol} transfers · ${meta.chainLabel}`
        : 'Live Ethereum gas · pick ETH/WBTC/LINK/MATIC for transfers',
      gas,
      ethPrice,
      transfers,
      chainId: meta?.chainId ?? 1,
      chainLabel: meta?.chainLabel ?? 'Ethereum',
      fetchedAt: Date.now(),
    }
  } catch (err) {
    console.error('[etherscan]', err)
    return {
      status: 'unavailable',
      message: err instanceof Error ? err.message : 'Etherscan request failed',
      gas: null,
      ethPrice: null,
      transfers: [],
      chainId: 1,
      chainLabel: 'Ethereum',
      fetchedAt: Date.now(),
    }
  }
}
