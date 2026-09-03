import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Open Notify is http-only, so the browser can't call it from an https page.
// Everything is proxied through here instead.
const ISS_NOW_URL = 'http://api.open-notify.org/iss-now.json'
const ASTROS_URL = 'http://api.open-notify.org/astros.json'

const CREW_TTL_MS = 10 * 60 * 1000

type Crew = { count: number; craft: { name: string; people: string[] }[] }

let crewCache: { at: number; data: Crew } | null = null

async function getJson(url: string, timeoutMs = 6000): Promise<unknown | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function parsePosition(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as {
    timestamp?: number
    iss_position?: { latitude?: string; longitude?: string }
  }
  const lat = Number(data.iss_position?.latitude)
  const lon = Number(data.iss_position?.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return { lat, lon, timestamp: data.timestamp ?? Math.floor(Date.now() / 1000) }
}

function parseCrew(raw: unknown): Crew | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as { number?: number; people?: { name?: string; craft?: string }[] }
  if (!Array.isArray(data.people)) return null

  const byCraft = new Map<string, string[]>()
  for (const person of data.people) {
    if (!person?.name) continue
    const craft = person.craft?.trim() || 'Unknown'
    const names = byCraft.get(craft)
    if (names) names.push(person.name)
    else byCraft.set(craft, [person.name])
  }

  return {
    count: typeof data.number === 'number' ? data.number : data.people.length,
    craft: [...byCraft.entries()]
      .map(([name, people]) => ({ name, people }))
      .sort((a, b) => b.people.length - a.people.length),
  }
}

// The roster only changes on launches and landings, so it is cached in memory.
async function getCrew(): Promise<Crew | null> {
  if (crewCache && Date.now() - crewCache.at < CREW_TTL_MS) return crewCache.data

  const crew = parseCrew(await getJson(ASTROS_URL))
  if (crew) crewCache = { at: Date.now(), data: crew }

  return crew ?? crewCache?.data ?? null
}

export async function GET() {
  const [position, crew] = await Promise.all([
    getJson(ISS_NOW_URL).then(parsePosition),
    getCrew(),
  ])

  if (!position && !crew) {
    return NextResponse.json({ error: 'upstream unavailable' }, { status: 503 })
  }

  return NextResponse.json(
    { position, crew },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
