const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
const UA = 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)'

export type WeatherBundle = {
  place: {
    lat: number
    lon: number
    city?: string
    country?: string
    countryCode?: string
  }
  timezone: string
  current: {
    time: string
    temperature: number
    apparent: number
    humidity: number
    wind: number
    code: number
  }
  hourly: {
    time: string[]
    temperature: number[]
    code: number[]
  }
  daily: {
    dates: string[]
    tempMax: number[]
    tempMin: number[]
    code: number[]
    sunrise: string[]
    sunset: string[]
  }
}

type OpenMeteoCurrent = {
  time?: string
  temperature_2m?: number
  apparent_temperature?: number
  relative_humidity_2m?: number
  weather_code?: number
  wind_speed_10m?: number
}

type OpenMeteoJson = {
  timezone?: string
  current?: OpenMeteoCurrent
  hourly?: {
    time?: string[]
    temperature_2m?: number[]
    weather_code?: number[]
  }
  daily?: {
    time?: string[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    weather_code?: number[]
    sunrise?: string[]
    sunset?: string[]
  }
}

export async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherBundle> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: 'auto',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    hourly: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
    forecast_days: '8',
  })

  const res = await fetch(`${OPEN_METEO}?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
    signal: AbortSignal.timeout(12_000),
    next: { revalidate: 300 },
  })

  if (!res.ok) throw new Error('Forecast unavailable')

  const data = (await res.json()) as OpenMeteoJson
  const cur = data.current ?? {}
  const hourly = data.hourly ?? {}
  const daily = data.daily ?? {}

  const now = cur.time ?? new Date().toISOString()
  const nowMs = new Date(now).getTime()
  const times = hourly.time ?? []
  const temps = hourly.temperature_2m ?? []
  const codes = hourly.weather_code ?? []

  let start = times.findIndex(t => new Date(t).getTime() >= nowMs - 3_600_000)
  if (start < 0) start = 0

  return {
    place: { lat, lon },
    timezone: data.timezone ?? 'UTC',
    current: {
      time: now,
      temperature: cur.temperature_2m ?? 0,
      apparent: cur.apparent_temperature ?? cur.temperature_2m ?? 0,
      humidity: cur.relative_humidity_2m ?? 0,
      wind: cur.wind_speed_10m ?? 0,
      code: cur.weather_code ?? 0,
    },
    hourly: {
      time: times.slice(start, start + 24),
      temperature: temps.slice(start, start + 24),
      code: codes.slice(start, start + 24),
    },
    daily: {
      dates: daily.time ?? [],
      tempMax: daily.temperature_2m_max ?? [],
      tempMin: daily.temperature_2m_min ?? [],
      code: daily.weather_code ?? [],
      sunrise: daily.sunrise ?? [],
      sunset: daily.sunset ?? [],
    },
  }
}
