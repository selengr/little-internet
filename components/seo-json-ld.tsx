import Script from 'next/script'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site'

/** Sitewide JSON-LD for Google rich results (WebSite + Person + ItemList of tools). */
export function SeoJsonLd() {
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['rezakarbakhsh.ir', 'Little Net'],
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: {
      '@type': 'Person',
      name: 'Reza Karbakhsh',
      url: SITE_URL,
      jobTitle: 'Software developer',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/dictionary?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Reza Karbakhsh',
    url: SITE_URL,
    jobTitle: 'IT specialist and software developer',
    description:
      'Software developer exploring AI, markets, books, and building Little Internet in public.',
    image: absoluteUrl('/LOGO/rk-dark-logo.png'),
    sameAs: [] as string[],
  }

  const tools = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Little Internet tools',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Crypto markets', url: absoluteUrl('/crypto') },
      { '@type': 'ListItem', position: 2, name: 'Gold', url: absoluteUrl('/gold') },
      { '@type': 'ListItem', position: 3, name: 'Charts', url: absoluteUrl('/charts') },
      { '@type': 'ListItem', position: 4, name: 'Books', url: absoluteUrl('/books') },
      { '@type': 'ListItem', position: 5, name: 'Blog', url: absoluteUrl('/blog') },
      { '@type': 'ListItem', position: 6, name: 'Poetry', url: absoluteUrl('/poetry') },
      { '@type': 'ListItem', position: 7, name: 'Photos', url: absoluteUrl('/photos') },
      { '@type': 'ListItem', position: 8, name: 'Dictionary', url: absoluteUrl('/dictionary') },
      { '@type': 'ListItem', position: 9, name: 'Pronunciation Studio', url: absoluteUrl('/studio') },
      { '@type': 'ListItem', position: 10, name: 'Currency convert', url: absoluteUrl('/convert') },
    ],
  }

  const payload = [website, person, tools]

  return (
    <Script
      id="seo-json-ld"
      type="application/ld+json"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  )
}
