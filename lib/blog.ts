import type { BlogConfigStatus, BlogPost, BlogPostMeta, BlogPostStatus } from '@/types/blog'
import {
  BLOG_AUTHOR_IMAGE,
  BLOG_AUTHOR_NAME,
  resolveAuthorImage,
  resolveBannerImage,
} from '@/lib/blog-author'
import {
  NOTION_VERSION,
  notionApiKey,
  notionHeaders,
  notionPageUrl,
  resolveDataSourceId,
} from '@/lib/notion-client'

export const NOTION_BLOG_VERSION = NOTION_VERSION

const DEFAULT_AUTHOR = BLOG_AUTHOR_NAME
const DEFAULT_AUTHOR_IMAGE = BLOG_AUTHOR_IMAGE
const DEFAULT_BANNER = '/images/banners/https___west.avif'

/** Slugs hidden from the public blog (e.g. setup seed posts). */
const EXCLUDED_BLOG_SLUGS = new Set(['welcome'])

function isPublicBlogPost(meta: BlogPostMeta) {
  return meta.status === 'Published' && !EXCLUDED_BLOG_SLUGS.has(meta.slug)
}

function getDatabaseId() {
  return process.env.NOTION_BLOG_DATABASE_ID?.trim() || null
}

export function blogHeaders() {
  return notionHeaders()
}

let cachedBlogDataSourceId: string | null = null

async function blogDataSourceId() {
  const databaseId = getDatabaseId()
  if (!databaseId) throw new Error('NOTION_BLOG_DATABASE_ID is not set')
  if (!cachedBlogDataSourceId) {
    cachedBlogDataSourceId = await resolveDataSourceId(databaseId)
  }
  return cachedBlogDataSourceId
}

function plain(rich?: { plain_text?: string }[] | null) {
  if (!Array.isArray(rich)) return ''
  return rich.map(t => t.plain_text ?? '').join('')
}

function prop(
  properties: Record<string, unknown>,
  names: string[],
): Record<string, unknown> | null {
  for (const name of names) {
    if (properties[name]) return properties[name] as Record<string, unknown>
  }
  const entries = Object.entries(properties)
  for (const name of names) {
    const hit = entries.find(([k]) => k.toLowerCase() === name.toLowerCase())
    if (hit) return hit[1] as Record<string, unknown>
  }
  return null
}

function parseStatus(raw: Record<string, unknown> | null): BlogPostStatus {
  if (!raw) return 'Draft'
  if (raw.type === 'status' && raw.status && typeof raw.status === 'object') {
    const name = (raw.status as { name?: string }).name
    if (name?.toLowerCase() === 'published') return 'Published'
  }
  if (raw.type === 'select' && raw.select && typeof raw.select === 'object') {
    const name = (raw.select as { name?: string }).name
    if (name?.toLowerCase() === 'published') return 'Published'
  }
  return 'Draft'
}

function parseTags(raw: Record<string, unknown> | null): string[] {
  if (!raw || raw.type !== 'multi_select') return []
  const list = raw.multi_select as { name?: string }[] | undefined
  return (list ?? []).map(t => t.name ?? '').filter(Boolean)
}

function parseUrl(raw: Record<string, unknown> | null): string | null {
  if (!raw) return null
  if (raw.type === 'url' && typeof raw.url === 'string') return raw.url
  if (raw.type === 'files' && Array.isArray(raw.files) && raw.files[0]) {
    const f = raw.files[0] as { type?: string; file?: { url?: string }; external?: { url?: string } }
    if (f.type === 'external') return f.external?.url ?? null
    if (f.type === 'file') return f.file?.url ?? null
  }
  return null
}

function parseNumber(raw: Record<string, unknown> | null): number | null {
  if (!raw || raw.type !== 'number') return null
  return typeof raw.number === 'number' ? raw.number : null
}

function parseCover(page: {
  cover?: { type?: string; external?: { url?: string }; file?: { url?: string } } | null
}): string | null {
  const c = page.cover
  if (!c) return null
  if (c.type === 'external') return c.external?.url ?? null
  if (c.type === 'file') return c.file?.url ?? null
  return null
}

function slugify(title: string, fallbackId: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || fallbackId.replace(/-/g, '').slice(0, 12)
  )
}

