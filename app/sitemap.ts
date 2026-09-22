import type { MetadataRoute } from 'next'
import { listPublishedPosts } from '@/lib/blog'
import { SITE_URL, SITEMAP_ROUTES } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = SITEMAP_ROUTES.map(route => ({
    url: `${SITE_URL}${route.path === '/' ? '' : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await listPublishedPosts(100)
    blogEntries = posts.map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.lastEdited ? new Date(post.lastEdited) : post.date ? new Date(post.date) : now,
      changeFrequency: 'weekly' as const,
      priority: post.featured ? 0.85 : 0.7,
    }))
  } catch (err) {
    console.error('[sitemap] blog posts unavailable', err)
  }

  return [...staticEntries, ...blogEntries]
}
