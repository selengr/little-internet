import { NextRequest, NextResponse } from 'next/server'
import { createNotionNote, getNotionConfigStatus, listNotionNotes } from '@/lib/notion'
import { requireAdmin } from '@/lib/require-auth'

export const dynamic = 'force-dynamic'

// These notes write straight into Reza's personal Notion workspace, so both
// reading and creating them is admin-only — this was previously open to
// anyone who found the URL.

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const status = getNotionConfigStatus()
  if (!status.configured) {
    return NextResponse.json({ configured: false, notes: [] })
  }

  try {
    const notes = await listNotionNotes()
    return NextResponse.json({ ...status, notes })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load notes'
    return NextResponse.json({ ...status, notes: [], error: message })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const status = getNotionConfigStatus()
  if (!status.configured) {
    return NextResponse.json(
      { error: 'Notion is not configured. Add NOTION_API_KEY and NOTION_DATABASE_ID to .env.local' },
      { status: 503 },
    )
  }

  try {
    const { title, body } = await request.json()
    if (typeof body !== 'string') {
      return NextResponse.json({ error: 'Body is required' }, { status: 400 })
    }

    const page = await createNotionNote(typeof title === 'string' ? title : '', body)
    return NextResponse.json(page)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create note'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
