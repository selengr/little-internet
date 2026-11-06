import { SITE_URL, absoluteUrl } from '@/lib/site'

export const GAMES_PAGE_DESCRIPTION =
  'Seven quick tables: Portal Faces, trivia, chess puzzles, Sudoku, Pokémon, Higher or Lower and Rock–Paper–Scissors — pick one, play a round, no account.'

export function gamesPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Games — Little Internet arcade',
    description: GAMES_PAGE_DESCRIPTION,
    url: absoluteUrl('/games'),
    isPartOf: { '@type': 'WebSite', name: 'Little Internet', url: SITE_URL },
  }
}
