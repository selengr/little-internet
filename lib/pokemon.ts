import type { PokemonGeneration, PokemonRound } from '@/types/pokemon'

/** Base-form species only — stays clear of the high-numbered mega/regional-form ids. */
export const POKEMON_RANGES: Record<PokemonGeneration, [number, number]> = {
  kanto: [1, 151],
  all: [1, 1025],
}

export function formatPokemonName(raw: string): string {
  return raw
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function randomId(range: [number, number], exclude: Set<number>): number {
  const [min, max] = range
  let id = min
  for (let i = 0; i < 20; i++) {
    id = Math.floor(Math.random() * (max - min + 1)) + min
    if (!exclude.has(id)) break
  }
  return id
}

export async function fetchPokemonRound(
  gen: PokemonGeneration,
  usedIds: Set<number>,
): Promise<PokemonRound> {
  const range = POKEMON_RANGES[gen]
  for (let attempt = 0; attempt < 6; attempt++) {
    const id = randomId(range, usedIds)
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const artwork: string | null = data?.sprites?.other?.['official-artwork']?.front_default
      if (!artwork) continue
      usedIds.add(id)
      return {
        id,
        name: formatPokemonName(data.name),
        artwork,
        types: (data.types ?? []).map((t: { type: { name: string } }) => t.type.name),
      }
    } catch {
      // try another id
    }
  }
  throw new Error('Could not load a Pokémon right now.')
}

/** A handful of other names from the same range, for multiple-choice decoys. */
export async function fetchDecoyNames(
  gen: PokemonGeneration,
  exclude: Set<number>,
  count: number,
): Promise<string[]> {
  const range = POKEMON_RANGES[gen]
  const names: string[] = []
  const picked = new Set<number>(exclude)

  for (let i = 0; i < count * 3 && names.length < count; i++) {
    const id = randomId(range, picked)
    picked.add(id)
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`, {
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const name = formatPokemonName(data.name)
      if (!names.includes(name)) names.push(name)
    } catch {
      // skip
    }
  }
  return names
}
