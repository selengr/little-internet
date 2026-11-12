import type { IpstackData } from '@/types/ipstack'

export type ResolvedPlace = {
  lat: number
  lon: number
  city?: string
  country?: string
  countryCode?: string
  source: 'ip' | 'browser' | 'search' | 'default'
}

const DEFAULT: ResolvedPlace = {
  lat: 35.6892,
  lon: 51.389,
  city: 'Tehran',
  country: 'Iran',
  countryCode: 'IR',
  source: 'default',
}

export function fromIpstack(data: IpstackData): ResolvedPlace | null {
  const lat = data.latitude
  const lon = data.longitude
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return null
  return {
    lat,
    lon,
    city: data.city || undefined,
    country: data.country_name || undefined,
    countryCode: data.country_code || undefined,
    source: 'ip',
  }
}

export async function geocodeQuery(query: string): Promise<ResolvedPlace | null> {
  const q = query.trim()
  if (!q) return null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1`,
      { headers: { Accept: 'application/json', 'User-Agent': 'LittleInternet/1.0' } },
    )
    if (!res.ok) return null
    const rows = (await res.json()) as { lat?: string; lon?: string; display_name?: string }[]
    const hit = rows[0]
    if (!hit?.lat || !hit?.lon) return null
    const lat = Number(hit.lat)
    const lon = Number(hit.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    const label = hit.display_name?.split(',')[0]?.trim()
    return { lat, lon, city: label, source: 'search' }
  } catch {
    return null
  }
}

export function browserGeolocation(): Promise<ResolvedPlace | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null)
  }
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'browser',
        })
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    )
  })
}

export function defaultPlace(): ResolvedPlace {
  return { ...DEFAULT }
}
