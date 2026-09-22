/** Canonical production origin for SEO, sitemap, and absolute Open Graph URLs. */
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null) ||
    'https://rezakarbakhsh.ir') as string

export const SITE_NAME = 'Little Internet'
export const SITE_TAGLINE =
  'Books, crypto markets, poetry, photos, dictionaries, and live tools — Reza Karbakhsh’s little corner of the web.'

export const SITE_DESCRIPTION =
  'Little Internet by Reza Karbakhsh — explore books, live crypto & forex, charts, poetry, photos, jokes, dictionaries, maps, and other free tools in one friendly place.'

/** Public routes included in the sitemap (excludes auth, account, test, offline). */
export const SITEMAP_ROUTES: {
  path: string
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/blog', changeFrequency: 'daily', priority: 0.9 },
  { path: '/books', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/crypto', changeFrequency: 'hourly', priority: 0.85 },
  { path: '/charts', changeFrequency: 'hourly', priority: 0.85 },
  { path: '/convert', changeFrequency: 'weekly', priority: 0.75 },
  { path: '/forex', changeFrequency: 'hourly', priority: 0.75 },
  { path: '/photos', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/poetry', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/dictionary', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/wiktionary', changeFrequency: 'weekly', priority: 0.65 },
  { path: '/countries', changeFrequency: 'monthly', priority: 0.65 },
  { path: '/location', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/jokes', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/animal-facts', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/cat', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/art', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/music', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/lyrics', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/files', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/qr', changeFrequency: 'monthly', priority: 0.5 },
]

export function absoluteUrl(path = '/') {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${p}`
}
