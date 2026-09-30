// Data sources for the "people off the planet" tracker. Deliberately free of framework imports so
// the parsing and fallback rules can be tested on their own.

export type Crew = {
  count: number
  craft: { name: string; people: string[] }[]
  source: 'corquaid' | 'launch-library'
}

export type Position = {
  lat: number
  lon: number
  timestamp: number
  altitude?: number // km
  velocity?: number // km/h
}

// Open Notify's astros.json is no longer maintained: it still lists the crews from autumn 2024.
// The primary crew source is a community-maintained roster (per-person launch dates, ISS + Tiangong);
// Launch Library 2 is the backup.
const CREW_PRIMARY = 'https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json'
const CREW_BACKUP = 'https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=true&limit=50&mode=list'

const WHERE_THE_ISS = 'https://api.wheretheiss.at/v1/satellites/25544'
const OPEN_NOTIFY_ISS = 'http://api.open-notify.org/iss-now.json'

// Nobody has spent more than ~437 days in orbit in one go. A roster listing someone who launched
// longer ago than this has stopped being updated, so it is rejected instead of trusted.
const MAX_MISSION_DAYS = 500
// How long to give the ISS position source before also asking the backup.
const POSITION_HEAD_START_MS = 1500
// The roster is cached, so a refresh can afford to wait; these only need to beat "hung forever".
const CREW_TIMEOUT_MS = 8000
const CREW_HEAD_START_MS = 3000
const POSITION_TIMEOUT_MS = 5000

async function getJson(url: string, timeoutMs: number): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json', 'User-Agent': 'LittleInternet/1.0 (+https://rezakarbakhsh.ir)' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function group(entries: { name: string; craft: string }[], source: Crew['source']): Crew | null {
  if (entries.length === 0) return null
  const byCraft = new Map<string, string[]>()
  for (const { name, craft } of entries) {
    const names = byCraft.get(craft)
    if (names) names.push(name)
    else byCraft.set(craft, [name])
  }
  return {
    count: entries.length,
    craft: [...byCraft.entries()]
      .map(([name, people]) => ({ name, people }))
      .sort((a, b) => b.people.length - a.people.length),
    source,
  }
}

const isChinese = (agency: unknown) => typeof agency === 'string' && /china|cmsa/i.test(agency)

export function parseCorquaid(raw: unknown, nowSec: number): Crew | null {
  if (!raw || typeof raw !== 'object') return null
  const people = (raw as { people?: unknown }).people
  if (!Array.isArray(people)) return null

  type Person = { name?: unknown; agency?: unknown; spacecraft?: unknown; iss?: unknown; launched?: unknown }
  const valid = (people as Person[]).filter(p => typeof p?.name === 'string' && p.name.trim())
  if (valid.length === 0) return null

  const stale = valid.some(
    p => typeof p.launched === 'number' && nowSec - p.launched > MAX_MISSION_DAYS * 86400,
  )
  if (stale) return null

  return group(
    valid.map(p => ({
      name: (p.name as string).trim(),
      craft: p.iss === true ? 'ISS' : isChinese(p.agency) ? 'Tiangong' : String(p.spacecraft || 'Other'),
    })),
    'corquaid',
  )
}

export function parseLaunchLibrary(raw: unknown): Crew | null {
  if (!raw || typeof raw !== 'object') return null
  const results = (raw as { results?: unknown }).results
  if (!Array.isArray(results)) return null

  type Astronaut = { name?: unknown; agency?: unknown; type?: { name?: unknown } }
  const humans = (results as Astronaut[]).filter(
    // The list includes "Starman", the mannequin in Elon Musk's Tesla Roadster.
    a => typeof a?.name === 'string' && a.name.trim() && a.type?.name !== 'Non-Human',
  )

  return group(
    humans.map(a => ({
      name: (a.name as string).trim(),
      craft: isChinese(a.agency) ? 'Tiangong' : 'ISS',
    })),
    'launch-library',
  )
}

/**
 * Current crew. The primary source is preferred; the backup is only asked when the primary is slow
 * or has failed, and is used only if the primary turns out unusable (down, empty or frozen).
 * Throws when no source can be trusted, so callers never cache a wrong answer.
 */
export async function fetchCrew(): Promise<Crew> {
  const nowSec = Math.floor(Date.now() / 1000)

  const primary = getJson(CREW_PRIMARY, CREW_TIMEOUT_MS).then(raw => parseCorquaid(raw, nowSec))
  const early = await Promise.race([
    primary,
    new Promise<'slow'>(resolve => setTimeout(() => resolve('slow'), CREW_HEAD_START_MS)),
  ])
  if (early && early !== 'slow') return early

  const backup = getJson(CREW_BACKUP, CREW_TIMEOUT_MS).then(parseLaunchLibrary)
  const [fromPrimary, fromBackup] = await Promise.all([primary, backup])

  const crew = fromPrimary ?? fromBackup
  if (!crew) throw new Error('No crew source available')
  return crew
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

async function positionFromWhereTheIss(): Promise<Position> {
  const j = (await getJson(WHERE_THE_ISS, POSITION_TIMEOUT_MS)) as {
    latitude?: unknown
    longitude?: unknown
    timestamp?: unknown
    altitude?: unknown
    velocity?: unknown
  } | null
  if (!j || !finite(j.latitude) || !finite(j.longitude)) throw new Error('wheretheiss.at unavailable')
  return {
    lat: j.latitude,
    lon: j.longitude,
    timestamp: finite(j.timestamp) ? j.timestamp : Math.floor(Date.now() / 1000),
    altitude: finite(j.altitude) ? j.altitude : undefined,
    velocity: finite(j.velocity) ? j.velocity : undefined,
  }
}

async function positionFromOpenNotify(): Promise<Position> {
  const j = (await getJson(OPEN_NOTIFY_ISS, POSITION_TIMEOUT_MS)) as {
    timestamp?: unknown
    iss_position?: { latitude?: string; longitude?: string }
  } | null
  const lat = Number(j?.iss_position?.latitude)
  const lon = Number(j?.iss_position?.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('Open Notify unavailable')
  return { lat, lon, timestamp: finite(j?.timestamp) ? j.timestamp : Math.floor(Date.now() / 1000) }
}

/**
 * Live ISS position. wheretheiss.at is preferred (HTTPS, and includes altitude and speed). If it
 * hasn't answered within a moment, Open Notify is asked too and the first good answer wins.
 */
export async function fetchPosition(): Promise<Position | null> {
  const primary = positionFromWhereTheIss()
  const early = await Promise.race([
    primary.catch(() => null),
    new Promise<'slow'>(resolve => setTimeout(() => resolve('slow'), POSITION_HEAD_START_MS)),
  ])
  if (early && early !== 'slow') return early

  try {
    return await Promise.any([primary, positionFromOpenNotify()])
  } catch {
    return null
  }
}
