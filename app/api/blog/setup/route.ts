import { NextResponse } from 'next/server'
import { createBlogDatabase, createBlogPost, getBlogConfigStatus } from '@/lib/blog'
import { requireAdmin } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

/**
 * One-shot: create Blog database in Notion + seed a sample published post.
 * Returns databaseId to put in NOTION_BLOG_DATABASE_ID.
 *
 * Admin-only — this writes directly into Reza's Notion workspace.
 */
export async function POST() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const status = await getBlogConfigStatus()
    if (!status.hasApiKey) {
      return NextResponse.json({ error: status.message }, { status: 503 })
    }

    if (status.hasDatabaseId && status.ready) {
      return NextResponse.json({
        alreadyConfigured: true,
        databaseId: process.env.NOTION_BLOG_DATABASE_ID,
        message: 'NOTION_BLOG_DATABASE_ID is already set',
      })
    }

    const created = await createBlogDatabase()

    // Temporarily use the new ID for seeding in this request
    process.env.NOTION_BLOG_DATABASE_ID = created.databaseId

    const sample = await createBlogPost({
      title: 'Welcome to the Blog',
      slug: 'welcome',
      status: 'Published',
      date: new Date().toISOString().slice(0, 10),
      tags: ['Notes', 'Engineering'],
      summary:
        'First post from the Notion-backed blog — cards, banners, and a clean reading layout.',
      introduction:
        'This site uses Notion as a personal CMS. Edit this page in Notion and it shows up here.',
      conclusion:
        'Add more posts in the Blog database, set Status to Published, and fill Banner Image + Author Image URLs.',
      authorName: 'Reza Karbakhsh',
      authorImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
      bannerImage:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=80',
      readingMinutes: 3,
      featured: true,
      markdown: `## Building in public

This post was created automatically when the Blog database was set up.

### What you get

- Clickable cards on \`/blog\`
- Per-post banner + author image in the shared Banner header
- Summary, introduction, body, conclusion, tags, and view count

### Write the next one

Open the **Blog** database in Notion, duplicate this page or add a row, set **Status** to **Published**, and fill the properties.`,
    })

    return NextResponse.json({
      ok: true,
      databaseId: created.databaseId,
      dataSourceId: created.dataSourceId,
      notionUrl: created.url,
      samplePost: { id: sample.id, slug: sample.slug, title: sample.title },
      envLine: `NOTION_BLOG_DATABASE_ID=${created.databaseId}`,
      message:
        'Database created. Add the envLine to .env.local and restart next dev.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Setup failed' },
      { status: 502 },
    )
  }
}
