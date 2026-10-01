import { NextRequest, NextResponse } from 'next/server'
import type { IpstackData, IpstackError } from '@/types/ipstack'

const IPSTACK_BASE = 'https://api.ipstack.com'
const FREE_BASE = 'https://ipwho.is'

// Always run fresh — otherwise a VPN switch keeps showing the old IP
export const dynamic = 'force-dynamic'

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return null
}

function isLocalIp(ip: string | null): boolean {
  if (!ip) return true
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.')
  )
}

/** Country code → flag emoji (works without ipstack location block) */
function flagEmoji(countryCode: string): string {
  const cc = countryCode.toUpperCase()
  if (cc.length !== 2) return '🌐'
  return String.fromCodePoint(
    ...[...cc].map(c => 0x1f1e6 - 65 + c.charCodeAt(0)),
  )
}

type IpwhoResponse = {
  success?: boolean
  message?: string
  ip?: string
  type?: string
  continent?: string
  continent_code?: string
  country?: string
  country_code?: string
  region?: string
  region_code?: string
  city?: string
  latitude?: number
  longitude?: number
  is_eu?: boolean
  postal?: string
  calling_code?: string
  capital?: string
  flag?: {
    img?: string
    emoji?: string
    emoji_unicode?: string
  }
  connection?: {
    asn?: number
    org?: string
    isp?: string
    domain?: string
  }
  timezone?: {
    id?: string
    abbr?: string
    is_dst?: boolean
    offset?: number
    current_time?: string
  }
  currency?: {
    name?: string
    code?: string
    symbol?: string
    plural?: string
  }
  security?: {
    anonymous?: boolean
    proxy?: boolean
    vpn?: boolean
    tor?: boolean
    hosting?: boolean
  }
}

function mapIpwho(raw: IpwhoResponse): IpstackData {
  const code = raw.country_code ?? ''
  const emoji = raw.flag?.emoji || flagEmoji(code)
  const isp = raw.connection?.isp || raw.connection?.org || 'Unknown ISP'

  return {
    ip: raw.ip ?? '',
    type: (raw.type ?? 'ipv4').toLowerCase().includes('6') ? 'ipv6' : 'ipv4',
    continent_code: raw.continent_code ?? '',
    continent_name: raw.continent ?? '',
    country_code: code,
    country_name: raw.country ?? '',
    region_code: raw.region_code ?? '',
    region_name: raw.region ?? '',
    city: raw.city ?? 'Unknown',
    zip: raw.postal ?? '',
    latitude: raw.latitude ?? 0,
    longitude: raw.longitude ?? 0,
    location: {
      geoname_id: 0,
      capital: raw.capital ?? '',
      languages: [],
      country_flag: raw.flag?.img ?? '',
      country_flag_emoji: emoji,
      country_flag_emoji_unicode: raw.flag?.emoji_unicode ?? '',
      calling_code: raw.calling_code ?? '',
      is_eu: !!raw.is_eu,
    },
    time_zone: {
      id: raw.timezone?.id ?? '',
      current_time: raw.timezone?.current_time ?? new Date().toISOString(),
      gmt_offset: raw.timezone?.offset ?? 0,
      code: raw.timezone?.abbr ?? '',
      is_daylight_saving: !!raw.timezone?.is_dst,
    },
    currency: {
      code: raw.currency?.code ?? '',
      name: raw.currency?.name ?? '',
      plural: raw.currency?.plural ?? '',
      symbol: raw.currency?.symbol ?? '',
      symbol_native: raw.currency?.symbol ?? '',
    },
    connection: {
      asn: raw.connection?.asn ?? 0,
      isp,
      sld: raw.connection?.domain ?? null,
      tld: null,
      carrier: null,
      home: null,
      organization_type: null,
    },
    security: raw.security
      ? {
          is_proxy: !!raw.security.proxy,
          proxy_type: null,
          is_crawler: false,
          crawler_name: null,
          crawler_type: null,
          is_tor: !!raw.security.tor,
          threat_level: null,
          threat_types: null,
          proxy_last_detected: null,
          proxy_level: null,
          vpn_service: raw.security.vpn ? 'Detected' : null,
          anonymizer_status: raw.security.anonymous ? 'anonymous' : null,
          hosting_facility: !!raw.security.hosting,
        }
      : undefined,
  }
}

