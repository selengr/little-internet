import { GAMES } from '@/lib/games-catalog'
import { SITE_URL, absoluteUrl } from '@/lib/site'

export const GAMES_PAGE_DESCRIPTION =
  'Seven quick tables: Portal Faces, trivia, chess puzzles, Sudoku, Pokémon, Higher or Lower and Rock–Paper–Scissors — pin favorites, filter by mood, search with ?q=, press ? for help, no account.'

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

export function gamesBreadcrumbJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Games', item: absoluteUrl('/games') },
    ],
  }
}

export function gamesArcadeItemListJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Little Internet arcade tables',
    numberOfItems: GAMES.length,
    itemListElement: GAMES.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: game.name,
      description: game.tag,
      url: absoluteUrl(`/games?mode=${game.id}`),
    })),
  }
}
