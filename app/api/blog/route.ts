import { NextResponse } from 'next/server'
import { getBlogConfigStatus, listPublishedPosts } from '@/lib/blog'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') ?? 'status'

  try {
    if (action === 'status') {
      const status = await getBlogConfigStatus()
      return NextResponse.json(status)
    }

    if (action === 'posts') {
      const status = await getBlogConfigStatus()
      if (!status.ready) {
        return NextResponse.json(
          { error: status.message, step: status.step, status },
          { status: 503 },
        )
      }
      const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '24') || 24, 1), 48)
      const posts = await listPublishedPosts(limit)
      return NextResponse.json({ posts, count: posts.length })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Blog API failed' },
      { status: 502 },
    )
  }
}