export function mapNotionPageToMeta(page: {
  id: string
  url?: string
  last_edited_time?: string
  cover?: { type?: string; external?: { url?: string }; file?: { url?: string } } | null
  properties: Record<string, unknown>
}): BlogPostMeta {
  const titleProp = prop(page.properties, ['Title', 'Name', 'title'])
  const slugProp = prop(page.properties, ['Slug', 'slug'])
  const statusProp = prop(page.properties, ['Status', 'Published', 'status'])
  const dateProp = prop(page.properties, ['Date', 'Published At', 'date'])
  const tagsProp = prop(page.properties, ['Tags', 'tags'])
  const summaryProp = prop(page.properties, ['Summary', 'Excerpt', 'summary'])
  const introProp = prop(page.properties, ['Introduction', 'Intro', 'introduction'])
  const conclusionProp = prop(page.properties, ['Conclusion', 'conclusion'])
  const authorNameProp = prop(page.properties, ['Author Name', 'Author', 'author'])
  const authorImageProp = prop(page.properties, ['Author Image', 'AuthorImage'])
  const bannerProp = prop(page.properties, ['Banner Image', 'Banner', 'banner'])
  const viewsProp = prop(page.properties, ['Views', 'views'])
  const readingProp = prop(page.properties, ['Reading Minutes', 'Reading Time', 'reading'])
  const featuredProp = prop(page.properties, ['Featured', 'featured'])

  const title =
    titleProp?.type === 'title' ? plain(titleProp.title as { plain_text?: string }[]) : 'Untitled'

  let slug =
    slugProp?.type === 'rich_text'
      ? plain(slugProp.rich_text as { plain_text?: string }[])
      : ''

  if (!slug) slug = slugify(title, page.id)

  const date =
    dateProp?.type === 'date' && dateProp.date && typeof dateProp.date === 'object'
      ? ((dateProp.date as { start?: string }).start ?? null)
      : null

  const summary =
    summaryProp?.type === 'rich_text'
      ? plain(summaryProp.rich_text as { plain_text?: string }[]) || null
      : null

  const introduction =
    introProp?.type === 'rich_text'
      ? plain(introProp.rich_text as { plain_text?: string }[]) || null
      : null

  const conclusion =
    conclusionProp?.type === 'rich_text'
      ? plain(conclusionProp.rich_text as { plain_text?: string }[]) || null
      : null

  const authorName =
    authorNameProp?.type === 'rich_text'
      ? plain(authorNameProp.rich_text as { plain_text?: string }[]) || DEFAULT_AUTHOR
      : DEFAULT_AUTHOR

  const authorFromProp = parseUrl(authorImageProp)
  const authorImage = resolveAuthorImage(authorFromProp)
  const bannerFromProp = parseUrl(bannerProp)
  const coverUrl = parseCover(page)
  const bannerImage =
    resolveBannerImage(bannerFromProp) || resolveBannerImage(coverUrl) || DEFAULT_BANNER

  const views = parseNumber(viewsProp) ?? 0
  const readingMinutes = parseNumber(readingProp)
  const featured = featuredProp?.type === 'checkbox' ? Boolean(featuredProp.checkbox) : false

  return {
    id: page.id,
    title,
    slug,
    status: parseStatus(statusProp),
    date,
    tags: parseTags(tagsProp),
    summary,
    introduction,
    conclusion,
    authorName,
    authorImage,
    bannerImage,
    views,
    readingMinutes,
    featured,
    coverUrl,
    url: page.url ?? notionPageUrl(page.id),
    lastEdited: page.last_edited_time ?? new Date().toISOString(),
  }
}

