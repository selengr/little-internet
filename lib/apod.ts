const APOD = 'https://api.nasa.gov/planetary/apod'
const UA = 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)'

export type ApodPayload = {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  mediaType: 'image' | 'video'
  copyright?: string
  fallback?: boolean
}

type ApodRaw = {
  date?: string
  title?: string
  explanation?: string
  url?: string
  hdurl?: string
  media_type?: string
  copyright?: string
}

const FALLBACK: ApodPayload = {
  date: new Date().toISOString().slice(0, 10),
  title: 'Earth from orbit',
  explanation:
    'When the NASA APOD API is busy, Little Internet shows a stand-in sky — set NASA_API_KEY on the server for the daily image.',
  url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2000&q=80',
  mediaType: 'image',
  fallback: true,
}

function mapRaw(raw: ApodRaw): ApodPayload | null {
  if (!raw.title || !raw.url) return null
  const mediaType = raw.media_type === 'video' ? 'video' : 'image'
  return {
    date: raw.date ?? new Date().toISOString().slice(0, 10),
    title: raw.title,
    explanation: (raw.explanation ?? '').trim(),
    url: raw.url,
    hdurl: raw.hdurl,
    mediaType,
    copyright: raw.copyright,
  }
}

async function nasaApod(key: string): Promise<ApodPayload | null> {
  const params = new URLSearchParams({ api_key: key, thumbs: 'true' })
  try {
    const res = await fetch(`${APOD}?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const raw = (await res.json()) as ApodRaw
    return mapRaw(raw)
  } catch {
    return null
  }
}

/** Always returns something displayable — NASA primary, built-in image as backup. */
export async function fetchApod(date?: string): Promise<ApodPayload> {
  const key = process.env.NASA_API_KEY?.trim() || 'DEMO_KEY'
  const params = new URLSearchParams({ api_key: key, thumbs: 'true' })
  if (date) params.set('date', date)

  if (date) {
    try {
      const res = await fetch(`${APOD}?${params}`, {
        headers: { Accept: 'application/json', 'User-Agent': UA },
        signal: AbortSignal.timeout(12_000),
        next: { revalidate: 3600 },
      })
      if (res.ok) {
        const mapped = mapRaw((await res.json()) as ApodRaw)
        if (mapped) return mapped
      }
    } catch {
      /* fall through */
    }
  }

  const primary = await nasaApod(key)
  if (primary) return primary

  if (key !== 'DEMO_KEY' && process.env.NASA_API_KEY) {
    const demo = await nasaApod('DEMO_KEY')
    if (demo) return demo
  }

  return FALLBACK
}
