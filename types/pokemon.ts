export interface PokemonRound {
  id: number
  name: string
  artwork: string
  types: string[]
}

export type PokemonGeneration = 'kanto' | 'all'