export async function getBlogConfigStatus(): Promise<BlogConfigStatus> {
  const hasApiKey = Boolean(notionApiKey())
  const hasDatabaseId = Boolean(getDatabaseId())

  if (!hasApiKey) {
    return {
      hasApiKey: false,
      hasDatabaseId: false,
      ready: false,
      userName: null,
      workspaceName: null,
      step: 1,
      message:
        'NOTION_API_KEY is missing. Set it in Vercel → Settings → Environment Variables (Production), or in .env.local for local dev.',
    }
  }

  try {
    const res = await fetch('https://api.notion.com/v1/users/me', {
      headers: notionHeaders(),
      cache: 'no-store',
    })
    const json = await res.json()
    if (!res.ok) {
      return {
        hasApiKey: true,
        hasDatabaseId,
        ready: false,
        userName: null,
        workspaceName: null,
        step: 1,
        message: json.message ?? `Notion auth failed (${res.status})`,
      }
    }

    const userName = json.bot?.owner?.user?.name ?? json.name ?? 'Notion user'
    const workspaceName = json.bot?.workspace_name ?? null

    if (!hasDatabaseId) {
      return {
        hasApiKey: true,
        hasDatabaseId: false,
        ready: false,
        userName,
        workspaceName,
        step: 2,
        message:
          'NOTION_BLOG_DATABASE_ID is missing. Set it in Vercel → Settings → Environment Variables (Production), or in .env.local for local dev.',
      }
    }

    return {
      hasApiKey: true,
      hasDatabaseId: true,
      ready: true,
      userName,
      workspaceName,
      step: 3,
      message: 'Ready',
      databaseId: getDatabaseId(),
    }
  } catch (err) {
    return {
      hasApiKey: true,
      hasDatabaseId,
      ready: false,
      userName: null,
      workspaceName: null,
      step: 1,
      message: err instanceof Error ? err.message : 'Failed to reach Notion',
    }
  }
}

/** Create Blog database + initial data source with full professional schema. */
export async function createBlogDatabase() {
  const res = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { type: 'workspace', workspace: true },
      title: [{ type: 'text', text: { content: 'Blog' } }],
      description: [
        {
          type: 'text',
          text: { content: 'CMS for rezakarbakhsh.ir /blog — managed via Notion API' },
        },
      ],
      icon: { type: 'emoji', emoji: '✍️' },
      initial_data_source: {
        properties: {
          Title: { type: 'title', title: {} },
          Slug: { type: 'rich_text', rich_text: {} },
          Status: {
            type: 'status',
            status: {
              options: [
                { name: 'Draft', color: 'gray', group: 'To-do' },
                { name: 'Published', color: 'green', group: 'Complete' },
              ],
            },
          },
          Date: { type: 'date', date: {} },
          Tags: {
            type: 'multi_select',
            multi_select: {
              options: [
                { name: 'Engineering', color: 'blue' },
                { name: 'Design', color: 'purple' },
                { name: 'AI', color: 'pink' },
                { name: 'Notes', color: 'yellow' },
              ],
            },
          },
          Summary: { type: 'rich_text', rich_text: {} },
          Introduction: { type: 'rich_text', rich_text: {} },
          Conclusion: { type: 'rich_text', rich_text: {} },
          'Author Name': { type: 'rich_text', rich_text: {} },
          'Author Image': { type: 'url', url: {} },
          'Banner Image': { type: 'url', url: {} },
          Views: { type: 'number', number: { format: 'number' } },
          'Reading Minutes': { type: 'number', number: { format: 'number' } },
          Featured: { type: 'checkbox', checkbox: {} },
        },
      },
    }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.message ?? `Failed to create Blog database (${res.status})`)
  }

  const databaseId = json.id as string
  const dataSourceId = (json.data_sources?.[0]?.id as string | undefined) ?? null
  cachedBlogDataSourceId = dataSourceId

  return {
    databaseId,
    dataSourceId,
    url: json.url as string | undefined,
  }
}

