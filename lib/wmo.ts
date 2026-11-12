/** WMO weather interpretation codes (Open-Meteo). */

export type SkyMood = 'clear' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

export function wmoLabel(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 85 && code <= 86) return 'Snow showers'
  if (code >= 95 && code <= 99) return 'Thunderstorm'
  return 'Weather'
}

export function wmoMood(code: number): SkyMood {
  if (code === 0 || code === 1) return 'clear'
  if (code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67 || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 71 && code <= 77 || (code >= 85 && code <= 86)) return 'snow'
  if (code >= 95) return 'storm'
  return 'partly'
}

export const SKY_PALETTES: Record<
  SkyMood,
  { colors: string[]; back: string; accent: string }
> = {
  clear: {
    colors: ['#7dd3fc', '#38bdf8', '#0ea5e9', '#fbbf24'],
    back: '#0c1222',
    accent: '#7dd3fc',
  },
  partly: {
    colors: ['#94a3b8', '#64748b', '#38bdf8', '#e2e8f0'],
    back: '#0f172a',
    accent: '#94a3b8',
  },
  cloud: {
    colors: ['#475569', '#64748b', '#94a3b8', '#cbd5e1'],
    back: '#111827',
    accent: '#94a3b8',
  },
  fog: {
    colors: ['#d4d4d8', '#a1a1aa', '#71717a', '#e4e4e7'],
    back: '#18181b',
    accent: '#d4d4d8',
  },
  drizzle: {
    colors: ['#64748b', '#475569', '#38bdf8', '#1e293b'],
    back: '#0f172a',
    accent: '#64748b',
  },
  rain: {
    colors: ['#334155', '#1e3a5f', '#2563eb', '#475569'],
    back: '#020617',
    accent: '#60a5fa',
  },
  snow: {
    colors: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#f8fafc'],
    back: '#0f172a',
    accent: '#e2e8f0',
  },
  storm: {
    colors: ['#312e81', '#1e1b4b', '#6366f1', '#0f172a'],
    back: '#030712',
    accent: '#a5b4fc',
  },
}
