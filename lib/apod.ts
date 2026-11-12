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

export async function fetchApod(date?: string): Promise<ApodPayload | null> {
  const key = process.env.NASA_API_KEY?.trim() || 'DEMO_KEY'
  const params = new URLSearchParams({ api_key: key })
  if (date) params.set('date', date)

  try {
    const res = await fetch(`${APOD}?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': UA },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const raw = (await res.json()) as ApodRaw
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
  } catch {
    return null
  }
}
