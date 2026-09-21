/**
 * DefiLlama free public API — server-only, no API key.
 * Docs: https://api-docs.defillama.com/
 */

const BASE = 'https://api.llama.fi'
const CACHE_MS = 7 * 60 * 1000

export type DefiDeskSignal = {
  status: 'live' | 'unmapped' | 'unavailable'
  message: string
  chainName: string | null
  chainTvl: number | null
  change: number | null
  protocolTvl: number | null
}

type ChainRow = {
  gecko_id: string | null
  name: string
  tvl: number
  tokenSymbol: string | null
}

type CacheEntry<T> = { at: number; data: T }
const cache = new Map<string, CacheEntry<unknown>>()

function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined
  if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.data)
  return fn().then(data => {
    cache.set(key, { at: Date.now(), data })
    return data
  })
}

/** CoinGecko desk asset id → chain lookup (gecko_id and/or DefiLlama chain name). */
const ASSET_CHAIN_LOOKUP: Record<string, { geckoId?: string; chainName?: string }> = {
  bitcoin: { geckoId: 'bitcoin' },
  ethereum: { geckoId: 'ethereum' },
  solana: { geckoId: 'solana' },
  binancecoin: { geckoId: 'binancecoin' },
  ripple: { geckoId: 'ripple' },
  cardano: { geckoId: 'cardano' },
  dogecoin: { geckoId: 'dogecoin' },
  'avalanche-2': { geckoId: 'avalanche-2' },
  'matic-network': { chainName: 'Polygon' },
  litecoin: { chainName: 'Litecoin' },
  polkadot: { chainName: 'Polkadot' },
}

async function fetchChains(): Promise<ChainRow[]> {
  return cached('defillama:chains', CACHE_MS, async () => {
    const res = await fetch(`${BASE}/v2/chains`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 420 },
    })
    if (!res.ok) throw new Error(`DefiLlama chains ${res.status}`)
    const json = (await res.json()) as ChainRow[]
    return Array.isArray(json) ? json : []
  })
}

function resolveChain(chains: ChainRow[], assetId: string): ChainRow | null {
  const hint = ASSET_CHAIN_LOOKUP[assetId]
  if (!hint) return null
  if (hint.geckoId) {
    const byGecko = chains.find(c => c.gecko_id === hint.geckoId)
    if (byGecko) return byGecko
  }
  if (hint.chainName) {
    const byName = chains.find(c => c.name === hint.chainName)
    if (byName) return byName
  }
  return null
}

async function fetchChainTvlChange24h(chainName: string): Promise<number | null> {
  return cached(`defillama:hist:${chainName}`, CACHE_MS, async () => {
    const res = await fetch(`${BASE}/v2/historicalChainTvl/${encodeURIComponent(chainName)}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 420 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { date: number; tvl: number }[]
    if (!Array.isArray(json) || json.length < 2) return null
    const last = json[json.length - 1]
    const prev = json[json.length - 2]
    if (!last?.tvl || !prev?.tvl || prev.tvl <= 0) return null
    return ((last.tvl - prev.tvl) / prev.tvl) * 100
  })
}

export async function fetchDefiDeskSignal(coingeckoAssetId: string): Promise<DefiDeskSignal> {
  const empty: DefiDeskSignal = {
    status: 'unmapped',
    message: 'No chain TVL mapping for this asset',
    chainName: null,
    chainTvl: null,
    change: null,
    protocolTvl: null,
  }

  if (!ASSET_CHAIN_LOOKUP[coingeckoAssetId]) {
    return empty
  }

  try {
    const chains = await fetchChains()
    const chain = resolveChain(chains, coingeckoAssetId)
    if (!chain || !Number.isFinite(chain.tvl) || chain.tvl <= 0) {
      return {
        ...empty,
        status: 'unavailable',
        message: 'Chain TVL not found on DefiLlama',
      }
    }

    const change = await fetchChainTvlChange24h(chain.name)

    return {
      status: 'live',
      message: 'DefiLlama chain TVL',
      chainName: chain.name,
      chainTvl: chain.tvl,
      change,
      protocolTvl: null,
    }
  } catch {
    return {
      status: 'unavailable',
      message: 'DefiLlama temporarily unavailable',
      chainName: null,
      chainTvl: null,
      change: null,
      protocolTvl: null,
    }
  }
}