async function queryDataSource(body: Record<string, unknown>) {
  const dataSourceId = await blogDataSourceId()
  const res = await fetch(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = await res.json()
  return { res, json }
}

export async function listPublishedPosts(limit = 48): Promise<BlogPostMeta[]> {
  if (!getDatabaseId()) throw new Error('NOTION_BLOG_DATABASE_ID is not set')

  const { res, json } = await queryDataSource({
    page_size: Math.min(limit, 100),
    sorts: [{ property: 'Date', direction: 'descending' }],
    filter: {
      property: 'Status',
      status: { equals: 'Published' },
    },
  })

  if (!res.ok) {
    const retry = await queryDataSource({
      page_size: Math.min(limit, 100),
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    })
    if (!retry.res.ok) {
      throw new Error(retry.json.message ?? json.message ?? 'Failed to query blog')
    }
    return (retry.json.results ?? [])
      .map(mapNotionPageToMeta)
      .filter(isPublicBlogPost)
  }

  return (json.results ?? []).map(mapNotionPageToMeta).filter(isPublicBlogPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!getDatabaseId()) throw new Error('NOTION_BLOG_DATABASE_ID is not set')

  const { res, json } = await queryDataSource({
    page_size: 1,
    filter: {
      property: 'Slug',
      rich_text: { equals: slug },
    },
  })

  if (!res.ok || !json.results?.length) {
    const all = await listPublishedPosts(100)
    const meta = all.find(p => p.slug === slug)
    if (!meta || !isPublicBlogPost(meta)) return null
    const markdown = await getPageMarkdown(meta.id)
    return { ...meta, markdown }
  }

  const meta = mapNotionPageToMeta(json.results[0])
  if (!isPublicBlogPost(meta)) return null
  const markdown = await getPageMarkdown(meta.id)
  return { ...meta, markdown }
}

export async function getPageMarkdown(pageId: string): Promise<string> {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}/markdown`, {
    headers: notionHeaders(),
    next: { revalidate: 30 },
  })
  const json = await res.json()
  if (!res.ok) {
    if (res.status === 404 || res.status === 400) return ''
    throw new Error(json.message ?? `Failed to load markdown (${res.status})`)
  }
  return typeof json.markdown === 'string' ? json.markdown : ''
}

export async function incrementPostViews(pageId: string, current: number) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(),
    body: JSON.stringify({
      properties: {
        Views: { number: current + 1 },
      },
    }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Failed to update views')
  return current + 1
}

export async function createBlogPost(input: {
  title: string
  slug: string
  markdown: string
  status?: BlogPostStatus
  summary?: string
  introduction?: string
  conclusion?: string
  authorName?: string
  authorImage?: string
  bannerImage?: string
  tags?: string[]
  date?: string
  readingMinutes?: number
  featured?: boolean
}) {
  const dataSourceId = await blogDataSourceId()
  const title = input.title.trim() || 'Untitled'
  const slug = input.slug.trim() || slugify(title, 'post')
  const status = input.status ?? 'Draft'

  const properties: Record<string, unknown> = {
    Title: {
      title: [{ type: 'text', text: { content: title.slice(0, 2000) } }],
    },
    Slug: {
      rich_text: [{ type: 'text', text: { content: slug.slice(0, 200) } }],
    },
    Status: { status: { name: status } },
    'Author Name': {
      rich_text: [
        {
          type: 'text',
          text: { content: (input.authorName ?? DEFAULT_AUTHOR).slice(0, 200) },
        },
      ],
    },
    Views: { number: 0 },
    Featured: { checkbox: Boolean(input.featured) },
  }

  if (input.summary) {
    properties.Summary = {
      rich_text: [{ type: 'text', text: { content: input.summary.slice(0, 2000) } }],
    }
  }
  if (input.introduction) {
    properties.Introduction = {
      rich_text: [{ type: 'text', text: { content: input.introduction.slice(0, 2000) } }],
    }
  }
  if (input.conclusion) {
    properties.Conclusion = {
      rich_text: [{ type: 'text', text: { content: input.conclusion.slice(0, 2000) } }],
    }
  }
  if (input.authorImage) properties['Author Image'] = { url: input.authorImage }
  if (input.bannerImage) properties['Banner Image'] = { url: input.bannerImage }
  if (input.tags?.length) {
    properties.Tags = { multi_select: input.tags.map(name => ({ name })) }
  }
  if (input.date) properties.Date = { date: { start: input.date } }
  if (typeof input.readingMinutes === 'number') {
    properties['Reading Minutes'] = { number: input.readingMinutes }
  }

  const bodyMarkdown = input.markdown.trim().startsWith('#')
    ? input.markdown
    : `# ${title}\n\n${input.markdown}`

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties,
      cover: input.bannerImage
        ? { type: 'external', external: { url: input.bannerImage } }
        : undefined,
      markdown: bodyMarkdown,
    }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message ?? 'Failed to create post')
  return mapNotionPageToMeta(json)
}
