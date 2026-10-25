export type RickCharacter = {
  id: number
  name: string
  status: string
  species: string
  image: string
  origin: string
}

type ApiCharacter = {
  id: number
  name: string
  status: string
  species: string
  image: string
  origin?: { name?: string }
}

const PAGES = 42
let pool: RickCharacter[] | null = null

function mapChar(c: ApiCharacter): RickCharacter {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    species: c.species,
    image: c.image,
    origin: c.origin?.name || 'Unknown',
  }
}

async function fetchPage(page: number): Promise<RickCharacter[]> {
  const res = await fetch(`https://rickandmortyapi.com/api/character?page=${page}`)
  if (!res.ok) throw new Error('rick and morty unavailable')
  const json = (await res.json()) as { results?: ApiCharacter[] }
  return (json.results ?? []).map(mapChar)
}

/** Load a mixed pool once per session so rounds stay instant. */
export async function loadRickPool(): Promise<RickCharacter[]> {
  if (pool && pool.length > 20) return pool
  const pages = new Set<number>()
  while (pages.size < 4) pages.add(1 + Math.floor(Math.random() * PAGES))
  const batches = await Promise.all([...pages].map(fetchPage))
  const seen = new Set<number>()
  pool = batches.flat().filter(c => {
    if (seen.has(c.id) || !c.image || !c.name) return false
    seen.add(c.id)
    return true
  })
  return pool
}

export function pickRound(pool: RickCharacter[], used: Set<number>, decoys = 3) {
  const fresh = pool.filter(c => !used.has(c.id))
  const source = fresh.length > decoys ? fresh : pool
  const answer = source[Math.floor(Math.random() * source.length)]
  const others = pool.filter(c => c.id !== answer.id)
  const names = new Set<string>([answer.name])
  const options = [answer]
  while (options.length < decoys + 1 && others.length) {
    const pick = others[Math.floor(Math.random() * others.length)]
    if (names.has(pick.name)) continue
    names.add(pick.name)
    options.push(pick)
  }
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { answer, options }
}