async function fetchIpwho(ip: string | null): Promise<IpstackData> {
  // Empty path = detect caller's IP from this server request
  const path = ip && !isLocalIp(ip) ? `/${encodeURIComponent(ip)}` : '/'
  // A slow or flaky provider should not leave the page loading forever: 6s per try, two tries.
  let res: Response | undefined
  let lastErr: unknown
  for (let attempt = 0; attempt < 2 && !res; attempt++) {
    try {
      res = await fetch(`${FREE_BASE}${path}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      })
    } catch (err) {
      lastErr = err
    }
  }
  if (!res) throw lastErr instanceof Error ? lastErr : new Error('Location lookup timed out')
  const raw = (await res.json()) as IpwhoResponse

  if (!res.ok || raw.success === false) {
    throw new Error(raw.message || 'Free geo lookup failed')
  }

  return mapIpwho(raw)
}

async function fetchIpstack(
  accessKey: string,
  ipParam: string | null,
  clientIp: string | null,
): Promise<IpstackData> {
  const isLocal = isLocalIp(clientIp)

  const endpoint = ipParam
    ? `${IPSTACK_BASE}/${ipParam}`
    : isLocal
      ? `${IPSTACK_BASE}/check`
      : `${IPSTACK_BASE}/${clientIp}`

  // security=1 → proxy/VPN/Tor/threat data; hostname=1 → reverse DNS
  const url = `${endpoint}?access_key=${accessKey}&security=1&hostname=1`
  const res = await fetch(url, { cache: 'no-store' })
  const data: IpstackData | IpstackError = await res.json()

  if ('success' in data && data.success === false) {
    throw Object.assign(new Error(data.error.info), { status: 400 })
  }

  return data as IpstackData
}

/** The free IP provider omits currency and capital for many countries; fill them from countries.dev. */
async function fillCountryDetails(data: IpstackData): Promise<IpstackData> {
  if ((data.currency.code && data.location.capital) || !data.country_code) return data
  try {
    const res = await fetch(`https://countries.dev/alpha/${encodeURIComponent(data.country_code)}`, {
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return data
    const c = (await res.json()) as {
      capital?: string
      currencies?: { code?: string; name?: string; symbol?: string }[]
    }
    const cur = c.currencies?.[0]
    return {
      ...data,
      currency: data.currency.code
        ? data.currency
        : {
            ...data.currency,
            code: cur?.code ?? '',
            name: cur?.name ?? '',
            symbol: cur?.symbol ?? '',
            symbol_native: cur?.symbol ?? '',
          },
      location: { ...data.location, capital: data.location.capital || c.capital || '' },
    }
  } catch {
    return data
  }
}

export async function GET(request: NextRequest) {
  const accessKey = process.env.IPSTACK_ACCESS_KEY?.trim()
  const ipParam = request.nextUrl.searchParams.get('ip')
  const clientIp = getClientIp(request)

  try {
    // Prefer ipstack when a real key is set; otherwise free ipwho.is
    const data = accessKey
      ? await fetchIpstack(accessKey, ipParam, clientIp)
      : await fetchIpwho(ipParam || (isLocalIp(clientIp) ? null : clientIp))

    return NextResponse.json(await fillCountryDetails(data), {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch location data'
    const status =
      err instanceof Error && 'status' in err && typeof (err as { status: unknown }).status === 'number'
        ? (err as { status: number }).status
        : 502

    return NextResponse.json({ error: message }, { status })
  }
}
